
import { Instance, instanceRepository } from "../entities/instanceEntity"
import { BaseService } from "./baseService"


export class InstanceService extends BaseService<Instance>{
    repository = instanceRepository

}