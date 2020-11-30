
import mongoose from "mongoose"
import { IVmConfig } from "./vmEntity";

export class Order {
    orderId: string;
    status: OrderStatus;
    left: number;
    config: IVmConfig;

}

type OrderDocument = mongoose.Document & Order;

const orderSchema = new mongoose.Schema({
    orderId: String,
    status: Number,
    left: Number,
    config: Object,

}, { timestamps: true })

export const orderRepository = mongoose.model<OrderDocument>("Order", orderSchema)

export enum OrderStatus {
    deploying = 1,
    deployed = 2,
    unvalid = 3,
}