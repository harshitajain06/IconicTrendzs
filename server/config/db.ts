import mongoose from "mongoose";
import Address from "../models/Address.js";

const connectDB = async () => {
    mongoose.connection.on("connected", () => {
        console.log("MongoDB connected");
    });
    await mongoose.connect(process.env.MONGODB_URI as string);
    await Address.syncIndexes();
};

export default connectDB;
