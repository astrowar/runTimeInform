"use strict";
/// <reference path="./atoms.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
const atoms_1 = require("./atoms");
var UTerm;
(function (UTerm) {
    class MatchTerm {
    }
    class MatchVar extends MatchTerm {
        constructor(_vname) {
            super();
            this.vname = _vname;
        }
    }
    ;
    class MatchLiteral extends MatchTerm {
    }
    ;
    class MatchStringLiteral extends MatchLiteral {
        constructor(_str) {
            super();
            this.str = _str;
        }
    }
    class MatchOptional extends MatchTerm {
        constructor(_inner) {
            super();
            this.inner = _inner;
        }
    }
    ;
    class VarAssigned {
        constructor(_var_name, _value) {
            this.var_name = _var_name;
            this.value = _value;
        }
        toString() { return this.var_name + ":" + this.value; }
    }
    class MatchResult {
        // public result: boolean
        //public vars: VarAssignedList
        constructor(result, vars = []) {
            this.result = result;
            this.vars = vars;
            // this.result = result;
            // this.vars = vars;
        }
        *entries() {
            for (var [i, s] of this.vars.entries()) {
                yield [s.var_name, s.value];
            }
            return;
        }
        add(other) {
            if ((this.result == false) || (other.result == false)) {
                return new MatchResult(false, []);
            }
            return new MatchResult(true, this.vars.concat(other.vars));
        }
    }
    UTerm.MatchResult = MatchResult;
    function isMatchStr(x, m) {
        if (x === m)
            return new MatchResult(true);
        if (m.indexOf("/") > -1) {
            var mme = m.split("/");
            for (var [i, e] of mme.entries()) {
                let re = isMatchStr(x, e);
                if (re.result)
                    return new MatchResult(true);
            }
        }
        return new MatchResult(false);
    }
    function isMatch(x, m) {
        //return new MatchResult(true)
        if (m instanceof MatchStringLiteral) {
            if (x.length == 1) {
                if (x[0] instanceof TermCode) {
                    return isMatchStr(x[0].gettext().trim(), m.str.trim());
                }
            }
        }
        if (m instanceof MatchVar) {
            let mv = m;
            if (x instanceof TermCode) {
                if (isBalanced(x)) {
                    return new MatchResult(true, [new VarAssigned(m.vname, x)]);
                }
            }
            else {
                return new MatchResult(true, [new VarAssigned(m.vname, x)]);
            }
        }
        if (m instanceof MatchOptional) {
            let mv = m;
            return isMatch(x, mv.inner);
        }
        return new MatchResult(false);
    }
    function isBalanced(h) {
        let eq = 0;
        let bq = 0;
        let cq = 0;
        for (var [i, x] of h.entries()) {
            if (x.isLiteral())
                continue;
            if (x.gettext() == "(")
                eq = eq + 1;
            if (x.gettext() == ")")
                eq = eq - 1;
            if (x.gettext() == "[")
                bq = bq + 1;
            if (x.gettext() == "]")
                bq = bq - 1;
            if (x.gettext() == "{")
                cq = cq + 1;
            if (x.gettext() == "}")
                cq = cq - 1;
            if (eq < 0)
                return false;
            if (bq < 0)
                return false;
            if (cq < 0)
                return false;
        }
        return eq == 0;
    }
    function* combinations(acc, xs, ms) {
        let n = ms.length;
        if (n == 1) {
            let r = isMatch(xs, ms[0]);
            if (r.result) {
                yield acc.add(r);
            }
            return;
        }
        let m = xs.length;
        if (m < n)
            return;
        for (let i = 1; i < m; ++i) {
            let h = xs.slice(0, i);
            let rx = isMatch(h, ms[0]);
            if (rx.result) {
                // let accNext = acc.concat([h])
                let accNext = acc.add(rx);
                let t = xs.slice(i, m);
                var mstail = ms.slice(1);
                for (let tt of combinations(accNext, t, mstail)) {
                    yield tt;
                }
            }
            //eh um termo optional ?
            if (ms[0] instanceof MatchOptional) {
                //testa sem o termo opcional
                var mstail = ms.slice(1);
                for (let tt of combinations(acc, xs, mstail)) {
                    yield tt;
                }
            }
        }
        return;
    }
    //function termParser(x: string): MatchTerm {
    //if (x[0] === x.toUpperCase() && x.length < 3) {
    //    return new MatchVar(x)
    //}
    function termParser(x) {
        if (x[0] === "$") {
            return new MatchVar(x);
        }
        if (x[0] === "?") {
            let inner = termParser(x.substr(1, x.length - 1));
            return new MatchOptional(inner);
        }
        return new MatchStringLiteral(x);
        //return new MatchTerm()
    }
    let CODEST;
    (function (CODEST) {
        CODEST[CODEST["SCODE"] = 0] = "SCODE";
        CODEST[CODEST["SLITERAL"] = 1] = "SLITERAL";
    })(CODEST || (CODEST = {}));
    class ITerm {
        constructor(_txt) { this.txt = _txt; }
        gettext() { return this.txt; }
        ;
        getGeneralTerm() { return null; }
        isLiteral() { return false; }
    }
    UTerm.ITerm = ITerm;
    class TermCode extends ITerm {
        constructor(_txt) { super(_txt); }
        isLiteral() { return false; }
        getGeneralTerm() {
            if (this.txt == "true") {
                return new atoms_1.GTems.LiteralBool(true);
            }
            if (this.txt == "false") {
                return new atoms_1.GTems.LiteralBool(false);
            }
            if (this.txt == "_") {
                return new atoms_1.GTems.Variable("_");
            }
            if (this.txt[0] == "$") {
                return new atoms_1.GTems.Variable((this.txt.slice(1)));
            }
            if (this.txt == "!") {
                return new atoms_1.GTems.Atom("cut");
            }
            {
                let n = Number(this.txt);
                if (isNaN(n) == false)
                    return new atoms_1.GTems.LiteralNumber(n);
            }
            if (atoms_1.GTems.Atom.isValidAtomName(this.txt))
                return new atoms_1.GTems.Atom(this.txt);
            return undefined;
        }
    }
    class TermLiteral extends ITerm {
        constructor(_txt) { super(_txt); }
        getGeneralTerm() { return new atoms_1.GTems.LiteralStr(this.txt); }
        isLiteral() { return true; }
    }
    function splitStringInput(x) {
        let state = CODEST.SCODE;
        let terms = [];
        let acc = "";
        let n = x.length;
        for (var i = 0; i < n; ++i) {
            let c = x[i];
            if (state == CODEST.SCODE) {
                if (c == '"') {
                    if (acc.length > 0)
                        terms.push(new TermCode(acc));
                    acc = "";
                    state = CODEST.SLITERAL;
                    continue;
                }
                if (c == ' ') {
                    if (acc.length > 0)
                        terms.push(new TermCode(acc));
                    acc = "";
                    continue;
                }
                if ((",;(){}|\r\n[].+-*/!#=><").indexOf(c) >= 0) {
                    if (acc.length > 0)
                        terms.push(new TermCode(acc));
                    terms.push(new TermCode(c));
                    acc = "";
                    continue;
                }
                else {
                    acc = acc + c;
                }
            }
            if (state == CODEST.SLITERAL) {
                if (c == '"') {
                    //if (acc.length > 0) 
                    terms.push(new TermLiteral(acc));
                    acc = "";
                    state = CODEST.SCODE;
                    continue;
                }
                else {
                    acc = acc + c;
                }
            }
        }
        if (state == CODEST.SCODE)
            if (acc.length > 0)
                terms.push(new TermCode(acc));
        if (state == CODEST.SLITERAL)
            if (acc.length > 0)
                terms.push(new TermLiteral(acc));
        return terms;
    }
    UTerm.splitStringInput = splitStringInput;
    function* parseString(xs, mstr) {
        let m = mstr.split(" ");
        m = m.filter(Boolean);
        if (xs.length < m.length)
            return;
        let ret = [];
        var mterm = m.map(function (x) {
            return termParser(x);
        });
        for (let t of combinations(new MatchResult(true, []), xs, mterm)) {
            yield t;
        }
        return;
    }
    UTerm.parseString = parseString;
})(UTerm = exports.UTerm || (exports.UTerm = {}));
//# sourceMappingURL=mterms.js.map