import { Config } from "./config";
import operationPromisefy from "./utils/promisefy";
import Compute from '@google-cloud/compute'
import { parentPort } from "worker_threads";
import { vmRepository } from "./entities/vmEntity";


parentPort.on('message', async (data) => {
    if (data.cmd === 'start') {
        try {
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
                await vmRepository.create({
                    ip: 'String',
                    vmName: 'String',
                    gcpInstanceId: 'String',
                    bootDisk: 'String',
                    rootUser: 'String',
                    rootPassword: 'String',
                    expiredAt: new Date(),
                })
                parentPort.postMessage({ event: 'done', result: true });
            }
        }
        catch (e) {
            parentPort.postMessage({ event: 'error', error: e })
        }
    }
})





