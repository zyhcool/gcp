
import mongoose from "mongoose"

export class Instance {
    iporderId: string;
    ip: string;
    gcpInstanceId: string;
    expiredAt: Date;
    vmName: string;
    bootDisk: string;
    rootUser: string;
    rootPassword: string;


}

type InstanceDocument = mongoose.Document & Instance;

const InstanceSchema = new mongoose.Schema({
    iporderId: String,
    ip: String,
    gcpInstanceId: String,
    expiredAt: Date,
    vmName: String,
    bootDisk: String,
    rootUser: String,
    rootPassword: String,

}, { timestamps: true })

export const instanceRepository = mongoose.model<InstanceDocument>("Instance", InstanceSchema)