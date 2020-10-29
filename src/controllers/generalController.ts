import {
    Get,
    Controller,
    Authorized,
} from "routing-controllers";
import { Inject } from "typedi";
import { SkuService } from "../services/skuService";
import Compute from '@google-cloud/compute'


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

}
