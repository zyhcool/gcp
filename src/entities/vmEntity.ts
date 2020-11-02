
import mongoose from "mongoose"

export class Vm {
    ip: string;
    vmName: string;
    gcpInstanceId: string;
    bootDisk: string;


}

type VmDocument = mongoose.Document & Vm;

const vmSchema = new mongoose.Schema({
    ip: String,
    vmName: String,
    gcpInstanceId: String,
    bootDisk: String,
}, { timestamps: true })

export const vmRepository = mongoose.model<VmDocument>("Vm", vmSchema)
