import { Config } from "../config";

import { IVmConfig } from "../entities/vmEntity";
import Compute from '@google-cloud/compute'
import operationPromisefy from "../utils/promisefy";
import generatePasswd from 'generate-password'
import CloudOrderCache from "../utils/cloudOrderCache";
import { orderRepository } from "../entities/orderEntity";
import { instanceRepository } from "../entities/instanceEntity";
import { logger } from "../logger";


export default class GcpManager {
    private orderId: string;
    private time: number; // 月
    private left: number; // 实例个数
    private config: IVmConfig;
    private startTime: Date; // 开始时间
    private expireTime: number = 10 * 60 * 1000; // 10分钟
    constructor(orderId: string, time: number, num: number, config: IVmConfig) {
        this.init(orderId, time, num, config)
    }

    private init(orderId: string, time: number, num: number, config: IVmConfig) {
        this.orderId = orderId;
        this.time = time;
        this.left = num;
        this.config = config;
        this.startTime = new Date()
    }



    public async start(isNew: boolean = true) {
        if (isNew) {
            CloudOrderCache.set(this.orderId, {
                orderId: this.orderId,
                num: this.left,
                config: this.config,
                completed: 0,
                failed: 0,
            })
        }

        // 缓存是否存在或被删除
        const orderCache = CloudOrderCache.get(this.orderId)
        if (!orderCache) {
            return
        }
        logger.debug(orderCache)

        // 已完成全部部署
        if (this.left <= 0 && orderCache.value.completed === orderCache.value.num) {
            console.log('全部成功')
            await orderRepository.updateOne({ orderId: this.orderId }, { $set: { left: 0 } })
            CloudOrderCache.delete(this.orderId)
            return;
        }

        // start是否超时
        if (Date.now() - this.startTime.getTime() > this.expireTime) {
            await this.finish()
            console.log('start超时')
            return
        }

        try {
            let res = await this.createVm(this.orderId, this.time, this.config, this.left)
            // 部署成功，缓存更新
            if (res) {
                await instanceRepository.create(Object.assign({}, res, {
                    iporderId: this.orderId,
                }))
                CloudOrderCache.complete(this.orderId)
                this.left--;
                return this.start(false);
            }
            // 部署失败
            else {
                console.log('一个失败')
                CloudOrderCache.fail(this.orderId);
                return this.start(false)
            }
        }
        catch (e) {
            logger.error(`\n${e.message}\n${e.stack}`)
            this.start(false)
        }
    }

    private async finish() {
        // order 数据同步，成功几个，失败几个
        console.log('结束了')
        await orderRepository.updateOne({ orderId: this.orderId }, { $set: { left: this.left } })
        CloudOrderCache.delete(this.orderId)
    }

    /**
     * @description 购买虚拟机实例
     * @param {} 
     * @return {} 
     */
    public async createVm(
        orderId: string,
        time: number,
        config: IVmConfig,
        index: number,
    ) {

        let { machineType, location, vcpu, ram } = config;
        const PROJECT_URL = Config.PROJECT_URL;
        const SNAPSHOT = Config.SNAPSHOT;
        const IMAGE = Config.IMAGE;

        const compute = new Compute();
        const region = compute.region(location);

        const zoneName = await this.getZone(location)
        const zone = compute.zone(zoneName)

        const machineType_str = this.getMachineType(machineType, vcpu, ram)

        const diskName = "disk-" + orderId + '-' + index
        const vmName = 'vm-' + orderId + '-' + index
        const addressName = 'staticip-' + orderId + '-' + index

        // 判断快照是否准备完毕
        const snapshot = compute.snapshot(Config.SNAPSHOT)
        const [ssMetadata] = await snapshot.getMetadata()
        if (ssMetadata.status !== "READY") {
            throw new Error('snapshot is not ready')
        }


        // 创建启动磁盘，使用快照snapshot-1
        // const diskConfig = {
        //     name: diskName,
        //     sourceSnapshot: `${PROJECT_URL}/global/snapshots/${SNAPSHOT}`,
        //     sizeGb: 20,
        //     type: `${PROJECT_URL}/zones/${zoneName}/diskTypes/pd-standard`,
        // }
        // 生成root登录密码
        const rootPassword = this.getRootPasswd();
        const vmconfig = {
            disks: [
                {
                    type: "PERSISTENT", // default is PERSISTENT
                    boot: true, // 是否为启动磁盘
                    mode: "READ_WRITE", // READ_WRITE or READ_ONLY,default is READ_WRITE 
                    autoDelete: true, // 挂载在的实例被删除时，是否该磁盘也自动删除
                    initializeParams: {
                        diskName,
                        sourceSnapshot: `${PROJECT_URL}/global/snapshots/${SNAPSHOT}`,
                        diskType: `${PROJECT_URL}/zones/${zoneName}/diskTypes/pd-standard`,
                        sizeGb: 20,
                    },
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
            // 网络标记
            tags: {
                items: [
                    'http-server',
                    'https-server',
                    ...Config.NETWORK_TAGS,
                ]
            },
            http: true,
            https: true,
            machineType: `${PROJECT_URL}/zones/${zoneName}/machineTypes/${machineType_str}`, // n1机型，自定义：1vcpu，内存1024mb
        }
        // const [disk, diskOperation] = await zone.createDisk(diskName, diskConfig)
        // console.log('disk:\n---------------\n---------------', disk, diskOperation);
        // const diskMetadata = await operationPromisefy(diskOperation, "complete", true);
        // console.log('diskMetadata:\n---------------\n---------------', diskMetadata);

        // if (diskMetadata.status === "DONE" && diskMetadata.progress === 100) {
        const [vm] = await zone.createVM(vmName, vmconfig)
        const vmMetadata = await vm.waitFor('RUNNING')
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
            const expiredAt = (new Date(vmMetadata[0].creationTimestamp)).setSeconds(time * 30 * 24 * 60 * 60)
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
        // }
    }

    /**
     * @description 更新snapshot（删除原有snapshot，新建snapshot）
     * @param {} 
     * @return {} 
     */
    public static async updateSnapshot() {
        const compute = new Compute();
        const now = Date.now()
        // 删除旧的snapshot
        const snapshot = compute.snapshot(Config.SNAPSHOT)
        const [ssoperation] = await snapshot.delete()
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
