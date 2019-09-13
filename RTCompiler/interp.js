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
    function getBindValue(sol, x) {
        let v = getBindTail(sol, x);
        return getBindVarValue(sol, v);
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
        addPredicateFunc(p, code) {
            this.predicades.push(new PredicateEntry(p, code));
        }
        addPredicateAtom(v) {
            this.values.push(v);
        }
        query(functor) {
        }
        *query_ar2(f_name, arg1, arg2) {
            for (var [i, p] of this.predicades.entries()) {
                if (p.entry.name == f_name) {
                    let pp = p.entry;
                    if (pp instanceof atoms_1.GTems.Functor) {
                        if (pp.args.length == 2) {
                            let pa0 = pp.args[0];
                            let pa1 = pp.args[1];
                            if (util_1.isArray(pa0))
                                pa0 = pa0[0];
                            if (util_1.isArray(pa1))
                                pa1 = pa1[0];
                            let sol_next = bind(new Solution(SolutionState.QTrue, {}), pa0, arg1);
                            sol_next = bind(sol_next, pa1, arg2);
                            if (sol_next.state == SolutionState.QTrue) {
                                yield sol_next;
                            }
                        }
                    }
                }
            }
        }
        *query_ar1(f_name, arg1) {
            console.log(">>");
            for (var [i, p] of this.predicades.entries()) {
                console.log("aqui>>");
                if (p.entry.name == f_name) {
                    let pp = p.entry;
                    if (pp instanceof atoms_1.GTems.Functor) {
                        if (pp.args.length == 1) {
                            let pa0 = pp.args[0];
                            if (util_1.isArray(pa0))
                                pa0 = pa0[0];
                            let sol_next = bind(new Solution(SolutionState.QTrue, {}), pa0, arg1);
                            if (sol_next.state == SolutionState.QTrue) {
                                yield sol_next;
                            }
                        }
                    }
                }
            }
        }
    }
    Interp.Context = Context;
})(Interp = exports.Interp || (exports.Interp = {}));
//# sourceMappingURL=interp.js.map