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

        const config = {
            protocols: {
                tcp: [3000],
                udp: []
            },
            ranges: ['0.0.0.0/0'],
        }
        const firewall = await compute.createFirewall("test-firewall", config)
        console.log(firewall)
    }

}
