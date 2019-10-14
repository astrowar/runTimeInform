"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mterms_1 = require("./mterms");
const util_1 = require("util");
var parseString = mterms_1.UTerm.parseString;
var splitStringInput = mterms_1.UTerm.splitStringInput;
var MParse;
(function (MParse) {
    class PSyntaxError {
        constructor(message) {
            this.message = message;
        }
    }
    MParse.PSyntaxError = PSyntaxError;
    class Matchfunctior {
        constructor(mstr, func) {
            this.mstr = mstr;
            this.func = func;
        }
    }
    MParse.Matchfunctior = Matchfunctior;
    function isSameTermArray(a, b) {
        if (util_1.isString(b)) {
            return false;
        }
        if (a.length != b.length)
            return false;
        let n = a.length;
        for (var i = 0; i < n; i++) {
            if (a[i].txt != b[i].txt) {
                return false;
            }
        }
        return true; //todos iguais
    }
    function* genPattens_ii(iline, matc) {
        {
            for (var vqxxxx of parseString(iline, matc)) {
                let vxxx = vqxxxx;
                let q = {};
                let matchIsValid = true;
                for (var sxxx of vxxx.entries()) {
                    let varname = sxxx[0];
                    if (q[varname] == undefined) {
                        q[varname] = sxxx[1];
                    }
                    else {
                        //verifica se ja existe e se é a mesma coisa
                        let term_old = q[varname];
                        if (isSameTermArray(term_old, sxxx[1]) == false) {
                            matchIsValid = false;
                            break;
                        }
                    }
                    //yield sxxx
                }
                if (matchIsValid)
                    yield q;
            }
        }
        return;
    }
    class MFragmentKind {
        constructor(txt, optional) {
            this.txt = txt;
            this.optional = optional;
            if (this.optional) {
                if (this.txt[0] == '(') {
                    this.txt = this.txt.slice(1, this.txt.length - 1);
                }
            }
        }
    }
    MParse.MFragmentKind = MFragmentKind;
    function find_end_term(m, j) {
        let n = m.length;
        let p = 0;
        for (let i = j; i < n; ++i) {
            if ((m[i] == ' ') && (p == 0))
                return i;
            if (m[i] == '(')
                p = p + 1;
            if (m[i] == ')') {
                if (p == 1)
                    return i + 1;
                p = p - 1;
            }
        }
        return n;
    }
    function classifySegments(m) {
        let n = m.length;
        let terms = [];
        let i = 0;
        let pivot = 0;
        while (i < n) {
            if (m[i] == '?') {
                if (i - 1 > pivot)
                    terms.push(new MFragmentKind(m.slice(pivot, i - 1), false));
                let j = find_end_term(m, i + 1);
                terms.push(new MFragmentKind(m.slice(i + 1, j), true));
                pivot = j;
            }
            i++;
        }
        if (n > pivot)
            terms.push(new MFragmentKind(m.slice(pivot, n), false));
        return terms;
    }
    function* expand_rem(acc, rem) {
        if (rem.length == 0) {
            yield acc.join(" ");
        }
        else {
            let acc_nex = acc.concat([rem[0].txt]);
            for (var x of expand_rem(acc_nex, rem.slice(1))) {
                yield x;
            }
            if (rem[0].optional) {
                for (var x of expand_rem(acc, rem.slice(1))) {
                    yield x;
                }
            }
        }
    }
    function* expand_i(m) {
        //separa em fix segments e optional  
        let n = m.length;
        let terms = classifySegments(m);
        for (var mx of expand_rem([], terms)) {
            yield mx;
        }
        //yield m
    }
    function expand(matc) {
        let ret = [];
        for (var [i, m] of matc.entries()) {
            for (var mii of expand_i(m.mstr)) {
                ret.push(new Matchfunctior(mii, m.func));
            }
        }
        return ret;
    }
    function* genPattens_i(iline, matc) {
        let matc_ex = expand(matc);
        for (var [i, m] of matc_ex.entries()) {
            let anskitp = false;
            for (var rr of genPattens_ii(iline, m.mstr)) {
                yield ([rr, m.func]);
                anskitp = true;
            }
            //if (anskitp) break
        }
    }
    MParse.genPattens_i = genPattens_i;
    function* uparseString(line, pmatch) {
        let sline = splitStringInput(line);
        for (var mii of expand_i(pmatch)) {
            for (var rr of genPattens_ii(sline, mii)) {
                yield rr;
            }
        }
    }
    MParse.uparseString = uparseString;
})(MParse = exports.MParse || (exports.MParse = {}));
//# sourceMappingURL=parse.js.map