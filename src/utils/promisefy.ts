import events from "events"

export default function operationPromisefy(operation, event: string, listenError?: boolean): Promise<any> {
    if (!(operation instanceof events.EventEmitter)) {
        throw new Error(`operation is not instance of EventEmitter`)
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