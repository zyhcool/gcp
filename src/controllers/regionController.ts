import {
    Get,
    Controller,
    Authorized,
} from "routing-controllers";
import { Inject } from "typedi";
import { SkuService } from "../services/skuService";
import Compute from '@google-cloud/compute'


@Controller("/region")
export default class GeneralController {

    @Inject(type => SkuService)
    skuService: SkuService;


    @Get("s")
    async create() {
        // Creates a client
        const compute = new Compute();

        const zones = await compute.getZones()
        console.log(zones[0].map(zone => zone.id))

        const regions = await compute.getRegions()
        console.log(regions[0].map(region => region.id))
    }

}
