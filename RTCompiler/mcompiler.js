"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("util");
/// <reference path="./mterms.ts" />
//import * as mterms from "./mterms";
const mterms_1 = require("./mterms");
const atoms_1 = require("./atoms");
const interp_1 = require("./interp");
var parseString = mterms_1.UTerm.parseString;
var splitStringInput = mterms_1.UTerm.splitStringInput;
class Parser {
}
var SyntaxParser;
(function (SyntaxParser) {
    class PSyntaxError {
        constructor(message) {
            this.message = message;
        }
    }
    class Matchfunctior {
        constructor(mstr, func) {
            this.mstr = mstr;
            this.func = func;
        }
    }
    function* genPattens_ii(iline, matc) {
        {
            for (var vqxxxx of parseString(iline, matc)) {
                let vxxx = vqxxxx;
                let q = {};
                for (var sxxx of vxxx.entries()) {
                    q[sxxx[0]] = sxxx[1];
                    //yield sxxx
                }
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
    function resolve_as(args) {
        let codeexpr = Array.from(codebodyMatch(args));
        if (codeexpr.length > 0)
            return codeexpr[0];
        //aqui ..................esta o problema das EXP dentro das Expo
        let q = args.map(function (t) { return t.getGeneralTerm(); });
        return q;
    }
    function isBalanced(x) {
        let n = x.length;
        var x_par = 0;
        var x_bra = 0;
        var x_str = false;
        for (var i = 0; i < n; ++i) {
            if (x[i].txt == ")")
                x_par = x_par - 1;
            if (x[i].txt == "(")
                x_par = x_par + 1;
            if (x[i].txt == "]")
                x_bra = x_bra - 1;
            if (x[i].txt == "[")
                x_bra = x_bra + 1;
            if (x[i].txt === '"')
                x_str = !x_str;
            if (x_par < 0)
                return false;
            if (x_bra < 0)
                return false;
        }
        if (x_par !== 0)
            return false;
        if (x_bra !== 0)
            return false;
        if (x_str == true)
            return false;
        return true;
    }
    function resolve_args(args) {
        if (args.length == 0)
            return [];
        if (isBalanced(args) == false)
            return undefined;
        let arg_b = [];
        let acc = [];
        let n = args.length;
        let args_c = splitTerms(args, ",");
        for (var [i, ac] of args_c.entries()) {
            let rac = resolve_as(ac);
            arg_b.push(rac);
        }
        // for (var i = 0; i < n; i++)
        // {
        //     if (args[i].isLiteral() ==false && args[i].gettext() == ",") {
        //         if (acc.length > 0) arg_b.push(resolve_as(acc))
        //         acc = []
        //     }
        //     else {
        //         acc.push(args[i])
        //     }
        // }
        // if (acc.length > 0) arg_b.push(resolve_as(acc))
        return arg_b;
    }
    function isValidAtomName(pname) {
        if (pname.length != 1)
            return false;
        let pstr = (pname.map(function (t) { return t.gettext(); })).join();
        for (var c of pstr) {
            if (";.,()[]|&+-*/".indexOf(c) >= 0) {
                return false;
            }
        }
        return true;
    }
    function funct_resolve_2(pname, args, args2) {
        if (pname.length != 1)
            return undefined;
        let arg_a = resolve_args(args);
        if (util_1.isUndefined(arg_a))
            return undefined;
        let arg_a2 = resolve_args(args2);
        if (util_1.isUndefined(arg_a2))
            return undefined;
        if (isValidAtomName(pname) == false)
            return undefined;
        let patm = pname[0].getGeneralTerm();
        arg_a = arg_a.concat(arg_a2);
        return new atoms_1.GTems.Functor(patm.toString(), ...arg_a);
    }
    function funct_resolve(pname, args) {
        if (pname.length != 1)
            return undefined;
        let arg_a = resolve_args(args);
        if (util_1.isUndefined(arg_a))
            return undefined;
        if (isValidAtomName(pname) == false)
            return undefined;
        let patm = pname[0].getGeneralTerm();
        return new atoms_1.GTems.Functor(patm.toString(), ...arg_a);
    }
    function* funct_0(args_dict) {
        let pname = args_dict["$funct"];
        yield new atoms_1.GTems.Functor(pname[0].txt);
        //let r = pname[0].getGeneralTerm()
        //yield r
    }
    function* funct_z(args_dict) {
        let pname = args_dict["$funct"];
        if (pname.length == 1)
            yield new atoms_1.GTems.Functor(pname[0].txt);
    }
    function* funct_1(args_dict) {
        yield funct_resolve(args_dict["$funct"], args_dict["$A"]);
    }
    function* funct_2(args_dict) {
        let pname = args_dict["$funct"];
        if (pname.length != 1)
            return undefined;
        let arg_a = resolve_args(args_dict["$A"]);
        if (util_1.isUndefined(arg_a) == false) {
            let arg_b = resolve_args(args_dict["$B"]);
            if (util_1.isUndefined(arg_b) == false) {
                let patm = pname[0].getGeneralTerm();
                arg_a = arg_a.concat(arg_b);
                yield new atoms_1.GTems.Functor(patm.toString(), ...arg_a);
            }
        }
    }
    function* funct_and(args_dict) {
        let pname1 = args_dict["$funct1"];
        if (pname1.length != 1)
            return undefined;
        let pname2 = args_dict["$funct2"];
        if (pname2.length != 1)
            return undefined;
        let arg_1 = args_dict["$args1"];
        let arg_2 = args_dict["$args2"];
        let p1 = funct_resolve(pname1, arg_1);
        if (util_1.isUndefined(p1))
            return undefined;
        let p2 = funct_resolve(pname2, arg_2);
        if (util_1.isUndefined(p2))
            return undefined;
        yield new atoms_1.GTems.Functor("and", p1, p2);
    }
    function* funct_rem(args_dict) {
        let pname1 = args_dict["$funct1"];
        if (pname1.length != 1)
            return undefined;
        let arg_1 = args_dict["$args1"];
        let p1 = funct_resolve(pname1, arg_1);
        if (util_1.isUndefined(p1))
            return undefined;
        for (var pnext of predDecl(args_dict["$rem"])) {
            if (util_1.isUndefined(pnext))
                continue;
            yield new atoms_1.GTems.Functor("and", p1, pnext);
        }
        return;
    }
    function* funct_rem_or(args_dict) {
        let pname1 = args_dict["$funct1"];
        if (pname1.length != 1)
            return undefined;
        let arg_1 = args_dict["$args1"];
        let p1 = funct_resolve(pname1, arg_1);
        if (util_1.isUndefined(p1))
            return undefined;
        for (var pnext of predDecl(args_dict["$rem"])) {
            if (util_1.isUndefined(pnext))
                continue;
            yield new atoms_1.GTems.Functor("or", p1, pnext);
        }
        return;
    }
    function* predDecl(args) {
        let basePathens = [
            new Matchfunctior("$funct1 ( $args1 ) , $funct2 ( $args2 )", funct_and),
            new Matchfunctior("$funct1 ( $args1 ) , $rem", funct_rem),
            new Matchfunctior("$funct1 ( $args1 ) | $rem", funct_rem_or),
            //new Matchfunctior("$funct ( $A , $B )", funct_2),
            new Matchfunctior("$funct ( $A )", funct_1),
            new Matchfunctior("$funct (  )", funct_0),
            new Matchfunctior(" ( $A , $funct , $B )", funct_2),
            new Matchfunctior("$funct", funct_z)
        ];
        for (var vj of genPattens_i(args, basePathens)) {
            let pool = [];
            for (var vv of vj[1](vj[0])) {
                if (util_1.isUndefined(vv) == false) {
                    pool.push(vv);
                }
                else {
                    pool = []; //um termo nao deu certo .. invalida toda sequencia
                    break;
                }
            }
            //alimanta saida dos termos
            for (var [i, vv] of pool.entries())
                yield vv;
            if (pool.length > 0)
                break;
        }
    }
    // Serarate Terms by
    function splitTerms(x, sep) {
        let r = [];
        let acc = [];
        let n = x.length;
        var x_par = 0;
        var x_bra = 0;
        var x_str = false;
        for (var i = 0; i < n; ++i) {
            if (x[i].txt == ")")
                x_par = x_par - 1;
            if (x[i].txt == "(")
                x_par = x_par + 1;
            if (x[i].txt == "]")
                x_bra = x_bra - 1;
            if (x[i].txt == "[")
                x_bra = x_bra + 1;
            if (x[i].txt === '"')
                x_str = !x_str;
            if (x_bra == 0 && x_par == 0 && x_str == false) {
                if (x[i].txt === sep) {
                    if (acc.length > 0)
                        r.push(acc);
                    acc = [];
                    continue;
                }
            }
            acc.push(x[i]);
        }
        if (acc.length > 0)
            r.push(acc);
        return r;
    }
    //==============================================================================================
    function* expr_inner(args_dict) {
        let pname = args_dict["$X"];
        if (util_1.isUndefined(pname))
            return undefined;
        for (var cy of codebodyMatch(pname))
            yield cy;
    }
    function* expr_and(args_dict) {
        let x = args_dict["$X"];
        let y = args_dict["$Y"];
        for (var cx of codebodyMatch(x)) {
            if (util_1.isUndefined(cx))
                continue;
            for (var cy of codebodyMatch(y)) {
                if (util_1.isUndefined(cy))
                    continue;
                yield new atoms_1.GTems.Functor("and", cx, cy);
            }
        }
    }
    function* expr_or(args_dict) {
        let x = args_dict["$X"];
        let y = args_dict["$Y"];
        for (var cx of codebodyMatch(x)) {
            if (util_1.isUndefined(cx))
                continue;
            for (var cy of codebodyMatch(y)) {
                if (util_1.isUndefined(cy))
                    continue;
                yield new atoms_1.GTems.Functor("or", cx, cy);
            }
        }
    }
    function* expr_xy_operator(op_name, args_dict) {
        let x = args_dict["$X"];
        let y = args_dict["$Y"];
        for (var cx of codebodyMatch(x)) {
            if (util_1.isUndefined(cx))
                continue;
            for (var cy of codebodyMatch(y)) {
                if (util_1.isUndefined(cy))
                    continue;
                yield new atoms_1.GTems.Functor(op_name, cx, cy);
            }
        }
    }
    function* expr_plus(args_dict) {
        for (var x of expr_xy_operator("plus", args_dict))
            yield x;
    }
    function* expr_minus(args_dict) {
        for (var x of expr_xy_operator("minus", args_dict))
            yield x;
    }
    function* expr_GT(args_dict) {
        for (var x of expr_xy_operator(">", args_dict))
            yield x;
    }
    function* expr_LT(args_dict) {
        for (var x of expr_xy_operator("<", args_dict))
            yield x;
    }
    function* expr_GTE(args_dict) {
        for (var x of expr_xy_operator(">=", args_dict))
            yield x;
    }
    function* expr_LTE(args_dict) {
        for (var x of expr_xy_operator("<=", args_dict))
            yield x;
    }
    function* expr_MUL(args_dict) {
        for (var x of expr_xy_operator("*", args_dict))
            yield x;
    }
    function* expr_DIV(args_dict) {
        for (var x of expr_xy_operator("/", args_dict))
            yield x;
    }
    function* expr_MOD(args_dict) {
        for (var x of expr_xy_operator("%", args_dict))
            yield x;
    }
    function* expr_UNIFY(args_dict) {
        for (var x of expr_xy_operator("unify", args_dict))
            yield x;
    }
    function* expr_EQUAL(args_dict) {
        for (var x of expr_xy_operator("equal", args_dict))
            yield x;
    }
    function* expr_funct(args_dict) {
        let fname = args_dict["$funct"];
        if (fname.length != 1)
            return undefined;
        let fargs = args_dict["$args"];
        if (util_1.isUndefined(fargs) == false) {
            let p1 = funct_resolve(fname, fargs);
            yield p1;
        }
    }
    function* expr_funct_m(args_dict) {
        let fname = args_dict["$funct"];
        if (fname.length != 1)
            return undefined;
        let fargs_1 = args_dict["$a1"];
        if (util_1.isUndefined(fargs_1) == false) {
            let fargs_2 = args_dict["$a2"];
            if (util_1.isUndefined(fargs_2) == false) {
                let p1 = funct_resolve_2(fname, fargs_1, fargs_2);
                yield p1;
            }
        }
    }
    function* expr_funct_0(args_dict) {
        let fname = args_dict["$funct"];
        if (fname.length != 1)
            return undefined;
        let p1 = funct_resolve(fname, []);
        yield p1;
    }
    function* expr_atorm_reserv(value) {
        if (value == "false")
            yield new atoms_1.GTems.LiteralBool(false);
        else if (value == "true")
            yield new atoms_1.GTems.LiteralBool(true);
        else
            yield new atoms_1.GTems.Atom(value);
    }
    function* expr_lst(args_dict) {
        let x = args_dict["$X"];
        if (util_1.isUndefined(x)) {
            yield new atoms_1.GTems.GList([]); //empty list
            return;
        }
        let xs = splitTerms(x, ",");
        let lst_x = [];
        for (var [i, xj] of xs.entries()) {
            for (var cx of codebodyMatch(xj)) {
                if (util_1.isUndefined(cx)) {
                    return;
                }
                lst_x.push(cx);
                break;
            }
            yield new atoms_1.GTems.GList(lst_x);
        }
    }
    function* expr_literal(args_dict) {
        let x = args_dict["$X"];
        if (x.length == 1) {
            let n = Number(x[0].txt);
            if (isNaN(n) == false) {
                yield new atoms_1.GTems.LiteralNumber(n);
                return;
            }
        }
        if (x.length == 1)
            yield x[0].getGeneralTerm();
        if (x.length == 2) {
            if (x[0].txt == '+') {
                let n = Number(x[1].txt);
                if (isNaN(n) == false) {
                    yield new atoms_1.GTems.LiteralNumber(n);
                }
            }
            if (x[0].txt == '-') {
                let n = Number(x[1].txt);
                if (isNaN(n) == false) {
                    yield new atoms_1.GTems.LiteralNumber(-n);
                }
            }
        }
    }
    function* codebodyMatch(args) {
        let basePathens = [
            new Matchfunctior("{ $X }", expr_inner),
            new Matchfunctior("true", (x) => { return expr_atorm_reserv("true"); }),
            new Matchfunctior("false", (x) => { return expr_atorm_reserv("false"); }),
            new Matchfunctior("fail", (x) => { return expr_atorm_reserv("fail"); }),
            new Matchfunctior("done", (x) => { return expr_atorm_reserv("done"); }),
            new Matchfunctior("!", (x) => { return expr_atorm_reserv("cut"); }),
            new Matchfunctior("$X , $Y", expr_and),
            new Matchfunctior("$X ; $Y", expr_or),
            new Matchfunctior("$X = = $Y", expr_EQUAL),
            new Matchfunctior("$X = $Y", expr_UNIFY),
            new Matchfunctior("$X + $Y", expr_plus),
            new Matchfunctior("$X - $Y", expr_minus),
            new Matchfunctior("$X > $Y", expr_GT),
            new Matchfunctior("$X < $Y", expr_LT),
            new Matchfunctior("$X > = $Y", expr_GTE),
            new Matchfunctior("$X < = $Y", expr_LTE),
            new Matchfunctior("$X * $Y", expr_MUL),
            new Matchfunctior("$X / $Y", expr_DIV),
            new Matchfunctior("$X % $Y", expr_MOD),
            new Matchfunctior("$funct (   )", expr_funct_0),
            new Matchfunctior("$funct ( $args )", expr_funct),
            new Matchfunctior("( $a1 , $funct , $a2  )", expr_funct_m),
            new Matchfunctior("[ $X ]", expr_lst),
            new Matchfunctior("[ ]", expr_lst),
            new Matchfunctior("$X ", expr_literal)
        ];
        for (var vj of genPattens_i(args, basePathens)) {
            let pool = [];
            for (var vv of vj[1](vj[0])) {
                if (util_1.isUndefined(vv) == false) {
                    pool.push(vv);
                }
                else {
                    pool = []; //um termo nao deu certo .. invalida toda sequencia
                    break;
                }
            }
            //alimanta saida dos termos
            for (var [i, vv] of pool.entries())
                yield vv;
            if (pool.length > 0)
                break;
        }
    }
    function* codeBody(y) {
        //maior e mais complexa funcao
        for (var cy of codebodyMatch(y)) {
            yield cy;
        }
    }
    function syntax_xyz(args_dict, reFunc) {
        let x = args_dict["$X"];
        let y = args_dict["$Y"];
        let z = args_dict["$Z"];
        for (var px of predDecl(x)) {
            for (var cy of codeBody(y)) {
                for (var cz of codeBody(z)) {
                    reFunc(px, cy, cz, []);
                    return true;
                }
            }
        }
        return false;
    }
    function syntax_xy(args_dict, reFunc) {
        let x = args_dict["$X"];
        let y = args_dict["$Y"];
        for (var px of predDecl(x)) {
            for (var cy of codeBody(y)) {
                // console.dir([px, cy, []], { depth: null })
                reFunc(px, cy, undefined, []);
                return true;
            }
        }
        return false;
    }
    function syntax_x(args_dict, reFunc) {
        let x = args_dict["$X"];
        for (var px of predDecl(x)) {
            //console.dir([px, [], []], { depth: null })
            reFunc(px, new atoms_1.GTems.LiteralBool(true), undefined, []);
            return true;
        }
        return false;
    }
    function unless_xyz(args_dict, reFunc) {
        return syntax_xyz(args_dict, (p, body, cond, poptions) => { p.name = p.name; reFunc(p, body, cond, poptions.concat(["unless"])); });
    }
    function unless_xy(args_dict, reFunc) {
        return syntax_xy(args_dict, (p, body, cond, poptions) => { p.name = p.name; reFunc(p, body, cond, poptions.concat(["unless"])); });
    }
    function unless_x(args_dict, reFunc) {
        return syntax_x(args_dict, (p, body, cond, poptions) => { p.name = p.name; reFunc(p, body, cond, poptions.concat(["unless"])); });
    }
    function syntax_xyz_direct(args_dict, reFunc) {
        return syntax_xyz(args_dict, (p, body, cond, poptions) => { reFunc(p, body, cond, poptions.concat(["direct"])); });
    }
    function syntax_xy_direct(args_dict, reFunc) {
        return syntax_xy(args_dict, (p, body, cond, poptions) => { reFunc(p, body, cond, poptions.concat(["direct"])); });
    }
    function syntax_x_direct(args_dict, reFunc) {
        return syntax_x(args_dict, (p, body, cond, poptions) => { reFunc(p, body, cond, poptions.concat(["direct"])); });
    }
    function syntax_xyz_low(args_dict, reFunc) {
        return syntax_xyz(args_dict, (p, body, cond, poptions) => { reFunc(p, body, cond, poptions.concat(["lowP"])); });
    }
    function syntax_xy_low(args_dict, reFunc) {
        return syntax_xy(args_dict, (p, body, cond, poptions) => { reFunc(p, body, cond, poptions.concat(["lowP"])); });
    }
    function syntax_x_low(args_dict, reFunc) {
        return syntax_x(args_dict, (p, body, cond, poptions) => { reFunc(p, body, cond, poptions.concat(["lowP"])); });
    }
    function syntax_xyz_high(args_dict, reFunc) {
        return syntax_xyz(args_dict, (p, body, cond, poptions) => { reFunc(p, body, cond, poptions.concat(["highP"])); });
    }
    function syntax_xy_high(args_dict, reFunc) {
        return syntax_xy(args_dict, (p, body, cond, poptions) => { reFunc(p, body, cond, poptions.concat(["highP"])); });
    }
    function syntax_x_high(args_dict, reFunc) {
        return syntax_x(args_dict, (p, body, cond, poptions) => { reFunc(p, body, cond, poptions.concat(["highP"])); });
    }
    function before_x(args_dict, reFunc) {
        return syntax_x(args_dict, reFunc);
    }
    function before_xy(args_dict, reFunc) {
        return syntax_xy(args_dict, reFunc);
    }
    function before_xyz(args_dict, reFunc) {
        return syntax_xyz(args_dict, reFunc);
    }
    class LineCode {
        constructor(line, addr, linenumber) {
            this.line = line;
            this.addr = addr;
            this.linenumber = linenumber;
        }
    }
    function linesSplit(xcode) {
        let n = xcode.length;
        let xc = "";
        let xcs = [];
        let p = 0;
        let lc = 0;
        for (var i = 0; i < n; ++i) {
            if (xcode[i] == "\n")
                lc = lc + 1;
            if (xcode[i] == "\r")
                continue;
            if (xcode[i] == "{") {
                p = p + 1;
            }
            if (xcode[i] == "}") {
                p = p - 1;
            }
            if (p < 0)
                return undefined; //error
            if (xcode[i] == "\n") {
                if (p == 0) {
                    if (xc.length > 0)
                        xcs.push(new LineCode(xc, i, lc));
                    xc = "";
                }
                else {
                    xc = xc + " \n ";
                }
            }
            else {
                xc = xc + xcode[i];
            }
        }
        if (xc.length > 0)
            xcs.push(new LineCode(xc, i, lc));
        return xcs;
    }
    function isEmptyLine(x) {
        var regex = /^\s+$/;
        if (x.match(regex))
            return true;
        return false;
    }
    function MatchSyntaxDecl(xcode, resolutionFunc) {
        let basePathens = [
            new Matchfunctior("do $X = > $Y if $Z", syntax_xyz_direct),
            new Matchfunctior("do $X = > $Y ", syntax_xy_direct),
            new Matchfunctior("do -  $X as $Y if $Z", syntax_xyz_low),
            new Matchfunctior("do -  $X as $Y ", syntax_xy_low),
            new Matchfunctior("do -  $X  ", syntax_x_low),
            new Matchfunctior("do +  $X as $Y if $Z", syntax_xyz_high),
            new Matchfunctior("do +  $X as $Y ", syntax_xy_high),
            new Matchfunctior("do +  $X  ", syntax_x_high),
            new Matchfunctior("do  $X as $Y if $Z", syntax_xyz),
            new Matchfunctior("do  $X as $Y ", syntax_xy),
            new Matchfunctior("do  $X  ", syntax_x),
            new Matchfunctior("do  $X as $Y if $Z", syntax_xyz),
            new Matchfunctior("do  $X as $Y ", syntax_xy),
            new Matchfunctior("do  $X  ", syntax_x),
            new Matchfunctior("unless  $X as $Y if $Z", unless_xyz),
            new Matchfunctior("unless  $X as $Y ", unless_xy),
            new Matchfunctior("unless  $X  ", unless_x),
            new Matchfunctior("do  $X  ?.", syntax_x),
            new Matchfunctior("before  $X as  $Y if $Z", before_xyz),
            new Matchfunctior("before  $X as  $Y ", before_xy),
            new Matchfunctior("before  $X ", before_x)
        ];
        let xlines = linesSplit(xcode);
        for (var [i, iline] of xlines.entries()) {
            if (isEmptyLine(iline.line))
                continue;
            let sline = splitStringInput(iline.line);
            let has_code = false;
            for (var vj of genPattens_i(sline, basePathens)) {
                has_code = vj[1](vj[0], resolutionFunc);
                if (has_code)
                    break;
            }
            if (has_code == false) {
                console.log("Syntax Error at Line " + iline.linenumber);
                return;
            }
        }
    }
    SyntaxParser.MatchSyntaxDecl = MatchSyntaxDecl;
    function MatchSyntaxGoal(xcode, resolutionFunc) {
        let xlines = linesSplit(xcode);
        for (var [i, iline] of xlines.entries()) {
            let sline = splitStringInput(iline.line);
            let hasE = false;
            for (var px of codebodyMatch(sline)) {
                let s = resolutionFunc(px);
                hasE = true;
                break;
            }
            if (hasE == false) {
                console.log("Syntax Error at Line " + iline.linenumber);
                return;
            }
        }
    }
    SyntaxParser.MatchSyntaxGoal = MatchSyntaxGoal;
})(SyntaxParser || (SyntaxParser = {}));
let ancode = `
do lit($r),Room($r) as true if contains($r,$d), lit($d)
do class(Thing).
do class(Room).
do Thing(  book).
do Localtion(  book) as limbo
do Room(limbo).

//condicao default de todas as salas
do lit(Room) as false.    
 
do lit(flashlight) as on(flashlight)
do on(flashlight) as state(flashlight, on)
do state(flashlight, on|off) 
do desc(flashlight) as "an flashligh,usefull for lit "

`;
let rulecodes = ` 
do Thing($obj),concealed($obj) | visible($obj) as true

      do  concealed($obj) as false if discovered($obj)
      do  concealed($obj) as true if carried($obj,$person),wear($person,something),small($obj)
      do  concealed($obj) as false  
      do  look($obj) as {
          print("Message");
          score := score + 1
      }
//understand "flash" or "light" as flashlight. 
do alias("flash","flashlight").
do alias("light","flashlight") .

do alias("the flashlight",flashlight).
do state(flashlight,lit|unlit).

do state(flashlight) as unlit.

do action(finding).
do command("find [something]") as finding.

carry_out  finding(flashlight) as { 
    if location(player)==location(flashlight) {
       move( flashlight, player)
       now( flashlight, lit)
       say("You grope around in the darkness, find the flashlight and turn it back on.") 
       action_stop()
     }

before going(south,Lighted Area) as {
    say "you need to take the flashlight before traveling into the dark.";
    action_stop()
   }  if location(player)!=location(flashlight)  
`;
let prices = `

    do price_contents($obj) as {  $contents = findall($x, inside($x ,$obj)) ,  maplist( price, $contents, $prices ) , sum($prices)   }  if container($obj)

    const price_teasure as 10
    const price_to_clean as 2

    do- price($obj) as 0
    do price($obj) as price_teasure if Teasure(obj)    
    do price($obj) as { price($obj) + price_contents($obj)  }  if Container($obj)
    do price($obj) as { price($obj) - price_to_clean }  if dirt($obj)
    do+ price($obj) as {  max( 0 , price($obj) )  } 
    
unless r($x,$y,$c) as r($x,$z,$c1),r($z,$y,$c2), $c = - 1
do r( a,b,1).
do r( b,c,1).
do r( c,d,2).
do r( d,f,1).
do r( a,e,5).
do r( e,f,5).

    `;
let simple = `
 
 

 

`;
function processScript(src) {
    let ctx = new interp_1.Interp.Context();
    SyntaxParser.MatchSyntaxDecl(src, (x, y, z, prio) => { return ctx.addPredicateFunc(x, y, z, prio); });
    return ctx;
}
var fs = require('fs');
let ctx = undefined;
let script_filename = 'script.txt';
if (fs.existsSync(script_filename)) {
    var s = fs.readFileSync(script_filename, 'utf8');
    ctx = processScript(s);
}
else {
    throw "Script " + script_filename + " File Not found";
}
SyntaxParser.MatchSyntaxGoal(" main( ) ", (x) => { console.dir(ctx.all_query(x).map((s) => { return s.toString(); }), { depth: null }); });
console.log('end');
//# sourceMappingURL=mcompiler.js.map