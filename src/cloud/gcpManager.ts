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
import GcloudRest from "../utils/gcloudRest";
import { compute_v1 } from "googleapis";
import { getUUid } from "../utils/uuidGenerator";


enum GcpEvent {
    timeout = 'timeout',
    complete = 'complete',
    success = 'success'
}

export default class GcpManager extends events.EventEmitter {
    private compute = new Compute({
        projectId: Config.PROJECT_ID,
        keyFilename: Config.SECRET_FILE,
        scopes: [
            'https://www.googleapis.com/auth/cloud-platform',
            'https://www.googleapis.com/auth/compute',
        ]
    })
    private static compute = new Compute({
        projectId: Config.PROJECT_ID,
        keyFilename: Config.SECRET_FILE,
        scopes: [
            'https://www.googleapis.com/auth/cloud-platform',
            'https://www.googleapis.com/auth/compute',
        ]
    })

    private orderId: string;
    private time: number; // 月
    private left: number; // 实例个数
    private config: IVmConfig;
    private startTime: Date; // 开始时间
    private expireTime: number;
    private user: string; // 
    private snapshot: string; // 最新快照
    private image: string; // 最新镜像
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
        this.expireTime = num * 3 * 60 * 1000;
    }


    public async start(isNew: boolean = true) {
        // 判断网络状态
        if (!NetworkTest.test()) {
            throw new Error('network error!')
        }

        // 获取最新快照
        // if (!this.snapshot) {
        //     this.snapshot = await this.getLatestSnapshot()
        //     console.log('最新快照：', this.snapshot)
        // }
        // 获取最新镜像
        if (!this.image) {
            this.image = await this.getLatestImage()
            console.log('最新镜像：', this.image)
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
            const ipinstanceId = getUUid();
            let res = await this.createVm(this.orderId, this.time, this.config, this.left, this.user, ipinstanceId)
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
        ipinstanceId: string,
    ) {

        let { machineType, location, vcpu, ram } = config;
        const PROJECT_ID = Config.PROJECT_ID;
        const snapshot = this.snapshot
        const sourceImage = this.image

        const region = this.compute.region(location);

        const zoneName = await this.getZone(location)
        const zone = this.compute.zone(zoneName)

        const machineType_str = this.getMachineType(machineType, vcpu, ram)

        const diskName = "disk-" + orderId + '-' + index
        const vmName = 'vm-' + orderId + '-' + index
        const addressName = 'staticip-' + orderId + '-' + index

        const rootPassword = this.getRootPasswd();
        const url = Config.EOG.baseUrl + Config.EOG.authPath
        // EOG需要的
        const orderNumber = orderId
        const target = user
        // const token = await EOGTokenCache.getToken()
        const token = 'faketoken'

        const seqTool = '/var/local/mysh/seqNum.sh'
        const seqSaveUrl = 'http://108.59.85.147:4040/api/vm/id'
        const authConfirmUrl = 'http://108.59.85.147:4040/api/vm/bcfNum'

        const vmconfig = {
            disks: [
                {
                    type: "PERSISTENT", // default is PERSISTENT
                    boot: true, // 是否为启动磁盘
                    mode: "READ_WRITE", // READ_WRITE or READ_ONLY,default is READ_WRITE 
                    autoDelete: true, // 挂载在的实例被删除时，是否该磁盘也自动删除
                    initializeParams: {
                        diskName,
                        // sourceSnapshot: `projects/${PROJECT_ID}/global/snapshots/${snapshot}`,
                        sourceImage: `projects/${PROJECT_ID}/global/images/${sourceImage}`,
                        diskType: `projects/${PROJECT_ID}/zones/${zoneName}/diskTypes/${config.diskType}`,
                        diskSizeGb: config.diskSize,
                    },
                }
            ],
            metadata: {
                items: [
                    {
                        key: 'startup-script',
                        value: `#! /bin/bash\nsh /var/local/mysh/startup.sh ${url} ${orderNumber} ${target} ${token} ${seqTool} ${ipinstanceId} ${seqSaveUrl} ${authConfirmUrl} ${100}`
                    },
                    {
                        key: 'shutdown-script',
                        value: `#! /bin/bash\necho $(pwd) >> /var/projects/gcp/shutdown.log`
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
                env: 'qa',
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
        const regionRes = await this.compute.getRegions({ autoPaginate: false })
        const regions = regionRes[0].map(region => region.id)
        if (!regions.includes(regionName)) {
            throw new Error('location is invalid')
        }

        const zoneRes = await this.compute.getZones({ autoPaginate: false })
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
        const now = Date.now()
        // 删除旧的snapshot
        await this.deleteLatestSnapshot()
        // 重新创建snapshot
        const zone = this.compute.zone(Config.SOURCE_DISK_ZONE);
        const disk = zone.disk(Config.SOURCE_DISK);
        const res = await disk.createSnapshot(`${Config.PROJECT_ID}-${Config.SOURCE_DISK_ZONE}-${Date.now()}`)
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
        const quotas = await this.getQuotas(config.location, [
            'CPUS', // cpu
            'DISKS_TOTAL_GB', // 持久化硬盘
            'IN_USE_ADDRESSES', // 使用中的ip地址（包括临时和预留）
            'INSTANCES', // 实例
        ])
        console.log(quotas)
        if (
            config.vcpu * num > quotas.CPUS.left ||
            20 * num > quotas.DISKS_TOTAL_GB.left ||
            1 * num > quotas.IN_USE_ADDRESSES.left ||
            num > quotas.INSTANCES.left
        ) {
            throw new Error(`该订单所需资源超出该地区配额，无法部署。剩余配额：\n
            vcpu：${quotas.CPUS.left}\n
            硬盘：${quotas.DISKS_TOTAL_GB.left} (GB)\n
            ip：${quotas.IN_USE_ADDRESSES.left}\n
            实例：${quotas.INSTANCES.left}\n
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
        const zone = this.compute.zone(zoneName);
        const vm = zone.vm(vmName);
        const [operation] = await vm.delete()

        const vmMetadata = await operationPromisefy(operation, 'complete', true)
        if (vmMetadata.status === "DONE" && vmMetadata.progress === 100) {
            await GcloudRest.releaseAddress({ address: addressName, region: regionName })
        }
    }


    private async getLatestSnapshot(): Promise<string> {
        let [snapshots] = await this.compute.getSnapshots({
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
        let [snapshots] = await this.compute.getSnapshots({
            orderBy: "creationTimestamp desc",
        })
        if (!snapshots || snapshots.length < 2) {
            return
        }

        const snapshot = snapshots[snapshots.length - 1]
        if (snapshot) {
            await snapshot.delete()
        }
    }

    /**
     * @description 更新image（删除原有image，新建image）
     * @param {} 
     * @return {} 
     */
    public static async updateImage(env?: string) {
        const start = Date.now()
        // 删除旧的image
        await this.deleteLatestImage(env)

        // 重新创建image
        const zone = this.compute.zone(Config.SOURCE_DISK_ZONE);
        // 关停实例
        const vm = zone.vm(Config.SOURCE_INSTANCE)
        const [stopOperation] = await vm.stop()
        const stopMetadata = await operationPromisefy(stopOperation, 'complete')
        console.log('关停了：', stopMetadata)
        if (stopMetadata.status === 'DONE' && stopMetadata.progress === 100) {
            const disk = zone.disk(Config.SOURCE_DISK);
            const image = this.compute.image(`${env || Config.ENV}-${Config.PROJECT_ID}-${Config.SOURCE_DISK_ZONE}-${Date.now()}`)
            const res = await image.create(disk)
            res[1].on("complete", (metadata) => {
                if (metadata.status === 'DONE' && metadata.progress === 100) {
                    console.log('更新image用时：%s s', (Date.now() - start) / 1000) // 测试数据：40.595s
                }
                // 重启实例
                // vm.start().then(data => console.log(data))
            })
        }
        return true
    }

    async getLatestImage(): Promise<string> {
        let [images] = await this.compute.getImages({
            maxResults: 4,
            orderBy: "creationTimestamp desc",
            // filter: `(labels.env eq ${Config.ENV})`,
        })
        const latestImage = (images as Array<any>).find((image) => {
            return image && image.metadata && image.metadata.name.includes(Config.ENV) && image.metadata.status === "READY"
        })

        if (!latestImage) {
            throw new Error('image is not ready')
        }
        return latestImage.metadata.name


        // const [firstImage, secondImage] = images
        // if (firstImage && firstImage.metadata.status === 'READY') {
        //     return firstImage.metadata.name
        // }
        // else if (secondImage && secondImage.metadata.status === 'READY') {
        //     return secondImage.metadata.name
        // }
        // else {
        //     throw new Error('image is not ready')
        // }
    }

    private static async deleteLatestImage(env?: string) {
        let [images] = await this.compute.getImages({
            orderBy: "creationTimestamp desc",
            // filter: `(labels.env eq ${Config.ENV})`
        })

        images = (images as Array<any>).filter((image) => {
            return image && image.metadata && image.metadata.name.includes(env || Config.ENV)
        })
        // 至少保存5个镜像
        if (!images || images.length < 5) {
            return
        }

        const image = images[images.length - 1]
        if (image) {
            await image.delete()
            console.log(`删除镜像：${image.metadata.name}`)
        }
    }

    private async getQuotas(region: string, keys: Array<string>) {
        let quotas = await GcloudRest.getQuotas(region)
        let data: { [key: string]: compute_v1.Schema$Quota & { left: number, percent: number } } = {}
        quotas
            .filter((quota) => {
                return keys.includes(quota.metric)
            })
            .forEach(quota => {
                data[quota.metric] = Object.assign({}, quota, {
                    left: quota.limit - quota.usage,
                    percent: Math.ceil((quota.usage / quota.limit) * 100)
                })
            })
        return data
    }


    public static async getVms(orderId?: string, status?: string) {
        let options = {
            autoPaginate: false,
            filter: '',
        }
        if (orderId) {
            options.filter += `(labels.orderid eq ${orderId})`
        }
        if (status) {
            options.filter += `(status eq ${status})`
        }
        const res = await this.compute.getVMs(options)
        console.log(res[0])
        return res[0]
    }



    public static async restartVm(zoneName: string, vmName: string) {
        const zone = this.compute.zone(zoneName);
        const vm = zone.vm(vmName);
        await vm.stop();
        await vm.waitFor('TERMINATED')
        console.log('stop success')
        await vm.start();
        await vm.waitFor('RUNNING')
        console.log('start success')
        return true;


        // const stoppedVmMetadata = await operationPromisefy(stopOperation, 'complete', true)
        // if (stoppedVmMetadata.status === "DONE" && stoppedVmMetadata.progress === 100) {
        //     const [startOperation] = await vm.start();
        //     const startedVmMetadata = await operationPromisefy(startOperation, 'complete', true)
        //     if (startedVmMetadata.status === "DONE" && startedVmMetadata.progress === 100) {
        //         return 
        //     }
        // }

    }


}
