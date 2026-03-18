import mongoose from "mongoose";
import { IUser } from "../types/index.js"; 

const userSchema = new mongoose.Schema<IUser>({
    name: {
        type: String,
        trim: true,
        required: true,
    },
    email: {
        type: String,
        unique: true,
        trim: true,
        required: true,
    },
    clerkId: {
        type: String,
        unique: true,
        sparse: true,
    },
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user",
    },
    image: {
        type: String,
    }
}, { timestamps: true });

const User = mongoose.model<IUser>("User", userSchema);

export default User;