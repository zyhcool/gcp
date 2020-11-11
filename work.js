const { parentPort } = require('worker_threads');
const path = require('path');

parentPort.on('message', async (data) => {
    if (data.cmd === 'start') {
        const fn = data.fn
        const args = data.args;
        try {
            const result = await fn.call(data.ctx, ...args);
            parentPort.postMessage({ event: 'done', result });
        }
        catch (e) {
            parentPort.postMessage({ event: 'error', error: e })
        }
    }
})





