
import { BaseService } from "./baseService"
import { Order, orderRepository, OrderStatus } from "../entities/orderEntity";
import GcpManager from "../cloud/gcpManager";
import { IVmConfig } from "../entities/vmEntity";
import { instanceRepository, instanceStatus } from "../entities/instanceEntity";


export class OrderService extends BaseService<Order>{
    repository = orderRepository



    async retryDeploy() {
        const orders = await this.find({ status: OrderStatus.unvalid })
        for (let order of orders) {
            console.log(`重新部署订单${order.orderId}，剩余台数: ${order.left}`)
            this.deployOrder(order.orderId, 1, order.left, order.config, 'fakeuser')
        }
    }

    async deployOrder(orderId: string, time: number, num: number, config: IVmConfig, user: string) {

        const gcp = new GcpManager(orderId, time, num, config, user)
        gcp.start();
        gcp.on('complete', async () => {
            console.log('complete !!')
            await orderRepository.updateOne({ orderId }, { $set: { left: 0 } })
            // 订单实例全部成功，交付实例
            await instanceRepository.updateMany({ iporderId: orderId }, { $set: { status: instanceStatus.delivery } })
        })
        gcp.on('success', async (data) => {
            console.log('success !!')
            await instanceRepository.create(Object.assign({}, data, {
                iporderId: orderId,
                status: instanceStatus.deploy,
            }))
        })
        gcp.on('timeout', async (left: number) => {
            console.log('timeout !!', orderId)
            await orderRepository.updateOne({ orderId }, { $set: { left, status: OrderStatus.unvalid } })
        })
    }
}