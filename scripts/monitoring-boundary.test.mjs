import {test} from "node:test";
import assert from "node:assert/strict";
import {monitoring,createMonitoringBoundary} from "../src/components/ics/monitoring-adapter.ts";
test("default monitoring boundary is disconnected and does not transmit diagnostic content",async()=>{
 assert.equal(monitoring.configured,false);
 assert.equal(await monitoring.capture({category:"frontend-runtime",route:"/",occurredAt:"2026-10-13T00:00:00Z",release:"demo"}),false);
});
test("monitoring adapter can be supplied without coupling the app to a vendor",async()=>{
 let received=null;const adapter=createMonitoringBoundary({async capture(event){received=event;}});
 assert.equal(adapter.configured,true);assert.equal(await adapter.capture({category:"database",route:"/fees",occurredAt:"2026-10-13T00:00:00Z",release:"demo"}),true);assert.equal(received.category,"database");
});
