
import mongoose from "mongoose"

export class Sku {
    name: string;
    skuId: string;
    description: string;
    category: Object;
    serviceRegions: Array<string>;
    pricingInfo: Array<any>;
    serviceProviderName: string;
    geoTaxonomy: Object
    createdAt: Date;
    updatedAt: Date;

}

type SkuDocument = mongoose.Document & Sku;

const skuSchema = new mongoose.Schema({
    name: String,
    skuId: String,
    description: String,
    category: Object,
    serviceRegions: Array,
    pricingInfo: Array,
    serviceProviderName: String,
    geoTaxonomy: Object,
    createdAt: Date,
    updatedAt: Date,
}, { timestamps: true })

export const skuRepository = mongoose.model<SkuDocument>("Sku", skuSchema)
