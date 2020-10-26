import { CronJob } from "cron";
import { logger } from "./logger";
import { SkuService } from "./services/skuService";

const cron = new CronJob('0 0 0 * * *', () => {
    logger.debug("Executing cron job once every day");

    // 定期获取最新gcp的sku数据
    // SkuService.runTask();
});

export { cron };