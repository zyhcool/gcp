
import { BaseService } from "./baseService"
import { Order, orderRepository } from "../entities/orderEntity";


export class OrderService extends BaseService<Order>{
    repository = orderRepository

}