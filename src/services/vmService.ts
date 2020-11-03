
import { BaseService } from "./baseService"
import { Vm, vmRepository } from "../entities/vmEntity";
import Compute from '@google-cloud/compute'
import { Config } from "../config";
import PollManager from "../utils/pollManager";
import operationPromisefy from "../utils/promisefy";


export class VmService extends BaseService<Vm>{
    repository = vmRepository

    /**
     * @description 随机获取某个region（地区）下面的zone（区域）
     * @param {} 
     * @return {} 
     */
    async getZone(regionName: string): Promise<string> {
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
        })

        console.log(zones)
        return zones[0];

    }

    /**
     * @description 根据机器类型和配置，拼接出url所需格式
     * @param {} 
     * @return {} 
     */
    getMachineType(machineType: string, vcpu: number, ram: number) {
        machineType = machineType.toLowerCase()
        if (machineType === 'n1') {
            return `custom-${vcpu}-${ram}`
        }
        else {
            return `${machineType}-custom-${vcpu}-${ram}`
        }
    }

    async saveVM(vm: Vm) {
        await this.save(vm)
    }

    async updateSnapshot() {
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
        }
    }
}