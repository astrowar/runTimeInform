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
        SolutionState[SolutionState["QUndefined"] = 2] = "QUndefined";
    })(SolutionState = Interp.SolutionState || (Interp.SolutionState = {}));
    class Solution {
        constructor(state, var_values) {
            this.state = SolutionState.QUndefined;
            this.var_values = {};
            this.state = state;
            this.var_values = var_values;
        }
        add(var_name, value) {
            let nsol = new Solution(this.state, {});
            for (var i in this.var_values) {
                nsol.var_values[i] = this.var_values[i];
            }
            nsol.var_values[var_name] = value;
            return nsol;
        }
    }
    Interp.Solution = Solution;
    function fuseSolution(a, b) {
        if (a.state == SolutionState.QFalse)
            return a;
        if (b.state == SolutionState.QFalse)
            return b;
        let s = new Solution(a.state, []);
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
        return new Solution(SolutionState.QFalse, {});
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
        return new Solution(SolutionState.QFalse, {});
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
                    return new Solution(SolutionState.QFalse, {});
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
                    return new Solution(SolutionState.QFalse, {});
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
        return new Solution(SolutionState.QFalse, {});
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
            for (var qq of this.query(sol, q1)) {
                if (qq.state == SolutionState.QTrue) {
                    for (var qz of this.query(sol, q2)) {
                        if (qz.state == SolutionState.QTrue) {
                            yield fuseSolution(qq, qz);
                        }
                    }
                }
            }
        }
        all_query(q) {
            let sol = new Solution(SolutionState.QTrue, {});
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
                    for (var qx of this.query_ar1(sol, q.name, q.args[0]))
                        yield qx;
                }
                if (q.args.length == 2) {
                    for (var qy of this.query_ar2(sol, q.name, q.args[0], q.args[1]))
                        yield qy;
                }
            }
            if (q instanceof atoms_1.GTems.Atom) {
                if (q.name == "true")
                    yield new Solution(SolutionState.QTrue, {});
                if (q.name == "false")
                    yield new Solution(SolutionState.QFalse, {});
                if (q.name == "fail")
                    yield new Solution(SolutionState.QFalse, {});
                yield new Solution(SolutionState.QFalse, {}); //fail
            }
        }
        *evaluate_query(sol, code) {
            for (var qin of this.query(sol, code)) {
                let fsol = fuseSolution(sol, qin);
                if (fsol.state == SolutionState.QTrue) {
                    yield fsol;
                }
            }
        }
        *query_ar2(sol, f_name, _arg1, _arg2) {
            if (util_1.isArray(_arg1))
                _arg1 = _arg1[0];
            if (util_1.isArray(_arg2))
                _arg2 = _arg2[0];
            let arg1 = getValue(sol, _arg1);
            let arg2 = getValue(sol, _arg2);
            if (util_1.isUndefined(arg1))
                arg1 = _arg1;
            if (util_1.isUndefined(arg2))
                arg2 = _arg2;
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
                    let sol_next = new Solution(SolutionState.QTrue, {});
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
                        let sol_n = new Solution(SolutionState.QTrue, {});
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
                        yield sol_n;
                    }
                }
            }
        }
        *query_ar1(sol, f_name, _arg1) {
            if (util_1.isArray(_arg1))
                _arg1 = _arg1[0];
            let arg1 = getValue(sol, _arg1);
            if (util_1.isUndefined(arg1))
                arg1 = _arg1;
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
                    let sol_next = new Solution(SolutionState.QTrue, {});
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
                                    yield sol_n;
                                }
                            }
                            else {
                                //valor do argumento continua sem binding .... mas a saida eh valida
                                yield sol;
                            }
                        }
                        else {
                            yield sol;
                        }
                    }
                }
            }
        }
    } //class
    Interp.Context = Context;
})(Interp = exports.Interp || (exports.Interp = {})); //namespace
//# sourceMappingURL=interp.js.map