import {
    Get,
    Controller,
    Authorized,
} from "routing-controllers";
import { Inject } from "typedi";
import { SkuService } from "../services/skuService";
import Compute from '@google-cloud/compute'
import { orderRepository } from "../entities/orderEntity";
import { instanceRepository } from "../entities/instanceEntity";
import EOGTokenCache from "../utils/EOGTokenCache";
import GcloudRest from "../utils/gcloudRest";
import GcpManager from "../cloud/gcpManager";


@Controller("/general")
export default class GeneralController {

    @Inject(type => SkuService)
    skuService: SkuService;


    @Authorized()
    @Get("/helloworld")
    public async helloWorld(): Promise<any> {
        return "Hello World";
    }

    @Authorized()
    @Get("/updateData")
    async updateData() {
        await SkuService.runTask();
    }

    @Get("/create")
    async create() {
        // Creates a client
        const compute = new Compute();

        const zone = compute.zone("us-central1")
        const vm = zone.vm("test-vm") // vm name
        const disk = zone.disk("test-disk")
        const config = {
            disks: [disk],
            http: true,
            https: true,
            // networkInterfaces:[], // default: [ { network: 'global/networks/default' } ]
        }
        compute.create()
    }

    @Get('/orders')
    async orders() {
        return await orderRepository.find({}).lean();
    }

    @Get('/instances')
    async instances() {
        return await instanceRepository.find({}).lean()
    }


    @Get('/delAll')
    async delAll() {
        await instanceRepository.deleteMany({})
        await orderRepository.deleteMany({})
    }


    @Get('/test')
    async test() {

        GcloudRest.releaseAddress({ region: 'europe-west4', address: 'staticip-40fb151375aa4b60be48eed1d623d306-1' }).catch(e => console.log(e))

        GcloudRest.resizeDisk({ zone: 'europe-west4-a', disk: 'disk-d54a2ce421fb463fb0c9da6e8ae8d438-1', size: 22 }).catch(e => console.log(e))

        GcpManager.deleteVM({
            addressName: 'staticip-d54a2ce421fb463fb0c9da6e8ae8d438-1',
            vmName: 'vm-d54a2ce421fb463fb0c9da6e8ae8d438-1',
            zone: 'europe-west4-a',
        }).catch(e => console.log(e))
    }

}
