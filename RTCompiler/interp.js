"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const atoms_1 = require("./atoms");
const util_1 = require("util");
var Interp;
(function (Interp) {
    class PredicateEntry {
        constructor(entry, value) {
            this.entry = entry;
            this.value = value;
        }
    }
    // a clause foi provada .. foi disprovada
    // ou nao da para responder
    let SolutionState;
    (function (SolutionState) {
        SolutionState[SolutionState["QTrue"] = 0] = "QTrue";
        SolutionState[SolutionState["QFalse"] = 1] = "QFalse";
        SolutionState[SolutionState["QFail"] = 2] = "QFail";
        SolutionState[SolutionState["QUndefined"] = 3] = "QUndefined";
    })(SolutionState = Interp.SolutionState || (Interp.SolutionState = {}));
    function atom_false() { return new atoms_1.GTems.LiteralBool(false); }
    function atom_true() { return new atoms_1.GTems.LiteralBool(true); }
    class Solution {
        constructor(state, value, var_values) {
            this.state = SolutionState.QUndefined;
            this.var_values = {};
            this.value = undefined;
            this.state = state;
            this.var_values = var_values;
            this.value = value;
        }
        add(var_name, value) {
            let nsol = new Solution(this.state, this.value, {});
            for (var i in this.var_values) {
                nsol.var_values[i] = this.var_values[i];
            }
            nsol.var_values[var_name] = value;
            return nsol;
        }
        add_value(value) {
            let nsol = new Solution(this.state, value, {});
            for (var i in this.var_values) {
                nsol.var_values[i] = this.var_values[i];
            }
            return nsol;
        }
    }
    Interp.Solution = Solution;
    //mantem o segundo termo como valor
    function fuseSolution(a, b) {
        if (a.state == SolutionState.QFalse)
            return a;
        if (b.state == SolutionState.QFalse)
            return b;
        let s = new Solution(b.state, b.value, []);
        for (var i in a.var_values) {
            s.var_values[i] = a.var_values[i];
        }
        for (var i in b.var_values) {
            s.var_values[i] = b.var_values[i];
        }
        return s;
    }
    class SolutionGroup {
        constructor() {
            this.solution = [];
        }
    }
    function isEqually(x, y) {
        let s1 = x.toString();
        let s2 = y.toString();
        if (s1 == s2)
            return true;
        return false;
    }
    function isEquallyNumber(x, y) {
        if (x.value == y.value)
            return true;
        return false;
    }
    //retorna o valor da variavel em questao .. retorna ATOM ou undefined
    function getBindValue(sol, x) {
        let v = getBindTail(sol, x);
        return getBindVarValue(sol, v);
    }
    function getValue(sol, x) {
        if (x instanceof atoms_1.GTems.Variable) {
            {
                let v = getBindTail(sol, x);
                return getBindVarValue(sol, v);
            }
        }
        return x;
    }
    function getBindVarValue(sol, x) {
        for (var i in sol.var_values) {
            if (i == x.name) {
                let value_bind = sol.var_values[i];
                if (value_bind instanceof atoms_1.GTems.Variable) {
                    return undefined;
                }
                else {
                    return value_bind;
                }
            }
        }
        return undefined;
    }
    function getBindTail(sol, x, deep = 0) {
        if (deep > 300)
            return x;
        for (var i in sol.var_values) {
            if (i == x.name) {
                let value_bind = sol.var_values[i];
                if (value_bind instanceof atoms_1.GTems.Variable) {
                    if (value_bind.name == x.name)
                        return x; // fundo do poco .. eu mesmo
                    return getBindTail(sol, value_bind, deep + 1);
                }
                else {
                    return x; //esta anexado ao bind de uma variable
                }
            }
        }
        return x; //nao tem bind
    }
    function bindVar(sol, x, y) {
        if (y instanceof atoms_1.GTems.Variable) {
            return bindVarVar(sol, x, y);
        }
        // bind da variavel e retorna nova solucao derivada 
        let xx = getBindTail(sol, x);
        let value_binded = getBindVarValue(sol, xx);
        if (util_1.isUndefined(value_binded)) {
            let vname = xx.name;
            return sol.add(vname, y);
        }
        if (isEqually(value_binded, y)) {
            return sol;
        }
        return new Solution(SolutionState.QFalse, atom_false(), {});
    }
    function bindVarVar(sol, x, y) {
        let xx = getBindTail(sol, x);
        let yy = getBindTail(sol, y);
        let x_value = getBindVarValue(sol, xx);
        let y_value = getBindVarValue(sol, yy);
        if (util_1.isUndefined(x_value)) {
            return sol.add(xx.name, y);
        }
        if (util_1.isUndefined(y_value)) {
            return sol.add(yy.name, x);
        }
        //nenhum dos ois eh indefinido 
        if (isEqually(x_value, y_value)) {
            return sol;
        }
        return new Solution(SolutionState.QFalse, atom_false(), {});
    }
    function bind(sol, x, y) {
        if (sol.state == SolutionState.QFalse)
            return sol; //nem tenta
        if (util_1.isArray(y))
            return bind(sol, x, y[0]);
        if (util_1.isArray(x))
            return bind(sol, x[0], y);
        if (x instanceof atoms_1.GTems.LiteralNumber) {
            if (y instanceof atoms_1.GTems.LiteralNumber) {
                if (isEquallyNumber(x, y))
                    return sol;
                else
                    return new Solution(SolutionState.QFalse, atom_false(), {});
            }
        }
        if (x instanceof atoms_1.GTems.LiteralBool) {
            if (y instanceof atoms_1.GTems.LiteralBool) {
                if (x.value == y.value)
                    return sol;
                else
                    return new Solution(SolutionState.QFalse, atom_false(), {});
            }
        }
        if (x instanceof atoms_1.GTems.GValue) {
            if (y instanceof atoms_1.GTems.Variable) {
                return bindVar(sol, y, x);
            }
        }
        if (x instanceof atoms_1.GTems.Variable) {
            if (y instanceof atoms_1.GTems.GValue) {
                return bindVar(sol, x, y);
            }
        }
        if (x instanceof atoms_1.GTems.Atom) {
            if (y instanceof atoms_1.GTems.Atom) {
                if (isEqually(x, y))
                    return sol;
                else
                    return new Solution(SolutionState.QFalse, atom_false(), {});
            }
            if (y instanceof atoms_1.GTems.Variable) {
                return bindVar(sol, y, x);
            }
        }
        if (x instanceof atoms_1.GTems.Variable) {
            if (y instanceof atoms_1.GTems.Atom) {
                return bindVar(sol, x, y);
            }
            if (y instanceof atoms_1.GTems.Variable) {
                return bindVarVar(sol, y, x);
            }
        }
        return new Solution(SolutionState.QFalse, atom_false(), {});
    }
    Interp.bind = bind;
    class Context {
        constructor() {
            //predicades: GTems.Functor[] = []
            this.values = [];
            this.predicades = [];
        }
        addPredicateFunc(p, code, condition) {
            this.predicades.push(new PredicateEntry(p, code));
            //console.dir(code, { depth: null })
            return true;
        }
        isVar(v) {
            if (v instanceof atoms_1.GTems.Variable) {
                return true;
            }
            return false;
        }
        addPredicateAtom(v) {
            this.values.push(v);
        }
        *query_and(sol, q1, q2) {
            for (var qq of this.evaluate_query(sol, q1)) {
                if (qq.state == SolutionState.QTrue) {
                    let v = qq.value;
                    if (v instanceof atoms_1.GTems.LiteralBool) {
                        if (v.value == false) {
                            yield new Solution(SolutionState.QFalse, atom_false(), {});
                            continue; //nem tenta o segundo termo
                        }
                    }
                    for (var qz of this.evaluate_query(sol, q2)) {
                        if (qz.state == SolutionState.QTrue) {
                            yield fuseSolution(qq, qz);
                        }
                    }
                }
            }
        }
        all_query(q) {
            let sol = new Solution(SolutionState.QTrue, atom_true(), {});
            let r = [];
            for (var qz of this.query(sol, q)) {
                if (qz.state == SolutionState.QTrue) {
                    r.push(qz);
                }
            }
            // console.log("solutions:")
            // console.dir( r, { depth: null })
            return r;
        }
        *query(sol, q) {
            // console.log("...")
            // console.dir(q, { depth: null })
            if (q instanceof atoms_1.GTems.Functor) {
                if (q.name == "and") {
                    for (var qq of this.query_and(sol, q.args[0], q.args[1]))
                        yield qq;
                    return;
                }
                if (q.args.length == 1) {
                    for (var qx of this.query_ar1(sol, q.name, q.args[0])) {
                        yield qx;
                    }
                    return;
                }
                if (q.args.length == 2) {
                    for (var qy of this.query_ar2(sol, q.name, q.args[0], q.args[1]))
                        yield qy;
                    return;
                }
            }
            if (q instanceof atoms_1.GTems.LiteralBool) {
                if (q.value == false)
                    yield new Solution(SolutionState.QFalse, q, {});
                if (q.value == true)
                    yield new Solution(SolutionState.QTrue, q, {});
                return;
            }
            if (q instanceof atoms_1.GTems.Atom) {
                if (q.name == "true") {
                    yield new Solution(SolutionState.QTrue, q, {});
                    return;
                }
                if (q.name == "false") {
                    yield new Solution(SolutionState.QFalse, q, {});
                    return;
                }
                if (q.name == "fail") {
                    yield new Solution(SolutionState.QFail, q, {});
                    return;
                }
                yield new Solution(SolutionState.QTrue, q, {}); //fail
            }
            if (q instanceof atoms_1.GTems.Variable) {
                if (this.isVar(q)) {
                    let qval = getValue(sol, q);
                    if (util_1.isUndefined(qval)) {
                        yield new Solution(SolutionState.QFalse, qval, {}); //fail                        
                    }
                    else {
                        yield new Solution(SolutionState.QTrue, qval, {});
                    }
                    return;
                }
            }
            if (q instanceof atoms_1.GTems.LiteralNumber) {
                yield new Solution(SolutionState.QTrue, q, {});
                return;
            }
            console.log("undefined term :", q);
            //throw new Error('Unassigned Term Evaluator');
        }
        *evaluate_query(sol, code) {
            if (code instanceof atoms_1.GTems.Variable) {
                let code_value = getValue(sol, code);
                if (util_1.isUndefined(code_value)) {
                    yield new Solution(SolutionState.QFalse, undefined, {});
                    return;
                }
            }
            if (code instanceof atoms_1.GTems.LiteralNumber) {
                yield new Solution(SolutionState.QTrue, code, {});
                return;
            }
            if (code instanceof atoms_1.GTems.LiteralBool) {
                yield new Solution(SolutionState.QTrue, code, {});
                return;
            }
            for (var qin of this.query(sol, code)) {
                let fsol = fuseSolution(sol, qin);
                if (fsol.state == SolutionState.QTrue) {
                    yield fsol;
                }
            }
        }
        //buildIn Predicates
        buildIn_add(sol, arg1, arg2) {
            //arg1 nao rh uma variavel ..bind o argumento para o valor dela ..senao,bind na saida
            let sol_next = new Solution(SolutionState.QTrue, atom_true(), {});
            if (this.isVar(arg1))
                new Solution(SolutionState.QFalse, atom_false(), {});
            if (this.isVar(arg2))
                new Solution(SolutionState.QFalse, atom_false(), {});
            for (var v1 of this.evaluate_query(sol, arg1)) {
                for (var v2 of this.evaluate_query(sol, arg2)) {
                    if (v1.value instanceof atoms_1.GTems.LiteralNumber) {
                        if (v2.value instanceof atoms_1.GTems.LiteralNumber) {
                            let r = new atoms_1.GTems.LiteralNumber(v1.value.value + v2.value.value);
                            return new Solution(SolutionState.QTrue, r, {});
                        }
                    }
                }
            }
            return new Solution(SolutionState.QFalse, atom_false(), {});
        }
        buildIn_minus(sol, arg1, arg2) {
            //arg1 nao rh uma variavel ..bind o argumento para o valor dela ..senao,bind na saida
            let sol_next = new Solution(SolutionState.QTrue, atom_true(), {});
            if (this.isVar(arg1))
                new Solution(SolutionState.QFalse, atom_false(), {});
            if (this.isVar(arg2))
                new Solution(SolutionState.QFalse, atom_false(), {});
            for (var v1 of this.evaluate_query(sol, arg1)) {
                for (var v2 of this.evaluate_query(sol, arg2)) {
                    if (v1.value instanceof atoms_1.GTems.LiteralNumber) {
                        if (v2.value instanceof atoms_1.GTems.LiteralNumber) {
                            let r = new atoms_1.GTems.LiteralNumber(v1.value.value - v2.value.value);
                            return new Solution(SolutionState.QTrue, r, {});
                        }
                    }
                }
            }
            return new Solution(SolutionState.QFalse, atom_false(), {});
        }
        buildIn_gt(sol, arg1, arg2) {
            //arg1 nao rh uma variavel ..bind o argumento para o valor dela ..senao,bind na saida
            let sol_next = new Solution(SolutionState.QTrue, atom_true(), {});
            if (this.isVar(arg1))
                new Solution(SolutionState.QFalse, atom_false(), {});
            if (this.isVar(arg2))
                new Solution(SolutionState.QFalse, atom_false(), {});
            for (var v1 of this.evaluate_query(sol, arg1)) {
                for (var v2 of this.evaluate_query(sol, arg2)) {
                    if (v1.value instanceof atoms_1.GTems.LiteralNumber) {
                        if (v2.value instanceof atoms_1.GTems.LiteralNumber) {
                            if (v1.value.value > v2.value.value) {
                                return new Solution(SolutionState.QTrue, true, {});
                            }
                            else {
                                return new Solution(SolutionState.QFalse, false, {});
                            }
                        }
                    }
                }
            }
            return new Solution(SolutionState.QFalse, atom_false(), {});
        }
        buildIn_lt(sol, arg1, arg2) {
            //arg1 nao rh uma variavel ..bind o argumento para o valor dela ..senao,bind na saida
            let sol_next = new Solution(SolutionState.QTrue, atom_true(), {});
            if (this.isVar(arg1))
                new Solution(SolutionState.QFalse, atom_false(), {});
            if (this.isVar(arg2))
                new Solution(SolutionState.QFalse, atom_false(), {});
            for (var v1 of this.evaluate_query(sol, arg1)) {
                for (var v2 of this.evaluate_query(sol, arg2)) {
                    if (v1.value instanceof atoms_1.GTems.LiteralNumber) {
                        if (v2.value instanceof atoms_1.GTems.LiteralNumber) {
                            if (v1.value.value < v2.value.value) {
                                return new Solution(SolutionState.QTrue, true, {});
                            }
                            else {
                                return new Solution(SolutionState.QFalse, false, {});
                            }
                        }
                    }
                }
            }
            return new Solution(SolutionState.QFalse, atom_false(), {});
        }
        buildIn_mul(sol, arg1, arg2) {
            //arg1 nao rh uma variavel ..bind o argumento para o valor dela ..senao,bind na saida
            let sol_next = new Solution(SolutionState.QTrue, atom_true(), {});
            if (this.isVar(arg1))
                new Solution(SolutionState.QFalse, atom_false(), {});
            if (this.isVar(arg2))
                new Solution(SolutionState.QFalse, atom_false(), {});
            for (var v1 of this.evaluate_query(sol, arg1)) {
                for (var v2 of this.evaluate_query(sol, arg2)) {
                    if (v1.value instanceof atoms_1.GTems.LiteralNumber) {
                        if (v2.value instanceof atoms_1.GTems.LiteralNumber) {
                            let vv = (v1.value.value * v2.value.value);
                            return new Solution(SolutionState.QTrue, new atoms_1.GTems.LiteralNumber(vv), {});
                        }
                    }
                }
            }
            return new Solution(SolutionState.QFalse, atom_false(), {});
        }
        //general call
        *query_ar2(sol, f_name, _arg1, _arg2) {
            if (util_1.isArray(_arg1))
                _arg1 = _arg1[0];
            if (util_1.isArray(_arg2))
                _arg2 = _arg2[0];
            let arg1 = _arg1;
            let arg2 = _arg2;
            //if (isUndefined(arg1)) arg1 = _arg1
            //if (isUndefined(arg2)) arg2 = _arg2
            let value_1 = Array.from(this.evaluate_query(sol, _arg1)).filter((x) => x.state == SolutionState.QTrue).map((c) => c.value);
            if (value_1.length > 0)
                arg1 = value_1[0];
            else
                arg1 = atom_false();
            let value_2 = Array.from(this.evaluate_query(sol, _arg2)).filter((x) => x.state == SolutionState.QTrue).map((c) => c.value);
            if (value_2.length > 0)
                arg2 = value_2[0];
            else
                arg2 = atom_false();
            if (f_name == "and") {
                yield this.query_and(sol, arg1, arg2);
                return;
            }
            if (f_name == "plus") {
                yield this.buildIn_add(sol, arg1, arg2);
                return;
            }
            if (f_name == "minus") {
                yield this.buildIn_minus(sol, arg1, arg2);
                return;
            }
            if (f_name == ">") {
                yield this.buildIn_gt(sol, arg1, arg2);
                return;
            }
            if (f_name == "<") {
                yield this.buildIn_lt(sol, arg1, arg2);
                return;
            }
            if (f_name == "*") {
                yield this.buildIn_mul(sol, arg1, arg2);
                return;
            }
            for (var [i, p] of this.predicades.entries()) {
                if (p.entry.name != f_name)
                    continue;
                let pp = p.entry;
                if (pp instanceof atoms_1.GTems.Functor) {
                    if (pp.args.length != 2)
                        continue;
                    let pa0 = pp.args[0];
                    if (util_1.isArray(pa0))
                        pa0 = pa0[0];
                    let pa1 = pp.args[1];
                    if (util_1.isArray(pa1))
                        pa1 = pa1[0];
                    //arg1 nao rh uma variavel ..bind o argumento para o valor dela ..senao,bind na saida
                    let sol_next = new Solution(SolutionState.QTrue, atom_true(), {});
                    if (this.isVar(arg1) == false) {
                        sol_next = bind(sol_next, pa0, arg1);
                    }
                    if (this.isVar(arg2) == false) {
                        sol_next = bind(sol_next, pa1, arg2);
                    }
                    if (sol_next.state != SolutionState.QTrue)
                        continue;
                    for (var sol_next_inner of this.evaluate_query(sol_next, p.value)) {
                        if (sol_next_inner.state != SolutionState.QTrue)
                            continue;
                        let sol_n = new Solution(SolutionState.QTrue, atom_true(), {});
                        sol_n = fuseSolution(sol, sol_n); //just a copy 
                        if (this.isVar(arg1)) //arg1 eh uma variavel ? bind para o resultado 
                         {
                            let v_ret = getValue(sol_next_inner, pa0);
                            if (util_1.isUndefined(v_ret) == false)
                                sol_n = bind(sol_n, v_ret, arg1);
                        }
                        if (sol_n.state != SolutionState.QTrue)
                            continue;
                        if (this.isVar(arg2)) //arg1 eh uma variavel ? bind para o resultado 
                         {
                            let v_ret = getValue(sol_next_inner, pa1);
                            if (util_1.isUndefined(v_ret) == false)
                                sol_n = bind(sol_n, v_ret, arg2);
                        }
                        if (sol_n.state != SolutionState.QTrue)
                            continue;
                        yield sol_n.add_value(sol_next_inner.value);
                    }
                }
            }
        }
        *query_ar1(sol, f_name, _arg1) {
            if (util_1.isArray(_arg1))
                _arg1 = _arg1[0];
            let arg1 = _arg1;
            let value_1 = Array.from(this.evaluate_query(sol, _arg1)).filter((x) => x.state == SolutionState.QTrue).map((c) => c.value);
            if (value_1.length > 0)
                arg1 = value_1[0];
            else
                arg1 = atom_false();
            //let arg1 = getValue(sol, _arg1)
            //if (isUndefined(arg1)) arg1 = _arg1
            for (var [i, p] of this.predicades.entries()) {
                if (p.entry.name != f_name)
                    continue;
                let pp = p.entry;
                if (pp instanceof atoms_1.GTems.Functor) {
                    if (pp.args.length != 1)
                        continue;
                    let pa0 = pp.args[0];
                    if (util_1.isArray(pa0))
                        pa0 = pa0[0];
                    //arg1 nao rh uma variavel ..bind o argumento para o valor dela ..senao,bind na saida
                    let sol_next = new Solution(SolutionState.QTrue, atom_true(), {});
                    if (this.isVar(arg1) == false) {
                        sol_next = bind(sol_next, pa0, arg1);
                    }
                    if (sol_next.state != SolutionState.QTrue)
                        continue;
                    for (var sol_next_inner of this.evaluate_query(sol_next, p.value)) {
                        if (sol_next_inner.state != SolutionState.QTrue)
                            continue;
                        if (this.isVar(arg1) || util_1.isUndefined(arg1)) //arg1 eh uma variavel ? bind para o resultado 
                         {
                            let v_ret = getValue(sol_next_inner, pa0);
                            if (util_1.isUndefined(v_ret) == false) {
                                let sol_n = bind(sol, v_ret, arg1);
                                if (sol_n.state == SolutionState.QTrue) {
                                    sol_n.value = sol_next_inner.value;
                                    yield sol_n;
                                }
                            }
                            else {
                                //valor do argumento continua sem binding .... mas a saida eh valida
                                yield sol.add_value(sol_next_inner.value);
                            }
                        }
                        else {
                            yield sol.add_value(sol_next_inner.value);
                        }
                    }
                }
            }
            //yield new Solution(SolutionState.QFalse, atom_false(), {})
        }
    } //class
    Interp.Context = Context;
})(Interp = exports.Interp || (exports.Interp = {})); //namespace
//# sourceMappingURL=interp.js.map