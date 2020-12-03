import { google } from 'googleapis'
import { Config } from '../config';


export default class GcloudRestApikey {
    private static compute = google.compute({
        version: 'v1',
        auth: 'AIzaSyDAya1jNjQmt1x7ViBWV01W-hafSuA6r7s',
    });
    public static async deleteAddress(req: { region: string, address: string }) {
        const res = await this.compute.addresses.delete({
            project: Config.PROJECT_ID,
            region: req.region,
            address: req.address
        })
        console.log('释放地址1：', res)
    }
}

export class GcloudRestService {
    private static compute = google.compute('v1')
    private static auth = new google.auth.GoogleAuth({
        keyFile: '/var/projects/gcp/auth/auth.json',
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });

    public static async deleteAddress(req: { region: string, address: string }) {
        const authClient = await this.auth.getClient()

        const res = await this.compute.addresses.delete({
            auth: authClient,
            project: Config.PROJECT_ID,
            region: req.region,
            address: req.address
        })
        console.log('释放地址2：', res)
    }
}