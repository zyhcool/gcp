import { Config } from "../config";

import { IVmConfig } from "../entities/vmEntity";
import Compute from '@google-cloud/compute'
import operationPromisefy from "../utils/promisefy";
import generatePasswd from 'generate-password'
import CloudOrderCache from "../utils/cloudOrderCache";
import { logger } from "../logger";
import NetworkTest from "../utils/networkTest";
import events from "events"
import { orderRepository, OrderStatus } from "../entities/orderEntity";
import { instanceRepository, instanceStatus } from "../entities/instanceEntity";
import { GcloudCli } from "../utils/gcloudCli";
import EOGTokenCache from "../utils/EOGTokenCache";


enum GcpEvent {
    timeout = 'timeout',
    complete = 'complete',
    success = 'success'
}

export default class GcpManager extends events.EventEmitter {
    private orderId: string;
    private time: number; // 月
    private left: number; // 实例个数
    private config: IVmConfig;
    private startTime: Date; // 开始时间
    private expireTime: number = 3 * 60 * 1000; // 5分钟
    private user: string; // 
    private snapshot: string; // 最新快照
    constructor(orderId: string, time: number, num: number, config: IVmConfig, user: string) {
        super()
        this.init(orderId, time, num, config, user)
    }

    private init(orderId: string, time: number, num: number, config: IVmConfig, user: string) {
        this.orderId = orderId;
        this.time = time;
        this.left = num;
        this.config = config;
        this.user = user;
        this.startTime = new Date();
    }


    public async start(isNew: boolean = true) {
        // 判断网络状态
        if (!NetworkTest.test()) {
            throw new Error('network error!')
        }

        // 获取最新快照
        if (!this.snapshot) {
            this.snapshot = await this.getLatestSnapshot()
            console.log('最新快照：', this.snapshot)
        }

        if (isNew) {
            // 检查配额是否足够
            await this.validateQuotas(this.config, this.left)

            CloudOrderCache.set(this.orderId, {
                orderId: this.orderId,
                num: this.left,
                config: this.config,
                completed: 0,
                failed: 0,
            })
        }

        // 缓存是否存在或已过期
        const orderCache = CloudOrderCache.get(this.orderId)
        if (!orderCache || orderCache.expireTime < new Date()) {
            await this.finish()
            return
        }

        // 已完成全部部署
        if (this.left <= 0 && orderCache.value.completed === orderCache.value.num) {
            console.log('全部成功')
            this.emit(GcpEvent.complete)
            CloudOrderCache.delete(this.orderId)
            return;
        }

        // start是否超时
        if (Date.now() - this.startTime.getTime() > this.expireTime) {
            await this.finish()
            return
        }

        try {
            // if (this.left === 2) throw new Error('ren wei error')
            let res = await this.createVm(this.orderId, this.time, this.config, this.left, this.user)
            // 部署成功，缓存更新
            if (res) {
                this.emit(GcpEvent.success, res)
                CloudOrderCache.complete(this.orderId)
                this.left--;
                setTimeout(() => {
                    this.start(false)
                }, 0);
            }
            // 部署失败
            else {
                console.log('一个失败')
                CloudOrderCache.fail(this.orderId);
                setTimeout(() => {
                    this.start(false)
                }, 1000);
            }
        }
        catch (e) {
            CloudOrderCache.fail(this.orderId);
            logger.error(`\n${e.message}\n${e.stack}`)
            setTimeout(() => {
                this.start(false)
            }, 1000);
        }
    }

    private async finish() {
        // order 数据同步，成功几个，失败几个
        console.log('超时结束')
        this.emit(GcpEvent.timeout, this.left)
        CloudOrderCache.delete(this.orderId)
    }

    /**
     * @description 购买虚拟机实例
     * @param {} 
     * @return {} 
     */
    private async createVm(
        orderId: string,
        time: number,
        config: IVmConfig,
        index: number,
        user: string,
    ) {

        let { machineType, location, vcpu, ram } = config;
        const PROJECT_ID = Config.PROJECT_ID;
        const snapshot = this.snapshot

        const compute = new Compute();
        const region = compute.region(location);

        const zoneName = await this.getZone(location)
        const zone = compute.zone(zoneName)

        const machineType_str = this.getMachineType(machineType, vcpu, ram)

        const diskName = "disk-" + orderId + '-' + index
        const vmName = 'vm-' + orderId + '-' + index
        const addressName = 'staticip-' + orderId + '-' + index

        const rootPassword = this.getRootPasswd();
        const url = Config.EOG.baseUrl + Config.EOG.authPath
        // EOG需要的
        const orderNumber = orderId
        const target = user
        const token = EOGTokenCache.getToken()

        const vmconfig = {
            disks: [
                {
                    type: "PERSISTENT", // default is PERSISTENT
                    boot: true, // 是否为启动磁盘
                    mode: "READ_WRITE", // READ_WRITE or READ_ONLY,default is READ_WRITE 
                    autoDelete: true, // 挂载在的实例被删除时，是否该磁盘也自动删除
                    initializeParams: {
                        diskName,
                        sourceSnapshot: `projects/${PROJECT_ID}/global/snapshots/${snapshot}`,
                        diskType: `projects/${PROJECT_ID}/zones/${zoneName}/diskTypes/${config.diskType}`,
                        diskSizeGb: config.diskSize,
                    },
                }
            ],
            metadata: {
                items: [
                    {
                        key: 'startup-script',
                        value: `#! /bin/bash\n/var/local/mysh/startup.sh ${rootPassword} ${url} ${orderNumber} ${target} ${token}`
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
            labels: {
                orderid: orderId,
            },
            http: true,
            https: true,
            machineType: `projects/${PROJECT_ID}/zones/${zoneName}/machineTypes/${machineType_str}`, // n1机型，自定义：1vcpu，内存1024mb
        }

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
                zone: zoneName,
                addressName,
            }

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

    /**
     * @description 更新snapshot（删除原有snapshot，新建snapshot）
     * @param {} 
     * @return {} 
     */
    public static async updateSnapshot() {
        const compute = new Compute();
        const now = Date.now()
        // 删除旧的snapshot
        this.deleteLatestSnapshot()
        // 重新创建snapshot
        const zone = compute.zone(Config.SOURCE_DISK_ZONE);
        const disk = zone.disk(Config.SOURCE_DISK);
        const res = await disk.createSnapshot()
        console.log(res)
        res[1].on("complete", (metadata) => {
            if (metadata.status === 'DONE' && metadata.progress === 100) {
                console.log('更新snapshot用时：%s s', (Date.now() - now) / 1000) // 测试数据：167.164 s
            }
        })
        return true

    }

    /**
     * @description 检查配额是否够用
     * @param {} 
     * @return {} 
     */
    public async validateQuotas(config: IVmConfig, num: number) {
        const quotas = await GcloudCli.getQuotas(config.location, [
            'CPUS', // cpu
            'DISKS_TOTAL_GB', // 持久化硬盘
            'IN_USE_ADDRESSES', // 使用中的ip地址（包括临时和预留）
            'INSTANCES', // 实例
        ])
        console.log(quotas)
        if (
            config.vcpu * num > quotas.CPUS ||
            20 * num > quotas.DISKS_TOTAL_GB ||
            1 * num > quotas.IN_USE_ADDRESSES ||
            num > quotas.INSTANCES
        ) {
            throw new Error(`该订单所需资源超出该地区配额，无法部署。剩余配额：\n
            vcpu：${quotas.CPUS}\n
            硬盘：${quotas.DISKS_TOTAL_GB} (GB)\n
            ip：${quotas.IN_USE_ADDRESSES}\n
            实例：${quotas.INSTANCES}\n
            `)
        }
    }


    static async dealFailOrderInstances() {
        // 找到无效订单下的instance
        let orders = await orderRepository.aggregate([
            {
                $match: { status: OrderStatus.unvalid }
            },
            {
                $lookup: {
                    from: 'instances',
                    let: { iporderId: '$orderId' },
                    pipeline: [
                        {
                            $match: { $expr: { $eq: ['$iporderId', '$$iporderId'] } },
                        },
                        {
                            $project: { vmName: 1, status: 1, addressName: 1, zone: 1 }
                        }
                    ],
                    as: 'instances'
                }
            },
            { $match: { $expr: { $gt: [{ $size: '$instances' }, 0] } } },
            {
                $project: { instances: 1 }
            }
        ])
        const vmNames = []
        orders.forEach(order => {
            order.instances.forEach(instance => {
                try {
                    vmNames.push(instance.vmName)
                    this.deleteVM(instance)
                }
                catch (e) {
                    console.log('delete vm error: ', e)
                }
            })
        })

        // 删除
        await instanceRepository.deleteMany({ vmName: { $in: vmNames }, status: instanceStatus.deploy })

    }

    private static async deleteVM(instance: { addressName: string, vmName: string, zone: string }) {
        const { addressName, vmName, zone: zoneName } = instance;
        const regionName = zoneName.substring(0, zoneName.length - 2)
        const compute = new Compute();
        const zone = compute.zone(zoneName);
        const vm = zone.vm(vmName);
        const [operation] = await vm.delete()

        const vmMetadata = await operationPromisefy(operation, 'complete', true)
        if (vmMetadata.status === "DONE" && vmMetadata.progress === 100) {
            await GcloudCli.releaseAddress(addressName, regionName)
        }
    }


    private async getLatestSnapshot(): Promise<string> {
        const compute = new Compute()
        let [snapshots] = await compute.getSnapshots({
            maxResults: 2,
            orderBy: "creationTimestamp desc",
        })
        const [firstSS, secondSS] = snapshots
        if (firstSS && firstSS.metadata.status === 'READY') {
            return firstSS.name
        }
        else if (secondSS && secondSS.metadata.status === 'READY') {
            return secondSS.name
        }
        else {
            throw new Error('snapshot is not ready')
        }
    }

    private static async deleteLatestSnapshot() {
        const compute = new Compute()
        let [snapshots] = await compute.getSnapshots({
            maxResults: 1,
            orderBy: "creationTimestamp asc",
        })

        const [snapshot] = snapshots
        if (snapshot) {
            const [ssoperation] = await snapshot.delete()
        }
    }



}
