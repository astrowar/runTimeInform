"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("util");
/// <reference path="./mterms.ts" />
//import * as mterms from "./mterms";
const mterms_1 = require("./mterms");
const atoms_1 = require("./atoms");
const interp_1 = require("./interp");
const parse_1 = require("./parse");
var parseString = mterms_1.UTerm.parseString;
var splitStringInput = mterms_1.UTerm.splitStringInput;
var SyntaxParser;
(function (SyntaxParser) {
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
    function isValidAtomNameStr(pstr) {
        if (pstr.length < 1)
            return false;
        for (var c of pstr) {
            if (";.,()[]|&+-*/".indexOf(c) >= 0) {
                return false;
            }
        }
        if (pstr[0] == "$")
            return false;
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
    function* var_z(args_dict) {
        let pname = args_dict["$variable"];
        if (pname.length == 1)
            if (pname[0].txt[0] === "$")
                yield new atoms_1.GTems.Variable(pname[0].txt.substr(1));
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
            new parse_1.MParse.Matchfunctior("$funct1 ( $args1 ) , $funct2 ( $args2 )", funct_and),
            new parse_1.MParse.Matchfunctior("$funct1 ( $args1 ) , $rem", funct_rem),
            new parse_1.MParse.Matchfunctior("$funct1 ( $args1 ) | $rem", funct_rem_or),
            //new MParse.Matchfunctior("$funct ( $A , $B )", funct_2),
            new parse_1.MParse.Matchfunctior("$funct ( $A )", funct_1),
            new parse_1.MParse.Matchfunctior("$funct (  )", funct_0),
            new parse_1.MParse.Matchfunctior(" ( $A , $funct , $B )", funct_2),
            new parse_1.MParse.Matchfunctior("$funct", funct_z)
        ];
        for (var vj of parse_1.MParse.genPattens_i(args, basePathens)) {
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
    function* predDeclSet(args) {
        let basePathens = [
            new parse_1.MParse.Matchfunctior("$funct ( $A )", funct_1),
            new parse_1.MParse.Matchfunctior(" ( $A , $funct , $B )", funct_2)
        ];
        for (var vj of parse_1.MParse.genPattens_i(args, basePathens)) {
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
    function* predDecl0(args) {
        let basePathens = [
            new parse_1.MParse.Matchfunctior("$funct", funct_z)
        ];
        for (var vj of parse_1.MParse.genPattens_i(args, basePathens)) {
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
    function* varDecl0(args) {
        let basePathens = [
            new parse_1.MParse.Matchfunctior("$variable", var_z)
        ];
        for (var vj of parse_1.MParse.genPattens_i(args, basePathens)) {
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
    function* pmatch_or(args_dict) {
        let pname1 = args_dict["$term"];
        if (pname1.length != 1)
            return undefined;
        let p1 = pname1[0];
        if (util_1.isUndefined(p1))
            return undefined;
        for (var pnext of understandDecl(args_dict["$rem"])) {
            if (util_1.isUndefined(pnext))
                continue;
            yield new atoms_1.GTems.Functor("or", p1.gettext(), pnext);
        }
        return;
    }
    function* pmatch_item(args_dict) {
        let pname1 = args_dict["$term"];
        if (pname1.length != 1)
            return undefined;
        let p1 = pname1[0];
        if (util_1.isUndefined(p1))
            return undefined;
        yield new atoms_1.GTems.LiteralStr(p1.gettext());
        return;
    }
    function* understandDecl(args) {
        let basePathens = [
            new parse_1.MParse.Matchfunctior("$term ; $rem", pmatch_or),
            new parse_1.MParse.Matchfunctior("$term ", pmatch_item),
        ];
        for (var vj of parse_1.MParse.genPattens_i(args, basePathens)) {
            let pool = [];
            for (var vv of vj[1](vj[0])) {
                if (util_1.isUndefined(vv) == false) {
                    pool.push(vv);
                }
                else {
                    pool = [];
                    break;
                }
            }
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
    function* expr_if_else(args_dict) {
        let x = args_dict["$X"];
        let y = args_dict["$Y"];
        let z = args_dict["$Z"];
        for (var cx of codebodyMatch(x)) {
            if (util_1.isUndefined(cx))
                continue;
            for (var cy of codebodyMatch(y)) {
                if (util_1.isUndefined(cy))
                    continue;
                for (var cz of codebodyMatch(z)) {
                    if (util_1.isUndefined(cz))
                        continue;
                    yield new atoms_1.GTems.Functor("if_else", cx, cy, cz);
                }
            }
        }
    }
    function* expr_not(args_dict) {
        let x = args_dict["$X"];
        for (var cx of codebodyMatch(x)) {
            if (util_1.isUndefined(cx))
                continue;
            yield new atoms_1.GTems.Functor("not", cx);
        }
    }
    function* expr_set(args_dict) {
        for (var px of predDeclSet(args_dict["$X"])) {
            if (util_1.isUndefined(px))
                continue;
            yield new atoms_1.GTems.Functor("set", px);
        }
    }
    function* expr_reset(args_dict) {
        for (var px of predDeclSet(args_dict["$X"])) {
            if (util_1.isUndefined(px))
                continue;
            yield new atoms_1.GTems.Functor("reset", px);
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
    function* expr_ASIGN(args_dict) {
        for (var x of expr_xy_operator("assign", args_dict))
            yield x;
    }
    function* expr_NEQUAL(args_dict) {
        for (var x of expr_xy_operator("not_equal", args_dict))
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
            yield (x[0].getGeneralTerm());
            return;
            let n = Number(x[0].txt);
            if (isNaN(n) == false) {
                yield new atoms_1.GTems.LiteralNumber(n);
                return;
            }
        }
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
        if (x.length == 1) {
            yield x[0].getGeneralTerm();
        }
        else {
            let all_str = [];
            for (var [i, xx] of x.entries()) {
                all_str.push(xx.gettext());
            }
            let atm_name = all_str.join(" ");
            if (isValidAtomNameStr(atm_name)) {
                yield new atoms_1.GTems.Atom(atm_name);
            }
        }
    }
    function* codebodyMatch(args) {
        let basePathens = [
            new parse_1.MParse.Matchfunctior("{ $X }", expr_inner),
            new parse_1.MParse.Matchfunctior("true", (x) => { return expr_atorm_reserv("true"); }),
            new parse_1.MParse.Matchfunctior("false", (x) => { return expr_atorm_reserv("false"); }),
            new parse_1.MParse.Matchfunctior("fail", (x) => { return expr_atorm_reserv("fail"); }),
            new parse_1.MParse.Matchfunctior("done", (x) => { return expr_atorm_reserv("done"); }),
            new parse_1.MParse.Matchfunctior("!", (x) => { return expr_atorm_reserv("cut"); }),
            new parse_1.MParse.Matchfunctior("$X , $Y", expr_and),
            new parse_1.MParse.Matchfunctior("$X ; $Y", expr_or),
            new parse_1.MParse.Matchfunctior("$X = = $Y", expr_EQUAL),
            new parse_1.MParse.Matchfunctior("$X : = $Y", expr_ASIGN),
            new parse_1.MParse.Matchfunctior("$X ! = $Y", expr_NEQUAL),
            new parse_1.MParse.Matchfunctior("$X = $Y", expr_UNIFY),
            new parse_1.MParse.Matchfunctior("$X + $Y", expr_plus),
            new parse_1.MParse.Matchfunctior("$X - $Y", expr_minus),
            new parse_1.MParse.Matchfunctior("$X > $Y", expr_GT),
            new parse_1.MParse.Matchfunctior("$X < $Y", expr_LT),
            new parse_1.MParse.Matchfunctior("$X > = $Y", expr_GTE),
            new parse_1.MParse.Matchfunctior("$X < = $Y", expr_LTE),
            new parse_1.MParse.Matchfunctior("$X * $Y", expr_MUL),
            new parse_1.MParse.Matchfunctior("$X / $Y", expr_DIV),
            new parse_1.MParse.Matchfunctior("$X % $Y", expr_MOD),
            new parse_1.MParse.Matchfunctior("if ( $X  ) $Y else $Z", expr_if_else),
            new parse_1.MParse.Matchfunctior("not ( $X  )", expr_not),
            new parse_1.MParse.Matchfunctior("set ( $X  )", expr_set),
            new parse_1.MParse.Matchfunctior("reset ( $X  )", expr_reset),
            new parse_1.MParse.Matchfunctior("$funct (   )", expr_funct_0),
            new parse_1.MParse.Matchfunctior("$funct ( $args )", expr_funct),
            new parse_1.MParse.Matchfunctior("( $a1 , $funct , $a2  )", expr_funct_m),
            new parse_1.MParse.Matchfunctior("[ $X ]", expr_lst),
            new parse_1.MParse.Matchfunctior("[ ]", expr_lst),
            new parse_1.MParse.Matchfunctior("$X ", expr_literal)
        ];
        for (var vj of parse_1.MParse.genPattens_i(args, basePathens)) {
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
    function const_xy(args_dict, reFunc) {
        let x = args_dict["$X"];
        let y = args_dict["$Y"];
        for (var px of predDecl0(x)) {
            for (var cy of codeBody(y)) {
                reFunc(px, cy, undefined, ["const"]);
                return true;
            }
        }
        return false;
    }
    function var_xy(args_dict, reFunc) {
        let x = args_dict["$X"];
        let y = args_dict["$Y"];
        for (var px of varDecl0(x)) {
            for (var cy of codeBody(y)) {
                reFunc(px, cy, undefined, ["var"]);
                return true;
            }
        }
        return false;
    }
    function let_xy(args_dict, reFunc) {
        return syntax_xy(args_dict, (p, body, cond, poptions) => { p.name = p.name; reFunc(p, body, cond, poptions.concat(["let"])); });
    }
    function understand_xy(args_dict, reFunc) {
        let x = args_dict["$X"];
        let y = args_dict["$Y"];
        for (var px of understandDecl(x)) {
            for (var cy of codeBody(y)) {
                reFunc(px, cy, undefined, ["understand"]);
                return true;
            }
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
        let comment = false;
        for (var i = 0; i < n; ++i) {
            if (xcode[i] == "/" && i < n - 1)
                if (xcode[i + 1] == "/") {
                    // pula para o fim da linha  
                    while (xcode[i] !== "\n" && i < n)
                        i++;
                    continue;
                }
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
            // new MParse.Matchfunctior("do $X = > $Y if $Z", syntax_xyz_direct),
            new parse_1.MParse.Matchfunctior("do $X = > $Y ", syntax_xy_direct),
            // new MParse.Matchfunctior("do -  $X as $Y if $Z", syntax_xyz_low),
            new parse_1.MParse.Matchfunctior("do -  $X as $Y ", syntax_xy_low),
            new parse_1.MParse.Matchfunctior("do -  $X  ", syntax_x_low),
            // new MParse.Matchfunctior("do +  $X as $Y if $Z", syntax_xyz_high),
            new parse_1.MParse.Matchfunctior("do +  $X as $Y ", syntax_xy_high),
            new parse_1.MParse.Matchfunctior("do +  $X  ", syntax_x_high),
            //  new MParse.Matchfunctior("do  $X as $Y if $Z", syntax_xyz),
            new parse_1.MParse.Matchfunctior("do  $X as $Y ", syntax_xy),
            new parse_1.MParse.Matchfunctior("do  $X  ", syntax_x),
            // new MParse.Matchfunctior("do  $X as $Y if $Z", syntax_xyz),
            new parse_1.MParse.Matchfunctior("do  $X as $Y ", syntax_xy),
            new parse_1.MParse.Matchfunctior("do  $X  ", syntax_x),
            //  new MParse.Matchfunctior("unless  $X as $Y if $Z", unless_xyz),
            new parse_1.MParse.Matchfunctior("unless  $X as $Y ", unless_xy),
            new parse_1.MParse.Matchfunctior("unless  $X  ", unless_x),
            new parse_1.MParse.Matchfunctior("do  $X  ?.", syntax_x),
            new parse_1.MParse.Matchfunctior("let  $X as $Y ", let_xy),
            new parse_1.MParse.Matchfunctior("understand   $X as $Y ", understand_xy),
            //   new MParse.Matchfunctior("before  $X as  $Y if $Z", before_xyz),
            new parse_1.MParse.Matchfunctior("before  $X as  $Y ", before_xy),
            new parse_1.MParse.Matchfunctior("before  $X ", before_x),
            new parse_1.MParse.Matchfunctior("const  $X as  $Y ", const_xy),
            new parse_1.MParse.Matchfunctior("var   $X as  $Y ", var_xy)
        ];
        let xlines = linesSplit(xcode);
        for (var [i, iline] of xlines.entries()) {
            if (isEmptyLine(iline.line))
                continue;
            let sline = splitStringInput(iline.line);
            let has_code = false;
            for (var vj of parse_1.MParse.genPattens_i(sline, basePathens)) {
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
ctx.init();
SyntaxParser.MatchSyntaxGoal(" main( ) ", (x) => { console.dir(ctx.all_query(x).map((s) => { return s.toString(); }), { depth: null }); });
console.log('end');
//# sourceMappingURL=mcompiler.js.map