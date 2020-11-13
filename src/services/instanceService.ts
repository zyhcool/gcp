
import { BaseService } from "./baseService"
import { Instance, instanceRepository } from "../entities/InstanceEntity";


export class InstanceService extends BaseService<Instance>{
    repository = instanceRepository

}