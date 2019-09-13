import { isUndefined } from "util";

export namespace GTems {

    export class GBase {
        toString(): string {
            return "?"
        }
    }


    function isValidAtomName(pstr: string ): boolean { 
        for (var c of pstr) {
            if (";.,()[]|&".indexOf(c) >= 0) {
                return false
            }
        }
        return true
    }


    export class Functor extends GBase {
        public name: string
        public args: GBase[]
        constructor(predname: string, ...arg1) {
            super()
            if (isValidAtomName(predname) == false) {
                throw new Error('name invalid for pred ' + predname);
            } 
                this.name = predname;
                this.args = arg1 
        }

        toString(): string { return this.name + "(" + (this.args.map((x) => { x.toString() })).join(" , ") + ")" }
    }
     
    export class Atom extends GBase{
        public name: string
        constructor(atm_name: string) {
            super()
            this.name = atm_name;
        }
        toString(): string { return this.name       }
    }

    export class Variable extends GBase {
        public name: string
        constructor(v_name: string) { 
            super()
            if (isValidAtomName(v_name) == false) {
                throw new Error('name invalid for pred ' + v_name);
            } 
            this.name = v_name;
        }
        toString(): string { return "$" + this.name  }
    }

    export class VariableBind extends GBase {
        public name: string
        public binded: GBase = undefined        

        constructor(v_name: string) {
            super()
            if (isValidAtomName(v_name) == false) {
                throw new Error('name invalid for pred ' + v_name);
            }
            this.name = v_name;
        }
        toString(): string {
            let r = "$" + this.name
            if (isUndefined(this.binded)) return r;
            r = r + "==" + this.binded.toString()
        }
    }



    export class LiteralStr extends GBase{
        public value: string
        constructor(lit_str: string) {
            super()
            this.value = lit_str;
        }
        toString(): string { return '"' + this.value + '"' }
    }

    class LiteralNumber extends GBase{
        public value: string
        constructor(lit_num: string) {
            super()
            this.value = lit_num;
        }
        toString(): string { return '#' + this.value }
    }


    export class LiteralBool extends GBase {
        public value: string
        constructor(lit_num: string) {
            super()
            this.value = lit_num;
        }
        toString(): string { return '?' + this.value  }
    }


    class GList extends GBase {
        public items: GBase[]
        constructor(_items: GBase[]) {
            super()
            this.items = _items;
        }

        toString(): string { return  "[" + (this.items.map((x) => { x.toString() })).join(" , ") + "]" }
    }

}
