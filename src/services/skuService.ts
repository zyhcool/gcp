
import { Sku, skuRepository } from "../entities/skuEntity";
import { BaseService } from "./baseService"
import fs from "fs";
import path from "path";
import { logger } from "../logger";
import myNet from "../net";
import ping from 'ping'


export class SkuService extends BaseService<Sku>{
    repository = skuRepository

    static async runTask() {
        // 网络是否通畅
        const pingResult = await ping.promise.probe('www.google.com')
        // 网络通畅
        if (pingResult.alive) {
            // 获取sku数据
            const data = await this.getSkusData();
            // 写入数据库
            await this.saveToDb(data)
            // 写入文件备用
            await this.writeToFile(data)
        }
        // 网络不通畅
        else {
            const count = await skuRepository.countDocuments()
            console.log(count)
            // 数据未初始化写入数据库
            if (count === 0) {
                const data = require(path.resolve(process.cwd(), './skus.json'))
                if (data && data.skus && data.skus.length > 0) {
                    await this.saveToDb(data.skus)
                }
            }
        }
    }

    static async getSkusData() {
        const url = 'https://cloudbilling.googleapis.com/v1/services/6F81-5844-456A/skus?key=AIzaSyD2JOj2edBUaoPDSsFmzkMBzy5ov9bYcDA'

        let result = [];
        let response = await myNet.get(url);
        logger.debug(`get ${response.data.skus.length} data from google`);
        const data = response.data;
        if (data.skus && data.skus.length > 0) {
            result.push(...data.skus);
        }

        if (data.nextPageToken) {
            let url1 = url + `&pageToken=${data.nextPageToken}`
            let response = await myNet.get(url1);
            const data_nextpage = response.data;
            if (data_nextpage.skus && data_nextpage.skus.length > 0) {
                result.push(...data_nextpage.skus);
            }
        }
        return result
    }

    static async saveToDb(data) {
        // 删除sku集合所有数据
        await skuRepository.deleteMany({})
        // 更新数据
        await skuRepository.create(data)
        logger.debug('saveToDb success')
    }

    static async writeToFile(data) {
        const filepath = path.resolve(process.cwd(), './skus.json')
        // 删除原数据文件
        if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath)
        }
        // 更新数据
        fs.writeFileSync(filepath, JSON.stringify({ skus: data }))
        logger.debug('writeToFile success')
    }
}