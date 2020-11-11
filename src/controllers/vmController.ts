import {
    Get,
    Controller,
    QueryParam,
} from "routing-controllers";
import { Inject } from "typedi";
import { SkuService } from "../services/skuService";
import Compute from '@google-cloud/compute'
import { VmService } from "../services/vmService";
import { getUUid } from "../utils/uuidGenerator";
import { Worker } from "worker_threads";
import { resolve } from "path";


@Controller("/vm")
export default class VmController {

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
        @QueryParam("vmName") vmName: string,
        @QueryParam("zoneName") zoneName: string
    ) {
        // Creates a client
        const compute = new Compute();

        const zone = compute.zone(zoneName)
        const vm = zone.vm(vmName)
        const res = await vm.get();
        console.log(res[0])
        console.log(res[0].metadata.networkInterfaces[0].networkIP)
        console.log(res[0].metadata.networkInterfaces[0].accessConfigs[0].natIP)
    }

    @Get("/create")
    async create(
        @QueryParam("orderId") orderId: string,
        @QueryParam("num") num: number,
        @QueryParam("machineType") machineType: string,
        @QueryParam("vcpu") vcpu: number,
        @QueryParam("ram") ram: number,
        @QueryParam("location") location: string,

    ) {

        orderId = orderId || getUUid()
        const time = 1
        // let res = await this.vmService.createVm(orderId, time, { machineType, vcpu, ram, location })
        // if (!res) {
        //     throw new Error('createVm failed')
        // }

        const worker = new Worker(resolve(process.cwd(), './work.js'))
        worker.on('message', (data) => {
            if (data.event === 'done') {
                console.log('workjs: ', data.result)
            }
        })
        worker.postMessage({ cmd: 'start', fn: this.vmService.updateSnapshot, ctx: this.vmService, args: [orderId, time, { machineType, vcpu, ram, location }] })
    }


}





