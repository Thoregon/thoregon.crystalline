/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

class Base {
    constructor(props) {
        this.a = 'A';
        this.b = 'B';
    }

    baseDoIt() {
        console.log(">> Base.baseDoIt");
        return "done Base";
    }
}

export default class SimpleJS extends Base {

    constructor(props) {
        super(props);
        this.c = 'C';
        this.d = 'D';
    }

    doit() {
        console.log(">> SimpleSJ.doit");
        return "done SimpleJS";
    }

    oneParam(a) {
        console.log(">> SimpleSJ.oneParam", a);
        return `oneParam ${a}`;
    }

    twoParam(b,c) {
        console.log(">> SimpleSJ.twoParam", b, c);
        return `twoParam ${b}, ${c}`;
    }

    /*async*/ forceTimeout() {
        return new Promise(resolve => {
            setTimeout(resolve, 1000000);
        });
    }

}
