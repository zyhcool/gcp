import {
    Get,
    Controller,
    Authorized,
    QueryParam,
} from "routing-controllers";
import { Inject } from "typedi";
import { SkuService } from "../services/skuService";
import Compute from '@google-cloud/compute'


@Controller("/disk")
export default class DiskController {

    @Inject(type => SkuService)
    skuService: SkuService;

    @Get("s")
    async gets() {
        // Creates a client
        const compute = new Compute();

        const disks = await compute.getDisks({ autoPaginate: false })

        console.log(disks)
        return disks
    }

    @Get("/")
    async get(
        @QueryParam("diskname") diskname: string
    ) {
        // Creates a client
        const compute = new Compute();

        const disk = compute.disk(diskname)
        console.log(disk)
        return disk
    }

    @Get("/create")
    async create() {
        const compute = new Compute();

        const zone = compute.zone('us-central1')
        const config = {
            name: "test-disk",
            sourceSnapshot: 'projects/gcp-test-293701/global/snapshots/snapshot-1',
            sizeGb: 20,
            type: "projects/gcp-test-293701/zones/us-central1-a/diskTypes/pd-standard",
            // zone: "projects/gcp-test-293701/zones/us-central1-a",
        }
        const res = await zone.createDisk("test-disk", config)
        const [disk, operation, apiResponse] = res
        console.log(res);


    }

}
