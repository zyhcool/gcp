
import { parentPort } from "worker_threads";
import GcpManager from "../cloud/gcpManager";
import gcpManager from '../cloud/gcpManager';


parentPort.on('message', async (data) => {
    if (data.cmd === 'start') {
        try {
            const { orderId, time, config } = data.args
            const gcp = new GcpManager(orderId, time, 1, config)
            const res = gcp.start();
            parentPort.postMessage({ event: 'done', result: res });

        }
        catch (e) {
            parentPort.postMessage({ event: 'error', error: e })
        }
    }
})





