import { Document, Model } from "mongoose";


export abstract class BaseService<T> {
    abstract repository: Model<T & Document>

    async find(condition, projection, options) {
        return await this.repository.find(condition, projection, options);
    }

    async findOne(condition, projection, options) {
        return await this.repository.findOne(condition, projection, options);
    }

    async save(data) {
        return await this.repository.create(data)
    }

    async update(conditions: any, doc: any) {
        return await this.repository.update(conditions, doc);
    }
}
