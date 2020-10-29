import {
    Get,
    Controller,
    Authorized,
} from "routing-controllers";
import { Inject } from "typedi";
import { SkuService } from "../services/skuService";
import Compute from '@google-cloud/compute'


@Controller("/firewall")
export default class GeneralController {

    @Inject(type => SkuService)
    skuService: SkuService;

    @Get("s")
    async gets() {
        // Creates a client
        const compute = new Compute();

        const firewalls = await compute.getFirewalls({ autoPaginate: false })
        console.log(firewalls)
    }
    
    @Get("/")
    async get() {
        // Creates a client
        const compute = new Compute();

        const firewall=compute.firewall("all")
        const rule = await firewall.get();
        console.log(rule[0].metadata.sourceRanges)
        console.log(rule[0].metadata.allowed)

        const firewall1=compute.firewall("default-allow-http")
        const rule1 = await firewall1.get();
        console.log(rule1)
    }

    @Get("/create")
    async create() {
        const compute = new Compute();

        const firewall = compute.firewall('test-firewall');

        const config = {
  protocols: {
    tcp: [3000],
  },

  ranges: ['0.0.0.0/0'],
  tags:["tcp-3030","tcp-4040"],
        }
        const res = await firewall.create(config);
        const [createdFirewall,operation,apiResponse]=res
        console.log(res)
        const metadata = await createdFirewall.getMetadata()
        console.log(metadata)
        return

        const metadata1 = {
            name: "test-firewall-3030-4040",
            description:"this firewall is just for test",
            // network:"", // default: global/networks/default
            priority: 1000,
            sourceRanges:['0.0.0.0/0'],
            direction:"INGRESS",
            allowed:[
                {
                    IPProtocol:"tcp",
                    ports:[3030,4040],
                }
            ],
            logConfig:{
                enable: false,
            },

        }
        createdFirewall.setMetadata(metadata)
    }

}
