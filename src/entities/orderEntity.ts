
import mongoose from "mongoose"

export class Order {
    orderId: string;
    status: OrderStatus;
    left: number;

}

type OrderDocument = mongoose.Document & Order;

const orderSchema = new mongoose.Schema({
    orderId: String,
    status: Number,
    left: Number,

}, { timestamps: true })

export const orderRepository = mongoose.model<OrderDocument>("Order", orderSchema)

export enum OrderStatus {
    deploying = 1,
    deployed = 2,
    unvalid = 3,
}