"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("util");
var GTems;
(function (GTems) {
    class GBase {
    }
    GTems.GBase = GBase;
    function isValidAtomName(pstr) {
        for (var c of pstr) {
            if (";.,()[]|&\n\r".indexOf(c) >= 0) {
                return false;
            }
        }
        return true;
    }
    class Functor extends GBase {
        constructor(predname, ...arg1) {
            super();
            if (isValidAtomName(predname) == false) {
                throw new Error('name invalid for pred ' + predname);
            }
            this.name = predname;
            this.args = arg1;
        }
        toString() {
            let arr = (this.args.map((x) => { return x.toString(); }));
            return this.name + "(" + arr.join(" , ") + ")";
        }
        clone() { return new Functor(this.name), this.args.map((x) => x.clone()); }
    }
    GTems.Functor = Functor;
    class Atom extends GBase {
        constructor(atm_name) {
            super();
            if (atm_name == "true") {
                throw new Error(' invalid atom name ');
            }
            if (atm_name == "false") {
                throw new Error(' invalid atom name ');
            }
            if (isValidAtomName(atm_name) == false) {
                throw new Error('name invalid for atom ' + atm_name);
            }
            if (atm_name[0] == "$")
                throw new Error('name invalid for atom ' + atm_name);
            this.name = atm_name;
        }
        toString() { return this.name; }
        clone() { return new Atom(this.name); }
    }
    GTems.Atom = Atom;
    class Variable extends GBase {
        constructor(v_name) {
            super();
            if (isValidAtomName(v_name) == false) {
                throw new Error('name invalid for pred ' + v_name);
            }
            this.name = v_name;
        }
        toString() { return "$" + this.name; }
        clone() { return new Variable(this.name); }
    }
    GTems.Variable = Variable;
    class VariableBind extends GBase {
        constructor(v_name) {
            super();
            this.binded = undefined;
            if (isValidAtomName(v_name) == false) {
                throw new Error('name invalid for pred ' + v_name);
            }
            this.name = v_name;
        }
        toString() {
            let r = "$" + this.name;
            if (util_1.isUndefined(this.binded))
                return r;
            r = r + "==" + this.binded.toString();
        }
        clone() { return new VariableBind(this.name); }
    }
    GTems.VariableBind = VariableBind;
    class GValue extends GBase {
    }
    GTems.GValue = GValue;
    class LiteralStr extends GValue {
        constructor(lit_str) {
            super();
            this.value = lit_str;
        }
        //toString(): string { return '"' + this.value + '"' }
        toString() { return this.value; }
        clone() { return new LiteralStr(this.value); }
    }
    GTems.LiteralStr = LiteralStr;
    class LiteralNumber extends GValue {
        constructor(lit_num) {
            super();
            this.value = lit_num;
        }
        toString() {
            let r = this.value.toString();
            return r;
        }
        clone() { return new LiteralNumber(this.value); }
    }
    GTems.LiteralNumber = LiteralNumber;
    class LiteralBool extends GValue {
        constructor(lit_bol) {
            super();
            this.value = lit_bol;
        }
        toString() { return '?' + this.value; }
        clone() { return new LiteralBool(this.value); }
    }
    GTems.LiteralBool = LiteralBool;
    class GList extends GValue {
        constructor(_items) {
            super();
            this.items = _items;
        }
        toString() {
            let r = "[" + (this.items.map((x) => { return x.toString(); })).join(" , ") + "]";
            return r;
        }
        clone() { return new GList(this.items.map((x) => x.clone())); }
    }
    GTems.GList = GList;
    function atom_false() { return new GTems.LiteralBool(false); }
    GTems.atom_false = atom_false;
    function atom_true() { return new GTems.LiteralBool(true); }
    GTems.atom_true = atom_true;
    function isEqually(x, y) {
        let s1 = x.toString();
        let s2 = y.toString();
        if (s1 == s2)
            return true;
        return false;
    }
    GTems.isEqually = isEqually;
    function isEquallyNumber(x, y) {
        if (x.value == y.value)
            return true;
        return false;
    }
    GTems.isEquallyNumber = isEquallyNumber;
})(GTems = exports.GTems || (exports.GTems = {}));
//# sourceMappingURL=atoms.js.map