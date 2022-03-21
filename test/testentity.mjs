/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */
import ThoregonEntity from "/thoregon.archetim/lib/thoregonentity.mjs";
import MetaClass      from "/thoregon.archetim/lib/metaclass/metaclass.mjs";

class TestEntityMeta extends MetaClass {
    initiateInstance() {
        this.name = "TestEntity";

        this.text("text");
    }
}

export default class TestEntity extends ThoregonEntity() {

}

TestEntity.checkIn(import.meta, TestEntityMeta);
