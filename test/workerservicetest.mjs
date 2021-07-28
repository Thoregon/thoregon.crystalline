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

(async () => {
    const srv = await ServiceFacade.use(await JSProvider.with(new SimpleJS()));

    let result = await srv.doit();
    console.log("service", result);

    let a = await srv.a;

    console.log("service a", a);
})();
