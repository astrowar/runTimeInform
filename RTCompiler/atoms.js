"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("util");
var GTems;
(function (GTems) {
    class GBase {
        toString() {
            return "?";
        }
    }
    GTems.GBase = GBase;
    function isValidAtomName(pstr) {
        for (var c of pstr) {
            if (";.,()[]|&".indexOf(c) >= 0) {
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
        toString() { return this.name + "(" + (this.args.map((x) => { x.toString(); })).join(" , ") + ")"; }
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
            this.name = atm_name;
        }
        toString() { return this.name; }
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
        toString() { return '"' + this.value + '"'; }
    }
    GTems.LiteralStr = LiteralStr;
    class LiteralNumber extends GValue {
        constructor(lit_num) {
            super();
            this.value = lit_num;
        }
        toString() { return this.value.toString(); }
    }
    GTems.LiteralNumber = LiteralNumber;
    class LiteralBool extends GValue {
        constructor(lit_bol) {
            super();
            this.value = lit_bol;
        }
        toString() { return '?' + this.value; }
    }
    GTems.LiteralBool = LiteralBool;
    class GList extends GValue {
        constructor(_items) {
            super();
            this.items = _items;
        }
        toString() { return "[" + (this.items.map((x) => { x.toString(); })).join(" , ") + "]"; }
    }
})(GTems = exports.GTems || (exports.GTems = {}));
//# sourceMappingURL=atoms.js.map