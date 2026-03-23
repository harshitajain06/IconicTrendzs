import crypto from "crypto";
import Razorpay from "razorpay";
import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import { Request, Response } from "express";

const getRazorpay = () => {
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_id || !key_secret) {
        throw new Error("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set");
    }
    return new Razorpay({ key_id, key_secret });
};

/** Cart totals are stored in USD; Razorpay (India) expects INR in paise. */
function usdTotalToPaise(usdAmount: number): number {
    const rate = Number(process.env.USD_TO_INR_RATE || "83");
    const inr = usdAmount * rate;
    return Math.round(inr * 100);
}

/**
 * POST /api/payments/razorpay-order
 * Creates a Razorpay Order for an existing MongoDB order (paymentMethod razorpay, pending).
 */
export const createRazorpayOrder = async (req: Request, res: Response) => {
    try {
        const { orderId } = req.body as { orderId?: string };
        if (!orderId) {
            return res.status(400).json({ success: false, message: "orderId is required" });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }
        if (order.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "Not authorized" });
        }
        if (order.paymentMethod !== "razorpay") {
            return res.status(400).json({ success: false, message: "Invalid payment method for this order" });
        }
        if (order.paymentStatus === "paid") {
            return res.status(400).json({ success: false, message: "Order already paid" });
        }

        const amountPaise = usdTotalToPaise(order.totalAmount);
        if (amountPaise < 100) {
            return res.status(400).json({ success: false, message: "Amount must be at least ₹1 (100 paise)" });
        }

        const razorpay = getRazorpay();
        const rzpOrder = await razorpay.orders.create({
            amount: amountPaise,
            currency: "INR",
            receipt: order.orderNumber.slice(0, 40),
            notes: {
                mongoOrderId: order._id.toString(),
                appId: "iconic-trendzs",
            },
        });

        order.paymentIntentId = rzpOrder.id;
        await order.save();

        res.json({
            success: true,
            keyId: process.env.RAZORPAY_KEY_ID,
            orderId: rzpOrder.id,
            amount: rzpOrder.amount,
            currency: rzpOrder.currency,
        });
    } catch (error: any) {
        console.error("createRazorpayOrder:", error);
        res.status(500).json({ success: false, message: error.message || "Failed to create Razorpay order" });
    }
};

/**
 * POST /api/payments/verify
 * Verifies signature and marks order paid (primary path after client-side checkout).
 */
export const verifyRazorpayPayment = async (req: Request, res: Response) => {
    try {
        const {
            mongoOrderId,
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
        } = req.body as {
            mongoOrderId?: string;
            razorpay_order_id?: string;
            razorpay_payment_id?: string;
            razorpay_signature?: string;
        };

        if (!mongoOrderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ success: false, message: "Missing payment fields" });
        }

        const secret = process.env.RAZORPAY_KEY_SECRET;
        if (!secret) {
            return res.status(500).json({ success: false, message: "Server payment config error" });
        }

        const body = `${razorpay_order_id}|${razorpay_payment_id}`;
        const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
        if (expected !== razorpay_signature) {
            return res.status(400).json({ success: false, message: "Invalid payment signature" });
        }

        const order = await Order.findById(mongoOrderId);
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }
        if (order.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "Not authorized" });
        }
        if (order.paymentIntentId && order.paymentIntentId !== razorpay_order_id) {
            return res.status(400).json({ success: false, message: "Order id mismatch" });
        }

        order.paymentStatus = "paid";
        order.paymentMethod = "razorpay";
        order.paymentIntentId = razorpay_order_id;
        await order.save();

        const cart = await Cart.findOne({ user: order.user });
        if (cart) {
            cart.items = [];
            cart.totalAmount = 0;
            await cart.save();
        }

        res.json({ success: true, message: "Payment verified" });
    } catch (error: any) {
        console.error("verifyRazorpayPayment:", error);
        res.status(500).json({ success: false, message: error.message || "Verification failed" });
    }
};

/**
 * POST /api/payments/webhook
 * Backup path when client verification is unreliable; verify HMAC of raw body.
 */
export const handleRazorpayWebhook = async (req: Request, res: Response) => {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
        console.warn("RAZORPAY_WEBHOOK_SECRET not set; webhook ignored");
        return res.status(503).send("Webhook not configured");
    }

    const signature = req.headers["x-razorpay-signature"] as string | undefined;
    const rawBody = req.body instanceof Buffer ? req.body.toString("utf8") : String(req.body);

    if (!signature) {
        return res.status(400).send("Missing signature");
    }

    const expected = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
    if (expected !== signature) {
        return res.status(400).send("Invalid signature");
    }

    let payload: { event?: string; payload?: { payment?: { entity?: { order_id?: string; id?: string } } } };
    try {
        payload = JSON.parse(rawBody);
    } catch {
        return res.status(400).send("Invalid JSON");
    }

    if (payload.event !== "payment.captured") {
        return res.json({ ok: true });
    }

    const entity = payload.payload?.payment?.entity;
    const razorpayOrderId = entity?.order_id;
    if (!razorpayOrderId) {
        return res.json({ ok: true });
    }

    try {
        const order = await Order.findOne({ paymentIntentId: razorpayOrderId });
        if (order && order.paymentStatus !== "paid") {
            order.paymentStatus = "paid";
            order.paymentMethod = "razorpay";
            await order.save();

            const cart = await Cart.findOne({ user: order.user });
            if (cart) {
                cart.items = [];
                cart.totalAmount = 0;
                await cart.save();
            }
        }
    } catch (e: any) {
        console.error("handleRazorpayWebhook:", e);
        return res.status(500).send("Processing error");
    }

    res.json({ ok: true });
};
