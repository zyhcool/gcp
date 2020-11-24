import {
    Get,
    Controller,
    Authorized,
    QueryParam,
} from "routing-controllers";
import { Inject } from "typedi";
import { SkuService } from "../services/skuService";
import Compute from '@google-cloud/compute'
import { VmService } from "../services/vmService";
import { Worker } from "worker_threads";
import { resolve } from "path";


@Controller("/disk")
export default class DiskController {

    @Inject(type => SkuService)
    skuService: SkuService;

    @Inject(type => VmService)
    vmService: VmService;

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
        const zone = compute.zone("us-central1-a")

        const disk = zone.disk(diskname)
        const diskRes = await disk.get()
        console.log(diskRes)
    }

    @Get("/create")
    async create() {
        const compute = new Compute();

        const zone = compute.zone('us-central1-a')
        const config = {
            name: "test-disk",
            sourceSnapshot: 'projects/gcp-test-293701/global/snapshots/snapshot-1',
            sizeGb: 20,
            type: "projects/gcp-test-293701/zones/us-central1-a/diskTypes/pd-standard",
        }
        const res = await zone.createDisk("test-disk1", config)
        const [disk, operation, apiResponse] = res
        console.log(res);
        operation.on('running', function (metadata) {
            console.log('running:\n', metadata)
        });
        operation.on('complete', function (metadata) {
            console.log('complete:\n', metadata)
        });
        operation.on('error', function (metadata) {
            console.log('error:\n', metadata)
        });
    }

    @Get('/snapshot')
    async snapshot() {
        const compute = new Compute();

        const snapshot = compute.snapshot('snapshot-1')
        const res = await snapshot.get()
        console.log('get:\n---------------\n---------------', res)

        const exists = await snapshot.exists()
        console.log('exists:\n---------------\n---------------', exists)

        const metadata = await snapshot.getMetadata()
        console.log('metadata:\n---------------\n---------------', metadata)

    }

    @Get('/updateSnapshot')
    async updss() {
        const worker = new Worker(resolve(process.cwd(), './dist/workers/snapshotUpdate.js'))
        worker.on('message', (data) => {
            if (data.event === 'done') {
                console.log('workjs: ', data.result)
            }
        })
        worker.postMessage({ cmd: 'start' })
    }

    @Get('/latestSnapshot')
    async latest() {
        const compute = new Compute()
        let [snapshots] = await compute.getSnapshots({
            maxResults: 1,
            orderBy: "creationTimestamp desc",
        })

        console.log(snapshots)
    }

}
