

export default class PollManager {

    static async runTask(count: number, timeout: number, fn: Function, ...args) {
        console.log('count: ', count)
        return new Promise((resolve, reject) => {
            if (count === 0) {
                reject(new Error('task failed'))
                return
            }
            setTimeout(() => {
                const errorHandle = (err) => {
                    if (/is not ready/.test(err.message)) {
                        this.runTask(--count, timeout, fn, ...args).then(resultHandle)
                    } else {
                        reject(err)
                    }
                }
                const resultHandle = (err, ...res) => {
                    if (!err) {
                        resolve(res)
                    }
                    else {
                        errorHandle(err)
                    }
                }
                fn(...args)
                    .then(resultHandle)
                    .catch(errorHandle)
            }, timeout * 1000);
        })
    }


}



async function test() {
    throw new Error('is not ready');
}

(async () => {
    let res = await PollManager.runTask(2, 3, test)
    console.log(res)
})()