import { Context } from "koa";
import { Config } from "./config";
import winston, { transports, format, createLogger } from "winston";

const loggerOption = {
    level: Config.debugLogging ? "debug" : "info",
    transports: [
        //
        // - Write all logs error (and below) to `error.log`.
        new transports.File({
            dirname: 'logs',
            filename: "error.log",
            level: "error",
            format: format.combine(
                format.timestamp(),
                format.printf(({ level, message, label, timestamp }) => {
                    return `${timestamp} ${level}: ${message}\r\n`
                }),
            )
        }),
        new transports.File({
            dirname: 'logs',
            filename: "debug.log",
            level: "debug",
            format: format.combine(
                format.timestamp(),
                format.printf(({ level, message, label, timestamp }) => {
                    return `${timestamp} ${level}: ${message}\r\n`
                }),
            )
        }),
    ]
}
const loggerMid = (): any => {
    if (process.env.NODE_ENV !== 'prod') {
        logger.add(
            //
            // - Write to all logs with specified level to console.
            new transports.Console({
                format: format.combine(
                    format.colorize(),
                    format.simple()
                )
            })
        )
    }

    return async (ctx: Context, next: () => Promise<any>): Promise<void> => {

        const start = new Date().getTime();

        await next();

        const ms = new Date().getTime() - start;

        let logLevel: string;
        if (ctx.status >= 500) {
            logLevel = "error";
        } else if (ctx.status >= 400) {
            logLevel = "warn";
        } else {
            logLevel = "info";
        }

        const msg = `${ctx.method} ${ctx.originalUrl} ${ctx.status} ${ms}ms`;

        logger.log(logLevel, msg);
    };
};

const logger = createLogger(loggerOption)

export { loggerMid, logger };