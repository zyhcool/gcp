
import { BaseService } from "./baseService"
import { IVmConfig, Vm, vmRepository } from "../entities/vmEntity";
import Compute from '@google-cloud/compute'
import { Config } from "../config";
import operationPromisefy from "../utils/promisefy";
import generatePasswd from 'generate-password'


export class VmService extends BaseService<Vm>{
    repository = vmRepository

    async saveVM(vm: Vm) {
        await this.save(vm)
    }

}