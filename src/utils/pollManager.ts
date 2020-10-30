

export default class PollManager {

    static async runTask(count: number, timeout: number, fn: Function, ...args) {
        return new Promise((resolve, reject) => {
            if (count === 0) {
                return
            }
            setTimeout(() => {
                fn(...args).then((err, ...res) => {
                    if (!err) {
                        resolve(res)
                    } else {
                        if (/is not ready/.test(err.message)) {
                            this.runTask(--count, timeout, fn, ...args).then(v => resolve(v))
                        } else {
                            reject(err)
                        }
                    }
                })
            }, timeout * 1000);

        })
    }
}



