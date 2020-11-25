import { spawn } from "child_process";



export class GcloudCli {
    private static gcloudcli(args: string[], command: string = 'gcloud',): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const subProcess = spawn(command, args)
            let data

            // 捕获标准输出
            subProcess.stdout.on('data', (chunk) => {
                data += chunk;
            })

            // 标准输出结束后处理业务
            subProcess.stdout.on('end', function () {
                resolve(data)
                subProcess.unref()
            });

            // 捕获标准错误输出
            subProcess.stderr.on('data', function (data) {
                reject(data)
            });

            // 捕获错误输出
            subProcess.on('error', function (err) {
                reject(err)
            });

            // 注册子进程关闭事件 
            subProcess.on('exit', function (code, signal) {
                console.log('child process eixt ,exit:' + code);
            });
        })
    }

    /**
     * @description 获取配额数据。命令行：'gcloud compute regions describe us-central1'
     * @param {string} region 地区
     * @param {string[]} keys 需要的信息参数列表
     * @return {} 
     */
    public static async getQuotas(region: string, keys: string[]) {
        let quotas: any = await this.gcloudcli(['compute', 'regions', 'describe', region])
        quotas = quotas.toString('utf8')
        const reg = /(?<=quotas:)(.|\n)+(?=\nselfLink)/g
        const res = Array.from(quotas.matchAll(reg), m => m[0])
        let itemStrArr = res[0].split('\n-')

        let obj: any = {}
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
        return obj
    }

    /**
     * @description 调整实例磁盘大小
     * @param {} 
     * @return {} gcloud compute disks resize gcp-test --size 30 --zone us-central1-a -q
     */
    public static async resizeDisk(zone: string, diskName: string, size: number) {
        let res: any = await this.gcloudcli(['compute', 'disks', 'resize', diskName, '--zone', zone, '--size', size.toString(), '-q'])

    }


}