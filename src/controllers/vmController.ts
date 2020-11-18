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
import GcpManager from "../cloud/gcpManager";
import { orderRepository } from "../entities/orderEntity";


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
        await orderRepository.create({ orderId, left: 0 })
        const time = 1
        const gcp = new GcpManager(orderId, time, num, { machineType, vcpu, ram, location }, 'fakeuser')
        gcp.start(true);
        // gcp.createVm(orderId, time, { machineType, vcpu, ram, location }, 1)
        return true;

        // const worker = new Worker(resolve(process.cwd(), './dist/workers/createVM.js'))
        // worker.on('message', async (data) => {
        //     if (data.event === 'done') {
        //         if (data.result) {
        //             await this.vmService.saveVM(data.result)
        //         }
        //         console.log('workjs: ', data.result)
        //     }
        // })
        // worker.postMessage({ cmd: 'start', args: { orderId, time, config: { machineType, vcpu, ram, location } } })
    }


}





