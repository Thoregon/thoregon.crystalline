/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import * as util from "/evolux.util";

import ServiceFacade from "../lib/servicefacade.mjs";
import JSProvider    from "../lib/providers/jsprovider.mjs";
import SimpleJS      from "./services/simplejs.mjs";

import ConsoleLogger from "../lib/consolelogger.mjs";
thoregon.archetimlogger = new ConsoleLogger();

(async () => {
    try {
        const srv = await ServiceFacade.use(await JSProvider.with(new SimpleJS()));

        let result = await srv.doit();
        console.log("service:", result);

        result = await srv.oneParam(0);
        console.log("service:", result);

        result = await srv.twoParam(true, '$');
        console.log("service:", result);

        srv.onchange = (evt) => {
            console.log(evt);
        };

        /*
            srv.subscribe('change', (evt) => {
                console.log(evt);
            });
        */

        let a = await srv.a;
        console.log("service a:", a);
        let b = await srv.b;
        console.log("1 service b:", b);
        srv.b = 'X';
        b     = await srv.b;
        console.log("2 service b:", b);

        await srv.forceTimeout();
    } catch (e) {
        console.log(">> Error", e);
    }
})();
