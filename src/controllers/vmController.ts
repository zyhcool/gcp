import {
    Get,
    Controller,
    Authorized,
    QueryParam,
} from "routing-controllers";
import { Inject } from "typedi";
import { SkuService } from "../services/skuService";
import Compute from '@google-cloud/compute'


@Controller("/vm")
export default class VmController {

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

        const zone = compute.zone('us-central1-a')
        const vm = zone.vm("test-instance-1")
        const res = await vm.get();
        console.log(res[0])
        console.log(res[0].metadata.networkInterfaces[0].networkIP)
        console.log(res[0].metadata.networkInterfaces[0].accessConfigs[0].natIP)
    }

    @Get("/create")
    async create() {
        const compute = new Compute();

        const num="1"
        const diskName = "test-disk-"+num
        const vmName = 'test-vm-'+num
        const addressName='test-staticip-'+num

        const zone = compute.zone('us-central1-a')
        // 创建启动磁盘，使用快照snapshot-1
        const config = {
            name: diskName,
            sourceSnapshot: 'projects/gcp-test-293701/global/snapshots/snapshot-1',
            sizeGb: 20,
            type: "projects/gcp-test-293701/zones/us-central1-a/diskTypes/pd-standard",
        }
        const diskRes = await zone.createDisk(diskName, config)
        const [disk] = diskRes
        console.log(diskRes);

        await sleep(10)

        // 创建实例，挂载磁盘
        const vmconfig = {
            disks: [
                {
                    type: "PERSISTENT", // default is PERSISTENT
                    boot: true, // 是否为启动磁盘
                    mode: "READ_WRITE", // READ_WRITE or READ_ONLY,default is READ_WRITE 
                    autoDelete: false, // 挂载在的实例被删除时，是否该磁盘也自动删除
                    source: `projects/gcp-test-293701/zones/us-central1-a/disks/${diskName}`,
                }
            ],
            http: true,
            https: true,
            machineType: "projects/gcp-test-293701/zones/us-central1-a/machineTypes/custom-1-1024", // n1机型，自定义：1vcpu，内存1024mb
        }
        const vmRes = await zone.createVM(vmName, vmconfig)
        const [vm]=vmRes
        console.log(vm.metadata.networkInterfaces[0].accessConfigs[0].natIP)

        await sleep(10)
        // 升级临时外部ip为静态ip
        const region = compute.region("us-central1");
        const address = region.address(addressName);

        const options = {
            name: addressName,
            networkTier: "PREMIUM",
            addressType: "EXTERNAL",
            address: "34.122.87.160",
        }
        const addRes = await address.create(options)
        console.log(addRes)
    }

}

function sleep(time) {
    return new Promise((resolve,reject)=>{
        setTimeout(() => {
            resolve()
        }, time*1000);
    })
}