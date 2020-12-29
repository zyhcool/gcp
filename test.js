
// 勿删！
// 勿删！
// const crypto = require("crypto")
// console.log(crypto.createHash('sha256').update('S0urG1ug').digest('hex'))
// 勿删！
// 勿删！

let events = require('events')

process.on('unhandledRejection', (reason) => {
    console.log(`意外错误：${reason}`)
})






class Test extends events.EventEmitter {
    init() {
        this.emit('data', 'hello')
    }
}
func()
async function func() {
    try {
        let test = new Test()
        test.on('data', async (v) => {
            try {
                throw new Error('data')
            }
            catch (e) {
                throw e
            }
            console.log(v)
        })
        test.init()

        console.log(`HAPPY NEW YEAR`)
    }
    catch (e) {
        console.log(`func catch error: ${e}`)
    }
}


async function test() {
    throw new Error(`test error`)
}

let ha = require('inspector')