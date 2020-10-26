import { Middleware, KoaMiddlewareInterface, ExpressErrorMiddlewareInterface } from "routing-controllers";
import { Context } from "koa";
import { logger } from "../logger";


@Middleware({ type: "before" })
export class ErrorHandler implements KoaMiddlewareInterface {
    async use(ctx: Context, next: (err?: any) => Promise<any>) {
        try {
            await next();
        }
        catch (e) {
            logger.error(`\n${e.message}\n${e.stack}`)
            ctx.body = {
                success: false,
                data: e.message
            }
        }
    }
}