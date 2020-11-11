import events from "events"

/**
 * @description 将操作（operation）的事件监听模式promise化（operation作为对资源的某个操作保留在本地的对象，会通过接口轮询的方式获取该操作的远程状态，一旦远程状态进入某种状态，便触发本地的某事件回调）
 * @param {} 
 * @return {} 
 */
export default function operationPromisefy(operation, event: string, listenError?: boolean): Promise<any> {
    if (!(operation instanceof events.EventEmitter)) {
        throw new Error(`operation is not an instance of EventEmitter`)
    }
    return new Promise((resolve, reject) => {
        operation.on(event, (metadata) => {
            resolve(metadata);
            if (event === 'complete') {
                operation.removeAllListeners()
            }
        })
        if (listenError) {
            operation.on("error", (err) => {
                reject(err)
            })
        }
    })
}