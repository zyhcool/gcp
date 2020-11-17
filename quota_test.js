// const fs = require('fs')

// const spawn = require('child_process').spawn;
// const free = spawn('gcloud', ['compute', 'regions', 'describe', 'us-central1'])

// // 捕获标准输出并将其打印到控制台 
// free.stdout.on('data', function (data) {
//     data = data.toString('utf8')

//     let keys = ['CPUS', 'DISKS_TOTAL_GB', 'IN_USE_ADDRESSES',
//         'INSTANCE_GROUPS', 'LOCAL_SSD_TOTAL_GB', 'STATIC_ADDRESSES'
//     ]
//     console.time('all')
//     getAvailable(data, keys)
//     console.timeEnd('all')


//     console.time('item')
//     getAvailable1(data, keys)
//     console.timeEnd('item')



// });

// // 捕获标准错误输出并将其打印到控制台 
// free.stderr.on('data', function (data) {
//     console.log('standard error output:\n' + data);
// });

// // 捕获错误输出并将其打印到控制台 
// free.on('error', function (err) {
//     console.log('unexpect error output:\n' + err + '\n' + err.stack);
// });

// // 注册子进程关闭事件 
// free.on('exit', function (code, signal) {
//     console.log('child process eixt ,exit:' + code);
// });


function getAvailable(data, keys) {
    const reg = /(?<=quotas:)(.|\n)+(?=\nselfLink)/g
    let res = Array.from(data.matchAll(reg), m => m[0])
    console.log(res[0])
    return

    let itemStrArr = res.split('\n-')

    let obj = {}
    itemStrArr.forEach((str, i) => {
        if (i === 0) return;
        let item = str.split('\n')
        let limit = 0;
        let usage = 0;
        let itemKey = ''
        item.forEach((kv) => {
            kv = kv.trim()
            let [key, value] = kv.split(': ')
            if (key === 'metric') {
                itemKey = value;
            } else if (key === 'limit') {
                limit = Number.parseFloat(value)
            } else if (key === 'usage') {
                usage = Number.parseFloat(value)
            }
        })
        if (!keys.includes(itemKey)) {
            return;
        }
        obj[itemKey] = limit - usage
    })
    console.log(obj)
    return obj;
}


function getAvailableByItem(data, key) {
    let limitreg = new RegExp(`(?<=limit:(.+))(.|\n)+(?=\n(.+)metric: ${key})`, 'g')
    const limit = Number.parseFloat([...data.matchAll(limitreg)][0][0])
    const usageReg = new RegExp(`(?<=metric: ${key}(.|\n)+usage: ).+(?=\n)`)
    const usage = Number.parseFloat([...data.matchAll(usageReg)][0][0])
    return limit - usage
}

function getAvailable1(data, keys) {
    let obj = {}
    keys.forEach(key => {
        obj[key] = getAvailableByItem(data, key)
    })
    return obj
}

let data = `
quotas:
- limit: 24.0
  metric: CPUS
  usage: 1.0
- limit: 4096.0
  metric: DISKS_TOTAL_GB
  usage: 20.0
- limit: 8.0
  metric: STATIC_ADDRESSES
  usage: 1.0
- limit: 8.0
  metric: IN_USE_ADDRESSES
  usage: 1.0
- limit: 500.0
  metric: SSD_TOTAL_GB
  usage: 0.0
- limit: 6000.0
  metric: LOCAL_SSD_TOTAL_GB
  usage: 0.0
selfLink: https://www.googleapis.com/compute/v1/projects/gcp-test-293701/regions/us-central1
status: UP
`

let keys = ['CPUS', 'DISKS_TOTAL_GB', 'IN_USE_ADDRESSES',
    'INSTANCE_GROUPS', 'LOCAL_SSD_TOTAL_GB', 'STATIC_ADDRESSES'
]
getAvailable(data, keys)




