
import { parentPort } from "worker_threads";
import gcpManager from '../cloud/gcpManager';


parentPort.on('message', async (data) => {
    if (data.cmd === 'start') {
        try {
            const { orderId, time, config } = data.args
            const res = await gcpManager.createVm(orderId, time, config);
            parentPort.postMessage({ event: 'done', result: res });

        }
        catch (e) {
            parentPort.postMessage({ event: 'error', error: e })
        }
    }
})





