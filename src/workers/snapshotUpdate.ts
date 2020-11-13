
import { parentPort } from "worker_threads";
import GcpManager from "../cloud/gcpManager";
import gcpManager from '../cloud/gcpManager';


parentPort.on('message', async (data) => {
    if (data.cmd === 'start') {
        try {
            const res = await GcpManager.updateSnapshot();
            parentPort.postMessage({ event: 'done', result: res });

        }
        catch (e) {
            parentPort.postMessage({ event: 'error', error: e })
        }
    }
})





