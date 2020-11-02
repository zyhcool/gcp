
import { Sku, skuRepository } from "../entities/skuEntity";
import { BaseService } from "./baseService"
import fs from "fs";
import path from "path";
import { logger } from "../logger";
import myNet from "../net";
import ping from 'ping'


export class SkuService extends BaseService<Sku>{
    repository = skuRepository

}