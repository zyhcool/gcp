import { CronJob } from "cron";
import Container from "typedi";
import GcpManager from "./cloud/gcpManager";
import { logger } from "./logger";
import { OrderService } from "./services/orderService";

const orderservice = Container.get(OrderService)

const skusCron = new CronJob('0 0,10,20,30,40,50 * * * *', () => {
    logger.debug("Executing cron job once every day");

    // 定期获取最新gcp的sku数据
    // SkuService.runTask();
    orderservice.retryDeploy()

});


const cron = new CronJob('0 0 * * * *', () => {
    logger.debug("Executing cron job once every hour");

    GcpManager.dealFailOrderInstances()

});

export { skusCron, cron };