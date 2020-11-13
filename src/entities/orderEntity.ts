
import mongoose from "mongoose"

export class Order {
    orderId: string;
    left: number;

}

type OrderDocument = mongoose.Document & Order;

const orderSchema = new mongoose.Schema({
    orderId: String,
    left: Number,

}, { timestamps: true })

export const orderRepository = mongoose.model<OrderDocument>("Order", orderSchema)
