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
import Gcp from "../cloud/gcpManager";
import { orderRepository, OrderStatus } from "../entities/orderEntity";
import { OrderService } from "../services/orderService";
import { instanceRepository, instanceStatus } from "../entities/instanceEntity";
import operationPromisefy from "../utils/promisefy";
import Axios from "axios";
import GcpManager from "../cloud/gcpManager";


@Controller("/vm")
export default class VmController {

    @Inject(type => SkuService)
    skuService: SkuService;

    @Inject(type => OrderService)
    orderService: OrderService;

    @Inject(type => VmService)
    vmService: VmService;

    @Get("s")
    async vms(
        @QueryParam('orderId') orderId: string,
        @QueryParam('status') status: string,
    ) {
        let vms = await GcpManager.getVms(orderId, status)
        console.log(vms)
        return vms.length;
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
        @QueryParam("diskType") diskType: string,
        @QueryParam("diskSize") diskSize: number,

    ) {

        orderId = orderId || getUUid()
        await orderRepository.create({
            orderId, left: 0, status: OrderStatus.deploying, config: {
                machineType,
                ram,
                vcpu,
                location,
                diskType,
                diskSize,
            }
        })
        const time = 1
        await this.orderService.deployOrder(orderId, time, num, { machineType, vcpu, ram, location, diskType, diskSize }, 'fakeuser')
        return true;
    }

    @Get('/deletevm')
    async deletevm(
        @QueryParam("vmName") vmName: string,
        @QueryParam("addressName") addressName: number,
        @QueryParam("ip") ip: number,
        @QueryParam("zoneName") zoneName: string,
    ) {
        const regionName = zoneName.substring(0, zoneName.length - 2)
        const compute = new Compute();
        // const zone = compute.zone(zoneName);
        // const vm = zone.vm(vmName);
        // const [operation] = await vm.delete()

        // const vmMetadata = await operationPromisefy(operation, 'complete', true)
        // if (vmMetadata.status === "DONE" && vmMetadata.progress === 100) {
        const region = compute.region(regionName)
        console.log(regionName)
        const address = region.address(addressName)
        let ha = await Axios.delete('https://compute.googleapis.com/compute/v1/projects/gcp-test-293701/regions/us-central1/addresses/addressname')
        console.log(ha)
        // }
    }

}





