import {
    Get,
    Controller,
    Authorized,
} from "routing-controllers";
import { Inject } from "typedi";
import { SkuService } from "../services/skuService";
import Compute from '@google-cloud/compute'


@Controller("/general")
export default class GeneralController {

    @Inject(type => SkuService)
    skuService: SkuService;


    @Authorized()
    @Get("/helloworld")
    public async helloWorld(): Promise<any> {
        return "Hello World";
    }

    @Authorized()
    @Get("/updateData")
    async updateData() {
        await SkuService.runTask();
    }

    @Get("/create")
    async create() {
        // Creates a client
        const compute = new Compute();

        // Create a new VM using the latest OS image of your choice.
        const zone = compute.zone('us-central1-c');

        // TODO(developer): choose a name for the VM
        const vmName = 'vm-name';

        // Start the VM create task
        const [vm, operation] = await zone.createVM(vmName, { os: 'ubuntu' });
        console.log(vm);

        // `operation` lets you check the status of long-running tasks.
        await operation.promise();

        // Complete!
        console.log('Virtual machine created!');
    }

}
