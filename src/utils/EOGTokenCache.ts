import axios from "axios";
import { Config } from "../config";
import { Cache } from "./cache";


export default class EOGTokenCache {
    private static prefix: string = 'eogToken:'
    // 2小时后过期
    private static expire = 2 * 60 * 60;

    static async getToken() {
        let token = Cache.getValue(this.prefix)
        if (!token) {
            token = await this.loginEOG()
        }
        return token
    }

    static loginEOG() {
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
                resolve(responseBody.token)
                this.setToken(responseBody.token)
            }).catch((e) => {
                reject(e)
            })
        })
    }

    static setToken(token: string) {
        Cache.set(this.prefix, token, Config.EOG.tokenExpireTime | this.expire);
    }
}