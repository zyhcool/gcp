import { CronJob } from "cron";
import GcpManager from "./cloud/gcpManager";
import { logger } from "./logger";
import { SkuService } from "./services/skuService";

const skusCron = new CronJob('0 0 0 * * *', () => {
    logger.debug("Executing cron job once every day");

    // 定期获取最新gcp的sku数据
    // SkuService.runTask();

});


const cron = new CronJob('0 0 * * * *', () => {
    logger.debug("Executing cron job once every day");

    GcpManager.dealFailOrderInstances()

});

export { skusCron, };