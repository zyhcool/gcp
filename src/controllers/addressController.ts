import {
    Get,
    Controller,
    Authorized,
    QueryParam,
} from "routing-controllers";
import { Inject } from "typedi";
import { SkuService } from "../services/skuService";
import Compute from '@google-cloud/compute'


@Controller("/address")
export default class AddressController {

    @Inject(type => SkuService)
    skuService: SkuService;

    @Get("es")
    async gets() {
        // Creates a client
        const compute = new Compute();

        const res = await compute.getAddresses({ autoPaginate: false })
        console.log(res[2].items['regions/us-central1'])
    }

    @Get("/")
    async get() {
        // Creates a client
        const compute = new Compute();
        const region = compute.region("us-central1");
        const address = region.address("teststaticip");

        const res = await address.get()
        console.log(res)
    }

    @Get("/create")
    async create() {
        const compute = new Compute()

        const region = compute.region("us-central1");
        const address = region.address("teststaticip-1");

        const options = {
            name: "teststaticip-1",
            networkTier: "PREMIUM",
            addressType: "EXTERNAL",
            address: "34.122.87.160",


        }
        const res = await address.create(options)
        console.log(res)
    }

    @Get("/addAccessConfig")
    async addAccessConfig() {
        const compute = new Compute()

        const region = compute.region("us-central1");
        const address = region.address("teststaticip");
    }


}
