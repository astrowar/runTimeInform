import { isUndefined } from "util";

export namespace GTems {

    export abstract class GBase {
        abstract  toString(): string  
      abstract   clone( )    ;
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

        toString(): string 
        { 
            let arr = (this.args.map((x) => { return x.toString() }))
            return this.name + "(" + arr.join(" , ") + ")" 
       }
        clone( ) { return new Functor(this.name)  ,this.args.map((x)=>x.clone()) }
    }
     
    export class Atom extends GBase{
        public name: string
        constructor(atm_name: string) {
            super()
            if (atm_name =="true")    { 
                throw new Error(' invalid atom name '  ); 
            }
            if (atm_name =="false")  { 
                throw new Error(' invalid atom name '  ); 
            }

            if (isValidAtomName(atm_name) == false) {
                throw new Error('name invalid for atom ' + atm_name);
            }

            this.name = atm_name;
        }
        toString(): string { return this.name       }
        clone( ) { return new Atom(this.name) }
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
        clone( ) { return new Variable(this.name) }
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
        clone( ) { return new VariableBind(this.name) }
    }


    export abstract class GValue extends GBase {
     
       
    }

    export class LiteralStr extends GValue{
        public value: string
        constructor(lit_str: string) {
            super()
            this.value = lit_str;
        }
        toString(): string { return '"' + this.value + '"' }
        clone( ) { return new LiteralStr(this.value) }
    }

    export class LiteralNumber extends GValue{
        public value: number
        constructor(lit_num: number) {
            super()
            this.value = lit_num;
        }
        toString(): string 
        { 
            let r =   this.value.toString() 
            return r
        }
        clone( ) { return new LiteralNumber(this.value) }
    }


    export class LiteralBool extends GValue {
        public value: boolean
        constructor(lit_bol: boolean) {
            super()
            this.value = lit_bol;
        }
        toString(): string { return '?' + this.value  }
        clone( ) { return new LiteralBool(this.value) }
    }


    export  class GList extends GValue {
        public items: GBase[]
        constructor(_items: GBase[]) {
            super()
            this.items = _items;
        }

        toString(): string 
        {
            let r =  "[" + (this.items.map((x) => { return  x.toString() })).join(" , ") + "]" 
            return r
        }
        clone( ) { return new GList( this.items.map((x)=>x.clone())) }
 
    }

}
