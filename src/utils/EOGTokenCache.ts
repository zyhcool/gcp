import axios from "axios";
import { write, writeFileSync } from "fs";
import { Token } from "typedi";
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
                console.log(responseBody, typeof responseBody.code)
                if (responseBody.code === 0) {
                    resolve(responseBody.data.token)
                    this.setToken(responseBody.data.token)
                } else {
                    reject(responseBody.code)
                }
            }).catch((e) => {
                reject(e)
            })
        })
    }

    static setToken(token: string) {
        Cache.set(this.prefix, token, Config.EOG.tokenExpireTime | this.expire);
    }

    static getAuthCode(token: string) {
        const EOG = Config.EOG;
        return new Promise((resolve, reject) => {
            axios.request({
                url: EOG.baseUrl + EOG.authPath,
                method: EOG.authMethod,
                headers: {
                    "token": token,
                },
                data: {
                    orderNumber: 'orderNumber',
                    target: 'target',
                    sequenceCode: 'e63e5e5cff078857ca5c1d6a4a03c6e7d5e6eb1784fedc90a6ba0fbc5b913460'
                }
            }).then((res) => {
                const responseBody = res.data;
                console.log(responseBody.data)
                if (responseBody.code === 0) {
                    writeFileSync('authfile.data', Buffer.from(responseBody.data))
                    resolve(responseBody.data)
                } else {
                    reject(responseBody.code)
                }
            }).catch((e) => {
                reject(e)
            })
        })
    }
}