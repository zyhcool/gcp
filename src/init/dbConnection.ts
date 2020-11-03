import mongoose from "mongoose"
import { Config } from "../config";
import { logger } from "../logger";
import bluebird from "bluebird"

export async function dbConnect() {
    // return await createConnection({
    //     type: "mongodb",
    //     url: config.databaseUrl,
    //     // url: 'mongodb://47.93.236.248:27017/haha',
    //     // synchronize: true,
    //     // logging: false,
    //     entities: config.entities,
    //     // extra: {
    //     //     ssl: config.dbsslconn, // if not development, will use SSL
    //     // },
    //     "useNewUrlParser": true,
    //     "useUnifiedTopology": true
    // }).catch((error: string) => console.log("TypeORM connection error: ", error));

    const mongodbUrl = Config.databaseUrl
    mongoose.Promise = bluebird
    mongoose.connect(mongodbUrl, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
    }).then(() => {
        console.log('mongodb success')
    }).catch(err => {
        console.log(err)
    })
}
