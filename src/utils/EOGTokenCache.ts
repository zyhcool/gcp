import axios from "axios";
import { Config } from "../config";
import { Cache } from "./cache";


export default class EOGTokenCache {
    private static prefix: string = 'eogToken:'
    // 1小时后过期
    private static expire = 1 * 60 * 60;

    static async getToken() {
        let cache = Cache.get(this.prefix)
        let token = cache && cache.value
        if (!token || cache.expireTime.getTime() < Date.now() + 2.5 * 60 * 1000) {
            token = await this.loginEOG()
            this.setToken(token)
        }
        return token
    }

    private static loginEOG() {
        const EOG = Config.EOG;
        return new Promise((resolve, reject) => {
            axios.request({
                url: EOG.baseUrl + EOG.loginPath,
                method: EOG.loginMethod,
                data: {
                    email: EOG.email,
                    password: EOG.password,
                }
            }).then((res) => {
                const responseBody = res.data;
                resolve(responseBody.data.token)
                this.setToken(responseBody.data.token)
            }).catch((e) => {
                reject(e)
            })
        })
    }

    static setToken(token: string) {
        Cache.set(this.prefix, token, Config.EOG.tokenExpireTime | this.expire);
    }
}