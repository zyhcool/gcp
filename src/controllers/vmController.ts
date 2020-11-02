import {
    Get,
    Controller,
    Authorized,
    QueryParam,
} from "routing-controllers";
import { Inject } from "typedi";
import { SkuService } from "../services/skuService";
import Compute from '@google-cloud/compute'
import PollManager from "../utils/pollManager";
import { VmService } from "../services/vmService";


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
        @QueryParam("diskname") diskname: string
    ) {
        // Creates a client
        const compute = new Compute();

        const zone = compute.zone('us-central1-a')
        const vm = zone.vm("gcp-test")
        const res = await vm.get();
        console.log(res[0])
        console.log(res[0].metadata.networkInterfaces[0].networkIP)
        console.log(res[0].metadata.networkInterfaces[0].accessConfigs[0].natIP)
    }

    @Get("/create")
    async create(
        @QueryParam("machineType") machineType: string,
        @QueryParam("vcpu") vcpu: number,
        @QueryParam("ram") ram: number,
        @QueryParam("location") location: string,

    ) {
        const PROJECT_URL = "projects/gcp-test-293701"
        const SNAPSHOT = "snapshot-1"

        const compute = new Compute();
        const region = compute.region(location);

        const zoneName = await this.vmService.getZone(location)
        const zone = compute.zone(zoneName)

        const machineType_str = this.vmService.getMachineType(machineType, vcpu, ram)

        const num = "1"
        const diskName = "test-disk-" + num
        const vmName = 'test-vm-' + num
        const addressName = 'test-staticip-' + num

        // 创建启动磁盘，使用快照snapshot-1
        const config = {
            name: diskName,
            sourceSnapshot: `${PROJECT_URL}/global/snapshots/${SNAPSHOT}`,
            sizeGb: 20,
            type: `${PROJECT_URL}/zones/${zoneName}/diskTypes/pd-standard`,
        }
        const diskRes = await zone.createDisk(diskName, config)
        console.log('diskRes:-----------------\n', diskRes);



        // 创建实例，挂载磁盘
        const vmconfig = {
            disks: [
                {
                    type: "PERSISTENT", // default is PERSISTENT
                    boot: true, // 是否为启动磁盘
                    mode: "READ_WRITE", // READ_WRITE or READ_ONLY,default is READ_WRITE 
                    autoDelete: true, // 挂载在的实例被删除时，是否该磁盘也自动删除
                    source: `${PROJECT_URL}/zones/${zoneName}/disks/${diskName}`,
                }
            ],
            http: true,
            https: true,
            machineType: `${PROJECT_URL}/zones/${zoneName}/machineTypes/${machineType_str}`, // n1机型，自定义：1vcpu，内存1024mb
        }
        const vmRes = await PollManager.runTask(10, 10, zone.createVM, zone, vmName, vmconfig);
        console.log(vmRes)

        const vmMetadata = await vmRes[0].waitFor('RUNNING')
        const externalIP = vmMetadata[0].networkInterfaces[0].accessConfigs[0].natIP


        // 升级临时外部ip为静态ip
        const address = region.address(addressName);

        const options = {
            name: addressName,
            networkTier: "PREMIUM",
            addressType: "EXTERNAL",
            address: externalIP,
        }
        const addRes = await PollManager.runTask(10, 10, address.create, address, options);
        console.log(addRes)

        await this.vmService.saveVM({
            ip: externalIP,
            vmName,
            gcpInstanceId: vmRes[0].metadata.targetId,
            bootDisk: diskName,
        })
    }

}

// function sleep(time) {
//     return new Promise((resolve,reject)=>{
//         setTimeout(() => {
//             resolve()
//         }, time*1000);
//     })
// }