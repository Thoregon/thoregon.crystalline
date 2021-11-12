/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import ThoregonEntity from "/thoregon.archetim/lib/thoregonentity.mjs";
import MetaClass      from "/thoregon.archetim/lib/metaclass/metaclass.mjs";
import BO             from "../../../thoregon.archetim/test/items/bo.mjs";

class ThoregonRequestMeta extends MetaClass {
    initiateInstance() {
        this.name = "BO";

        this.object("request", Object);
        this.object("ctrl", Object);            // can be used to notify progress
        this.object("response", Object);
    }
}

export default class ThoregonRequest extends ThoregonEntity() {

    // todo: implement encrypt/decrypt for 2 parties!
}

ThoregonRequest.checkIn(import.meta, ThoregonRequestMeta);
