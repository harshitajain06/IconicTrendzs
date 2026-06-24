import mongoose, { Schema } from "mongoose";
import { IReview } from "../types/index.js";

const reviewSchema = new Schema<IReview>(
    {
        user: { type: Schema.Types.ObjectId, ref: "User", required: true },
        product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
        comment: { type: String, required: true, trim: true },
        userName: { type: String, required: true },
    },
    { timestamps: true }
);

reviewSchema.index({ user: 1, product: 1 }, { unique: true });

const Review = mongoose.model<IReview>("Review", reviewSchema);

export default Review;
