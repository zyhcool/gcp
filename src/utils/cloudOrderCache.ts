import { IVmConfig } from "../entities/vmEntity";
import { Cache } from "./cache";

export interface ICloudOrderCache {
    orderId: string
    num: number
    config: IVmConfig,
    completed: number;
    failed: number;
}

export default class CloudOrderCache {
    private static prefix: string = 'cloudOrder:'
    // 2小时后过期
    private static expire = 2 * 60 * 60;

    static get(orderId: string) {
        return Cache.get(this.prefix + orderId)
    }

    static set(orderId: string, value: any, expire: number = this.expire) {
        const exist = Cache.get(this.prefix + orderId)
        if (exist && exist.expireTime < new Date() && exist.value.num > exist.value.completed) {
            throw new Error('没结束')
        }
        Cache.set(this.prefix + orderId, value, expire)
    }

    /**
     * @description 完成一台部署后，缓存中成功数加一
     * @param {} 
     * @return {} 
     */
    static complete(orderId: string) {
        let cache = this.get(orderId)
        let { num, completed } = cache.value;
        if (num <= completed) {
            throw new Error('超过了')
        }
        cache.value.completed++
        Cache.update(this.prefix + orderId, cache)
    }

    /**
     * @description 部署失败后，缓存中失败数加一
     * @param {} 
     * @return {} 
     */
    static fail(orderId: string) {
        let cache = this.get(orderId)
        cache.value.faild++
        Cache.update(this.prefix + orderId, cache)
    }

    static delete(orderId: string) {
        Cache.delete(this.prefix + orderId);
    }
}