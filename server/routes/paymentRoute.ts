import express from "express";
import { createRazorpayOrder, verifyRazorpayPayment } from "../controllers/paymentController.js";
import { protect } from "../middleware/auth.js";

const paymentRouter = express.Router();

paymentRouter.post("/razorpay-order", protect, createRazorpayOrder);
paymentRouter.post("/verify", protect, verifyRazorpayPayment);

export default paymentRouter;
