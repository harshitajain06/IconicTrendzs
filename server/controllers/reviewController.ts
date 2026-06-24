import { Request, Response } from "express";
import Review from "../models/Review.js";
import Product from "../models/Product.js";

// GET /api/products/:id/reviews
export const getReviews = async (req: Request, res: Response) => {
    try {
        const reviews = await Review.find({ product: req.params.id }).sort({ createdAt: -1 });
        res.json({ success: true, data: reviews });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/products/:id/reviews
export const createReview = async (req: Request, res: Response) => {
    try {
        const { rating, comment } = req.body;
        const productId = req.params.id;

        if (!rating || !comment) {
            return res.status(400).json({ success: false, message: "Rating and comment are required" });
        }

        const existing = await Review.findOne({ user: req.user._id, product: productId });
        if (existing) {
            return res.status(400).json({ success: false, message: "You have already reviewed this product" });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        const review = await Review.create({
            user: req.user._id,
            product: productId,
            rating: Number(rating),
            comment,
            userName: req.user.name,
        });

        // Recalculate product ratings
        const allReviews = await Review.find({ product: productId });
        const count = allReviews.length;
        const average = allReviews.reduce((sum, r) => sum + r.rating, 0) / count;

        await Product.findByIdAndUpdate(productId, {
            "ratings.average": Math.round(average * 10) / 10,
            "ratings.count": count,
        });

        res.status(201).json({ success: true, data: review });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
