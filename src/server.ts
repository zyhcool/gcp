import Koa from "koa";
import helmet from "koa-helmet";
import bodyParser from "koa-bodyparser";
import cors from "@koa/cors";
import winston from "winston";
import "reflect-metadata";
import path from "path";

import { logger, loggerMid } from "./logger";
import { Config } from "./config";
import { cron } from "./cron";
import { useKoaServer, Action, useContainer } from "routing-controllers";
import { Container } from "typedi";
import { dbConnect } from "./init/dbConnection";
const setupServer = async () => {
    // mongodb connection
    await dbConnect();

    const app = new Koa();

    app.use(helmet());
    app.use(cors());
    app.use(loggerMid());
    app.use(bodyParser());


    // init routing-controllers
    useContainer(Container);
    useKoaServer(app, {
        routePrefix: "/api",
        controllers: [path.resolve(__dirname, "controllers/*")],
        interceptors: [path.resolve(__dirname, "interceptors/*")],
        middlewares: [path.resolve(__dirname, "middlewares/*")],
        validation: false,
        defaultErrorHandler: false,

        currentUserChecker: async (action: Action) => {
            // TODO
            const user = "this.is.user";
            return user;
        },

        authorizationChecker: async (action: Action, permissions: string[]) => {
            // TODO
            return true;
        },
    });

    app.listen(Config.port);
    console.log(`Server running on port ${Config.port}`);

    cron.start();
};

// 处理异常
process.on('unhandledRejection', (e: any) => {
    logger.error(`\n${e.message}\n${e.stack}`)
})
setupServer();
