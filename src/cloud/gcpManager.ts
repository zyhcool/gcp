import { Config } from "../config";

import { IVmConfig, Vm, vmRepository } from "../entities/vmEntity";
import Compute from '@google-cloud/compute'
import operationPromisefy from "../utils/promisefy";
import generatePasswd from 'generate-password'


class GcpManager {

    /**
     * @description 购买虚拟机实例
     * @param {} 
     * @return {} 
     */
    public async createVm(
        orderId: string,
        time: number,
        config: IVmConfig,
    ) {

        let { machineType, location, vcpu, ram } = config;
        const PROJECT_URL = Config.PROJECT_URL;
        const SNAPSHOT = Config.SNAPSHOT;

        const compute = new Compute();
        const region = compute.region(location);

        const zoneName = await this.getZone(location)
        const zone = compute.zone(zoneName)

        const machineType_str = this.getMachineType(machineType, vcpu, ram)

        const diskName = "disk-" + orderId
        const vmName = 'vm-' + orderId
        const addressName = 'staticip-' + orderId

        // 判断快照是否准备完毕
        const snapshot = compute.snapshot(Config.SNAPSHOT)
        const [ssMetadata] = await snapshot.getMetadata()
        if (ssMetadata.status !== "READY") {
            throw new Error('snapshot is not ready')
        }


        // 创建启动磁盘，使用快照snapshot-1
        const diskConfig = {
            name: diskName,
            sourceSnapshot: `${PROJECT_URL}/global/snapshots/${SNAPSHOT}`,
            sizeGb: 20,
            type: `${PROJECT_URL}/zones/${zoneName}/diskTypes/pd-standard`,
        }
        // 生成root登录密码
        const rootPassword = this.getRootPasswd();
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
            metadata: {
                items: [
                    {
                        key: 'startup-script',
                        value: `#! /bin/bash\n/var/local/mysh/startup.sh ${rootPassword}`
                    }
                ]
            },
            http: true,
            https: true,
            machineType: `${PROJECT_URL}/zones/${zoneName}/machineTypes/${machineType_str}`, // n1机型，自定义：1vcpu，内存1024mb
        }
        const [disk, diskOperation] = await zone.createDisk(diskName, diskConfig)
        console.log('disk:\n---------------\n---------------', disk, diskOperation);
        const diskMetadata = await operationPromisefy(diskOperation, "complete", true);
        console.log('diskMetadata:\n---------------\n---------------', diskMetadata);

        if (diskMetadata.status === "DONE" && diskMetadata.progress === 100) {
            const [vm, vmoperation] = await zone.createVM(vmName, vmconfig)
            console.log('vm:\n---------------\n---------------', vm, vmoperation);
            const vmMetadata = await vm.waitFor('RUNNING')
            console.log('vmMetadata:\n---------------\n---------------', vmMetadata);
            const externalIP = vmMetadata[0].networkInterfaces[0].accessConfigs[0].natIP
            const address = region.address(addressName);

            const options = {
                name: addressName,
                networkTier: "PREMIUM",
                addressType: "EXTERNAL",
                address: externalIP,
            }
            const [, addOperation] = await address.create(options)
            const addressMetadata = await operationPromisefy(addOperation, 'complete', true)

            if (addressMetadata.status === "DONE" && addressMetadata.progress === 100) {
                // 处理业务逻辑
                const expiredAt = new Date(vmMetadata.creationTimestamp + time * 30 * 24 * 60 * 60 * 1000)
                return {
                    ip: externalIP,
                    vmName,
                    gcpInstanceId: vm.metadata.targetId,
                    bootDisk: diskName,
                    rootUser: 'root',
                    rootPassword,
                    expiredAt,
                }

            }
        }
    }

    /**
     * @description 更新snapshot（删除原有snapshot，新建snapshot）
     * @param {} 
     * @return {} 
     */
    public async updateSnapshot() {
        const compute = new Compute();
        const now = Date.now()
        // 删除旧的snapshot
        const snapshot = compute.snapshot(Config.SNAPSHOT)
        const [ssoperation] = await snapshot.delete()
        console.log(ssoperation)
        const ssmetadata = await operationPromisefy(ssoperation, 'complete', true)
        if (ssmetadata.status === "DONE" && ssmetadata.progress === 100) {
            // 重新创建snapshot
            const zone = compute.zone(Config.SOURCE_DISK_ZONE);
            const disk = zone.disk(Config.SOURCE_DISK);
            const res = await disk.createSnapshot(Config.SNAPSHOT)
            console.log(res)
            res[1].on("complete", (metadata) => {
                if (metadata.status === 'DONE' && metadata.progress === 100) {
                    console.log('更新snapshot用时：%s s', (Date.now() - now) / 1000) // 测试数据：167.164 s
                }
            })
            return true
        }
    }

    /**
     * @description 随机获取某个region（地区）下面的zone（区域）
     * @param {} 
     * @return {} 
     */
    private async getZone(regionName: string): Promise<string> {
        const compute = new Compute();

        const regionRes = await compute.getRegions({ autoPaginate: false })
        const regions = regionRes[0].map(region => region.id)
        if (!regions.includes(regionName)) {
            throw new Error('location is invalid')
        }

        const zoneRes = await compute.getZones({ autoPaginate: false })
        const zones = (zoneRes[0] as Array<any>).filter(zone => {
            const reg = new RegExp(regionName)
            return reg.test(zone.id)
        }).map(zone => zone.id)

        console.log(zones)
        return zones[0];

    }

    /**
     * @description 根据机器类型和配置，拼接出url所需格式
     * @param {} 
     * @return {} 
     */
    private getMachineType(machineType: string, vcpu: number, ram: number) {
        machineType = machineType.toLowerCase()
        if (machineType === 'n1') {
            return `custom-${vcpu}-${ram}`
        }
        else {
            return `${machineType}-custom-${vcpu}-${ram}`
        }
    }

    // private async saveVM(vm: Vm) {
    //     await vmRepository.create(vm)
    // }

    /**
     * @description 生成root用户的登录密码
     * @param {} 
     * @return {} 
     */
    private getRootPasswd() {
        const pwd = generatePasswd.generate({
            length: 16,
            numbers: true,
        })
        return pwd;
    }

}

const gcpManager = new GcpManager()
export default gcpManager;