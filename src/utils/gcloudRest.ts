import { google } from 'googleapis'
import { Config } from '../config';


export default class GcloudRest {
    private static compute = google.compute('v1')
    private static auth = new google.auth.GoogleAuth({
        keyFile: Config.SECRET_FILE,
        scopes: [
            'https://www.googleapis.com/auth/cloud-platform',
            'https://www.googleapis.com/auth/compute',
        ],
    });

    /**
     * @description 释放静态ip资源
     * @param {string} address 预留地址名称
     * @return {} 
     */
    public static async releaseAddress(req: { region: string, address: string }) {
        const authClient = await this.auth.getClient()

        const res = await this.compute.addresses.delete({
            auth: authClient,
            project: Config.PROJECT_ID,
            region: req.region,
            address: req.address
        })
    }

    /**
     * @description 扩大硬盘容量
     * @param {number} size 扩大到的数值，单位GB
     * @return {} 
     */
    static async resizeDisk(req: { zone: string, disk: string, size: number }) {
        const authClient = await this.auth.getClient()
        const res = await this.compute.disks.resize({
            auth: authClient,
            project: Config.PROJECT_ID,
            zone: req.zone,
            disk: req.disk,
            requestBody: {
                sizeGb: `${req.size}`,
            }
        })
    }

    /**
     * @description 地区配额信息
     * @param {} 
     * @return {} 
     */
    static async getQuotas(region: string) {
        const authClient = await this.auth.getClient()
        const res = await this.compute.regions.get({
            auth: authClient,
            project: Config.PROJECT_ID,
            region,
        })
        console.log(res)
        const quotas = res && res.data && res.data.quotas
        if (!quotas || quotas.length <= 0) {
            throw new Error('quotas is null')
        }
        return quotas
    }



}