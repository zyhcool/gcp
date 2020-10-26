import * as Axios from 'axios'
import { logger } from '../logger';

const axios = Axios.default;

class MyNet {
    constructor() {

    }

    get(url, ...args): Promise<Axios.AxiosResponse<any>> {
        return new Promise((resolve, reject) => {
            axios.get(url, ...args).then((res) => {
                resolve(res);
            }).catch((e) => {
                reject(e);
            })
        })
    }


}

const myNet = new MyNet();

export default myNet;
