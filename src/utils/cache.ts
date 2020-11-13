export interface ICache {
    value: any;
    expireTime: Date;
    lastTime: Date;
    [key: string]: any;
}

export class Cache {
    private static cacheMap = new Map<string, ICache>();

    static getValue(key: string) {
        if (this.cacheMap.has(key)) {
            if (this.cacheMap.get(key).expireTime <= new Date()) {
                this.cacheMap.delete(key)
            } else {
                return this.cacheMap.get(key).value
            }
        } else {
            return null
        }
    }

    static get(key: string) {
        return this.cacheMap.get(key)
    }

    static set(key: string, value: any, expire: number, other?: { [key: string]: any }) {
        const expireTime = new Date();
        expireTime.setSeconds(expireTime.getSeconds() + expire);
        const cache: ICache = Object.assign({}, {
            value, expireTime,
            lastTime: new Date(),
        }, other)
        this.cacheMap.set(key, cache);
    }


    static delete(key: string) {
        if (this.cacheMap.has(key)) {
            this.cacheMap.delete(key);
        }
    }

    static update(key: string, update: Partial<ICache>) {
        if (this.cacheMap.has(key)) {
            let cache = this.cacheMap.get(key);
            cache = Object.assign({}, cache, update, { lastTime: new Date() })
            this.cacheMap.set(key, cache)
            return cache;
        }
    }


    static clearExpired() {
        this.cacheMap.forEach((value, key) => {
            if (value.expireTime <= new Date()) {
                this.cacheMap.delete(key)
            }
        })
    }
}