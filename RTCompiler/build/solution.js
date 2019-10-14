"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const atoms_1 = require("./atoms");
const util_1 = require("util");
var Solution;
(function (Solution_1) {
    // a clause foi provada .. foi disprovada
    // ou nao da para responder
    let SolutionState;
    (function (SolutionState) {
        SolutionState[SolutionState["QTrue"] = 0] = "QTrue";
        SolutionState[SolutionState["QFalse"] = 1] = "QFalse";
        SolutionState[SolutionState["QFail"] = 2] = "QFail";
        SolutionState[SolutionState["QCut"] = 3] = "QCut";
        SolutionState[SolutionState["QUndefined"] = 4] = "QUndefined";
    })(SolutionState = Solution_1.SolutionState || (Solution_1.SolutionState = {}));
    class Solution {
        constructor(state, value, var_values) {
            this.state = SolutionState.QUndefined;
            this.var_values = {};
            this.value = undefined;
            this.state = state;
            this.var_values = var_values;
            this.value = value;
            if ((value instanceof atoms_1.GTems.GBase) == false) {
                throw new Error('invalid value term');
            }
            if ((util_1.isObject(var_values)) == false) {
                throw new Error('invalid var_value term');
            }
        }
        add(var_name, value) {
            let nsol = new Solution(this.state, this.value, {});
            if (var_name == "_")
                throw new Error('variable is cannob be assigned');
            if (value.toString() == "$thing")
                throw new Error('variable is cannob be assigned');
            for (var i in this.var_values) {
                nsol.var_values[i] = this.var_values[i];
            }
            nsol.var_values[var_name] = value;
            return nsol;
        }
        add_value(value) {
            let nsol = new Solution(this.state, value.value, {});
            for (var i in this.var_values) {
                nsol.var_values[i] = this.var_values[i];
            }
            if (value.state == SolutionState.QCut)
                nsol.state = SolutionState.QCut;
            return nsol;
        }
        toString() {
            let s = this.value.toString();
            if (Object.keys(this.var_values).length > 0) {
                s += " { ";
                for (var kv in this.var_values) {
                    s += kv.toString() + ":" + this.var_values[kv].toString() + " ";
                }
                s += " } ";
            }
            return s;
        }
    }
    Solution_1.Solution = Solution;
    function isTrue(a) {
        if (isValid(a) == false)
            return false;
        if (a.value instanceof atoms_1.GTems.LiteralBool) {
            return a.value.value;
        }
        return true;
    }
    Solution_1.isTrue = isTrue;
    function isValid(a) {
        if (a.state == SolutionState.QTrue)
            return true;
        if (a.state == SolutionState.QCut)
            return true;
        if (a.state == SolutionState.QFalse)
            return false;
        if (a.state == SolutionState.QFail)
            return false;
        throw new Error("invalid state");
    }
    Solution_1.isValid = isValid;
    //mantem o segundo termo como valor
    function fuse(a, b) {
        if (isValid(a) == false)
            return a;
        if (isValid(b) == false)
            return b;
        var s = new Solution(b.state, b.value, {});
        if (b.value instanceof atoms_1.GTems.Atom)
            if (b.value.name == "cut")
                s = new Solution(SolutionState.QCut, a.value, {});
        if (a.value instanceof atoms_1.GTems.Atom)
            if (a.value.name == "cut")
                s = new Solution(SolutionState.QCut, b.value, {});
        for (var i in a.var_values) {
            if (i == "_")
                throw "anonimous variable bind ?";
            s.var_values[i] = a.var_values[i];
        }
        for (var i in b.var_values) {
            if (i == "_")
                throw "anonimous variable bind ?";
            if (util_1.isUndefined(s.var_values[i]) == false) {
                if (atoms_1.GTems.isEqually(s.var_values[i], b.var_values[i]) == false) {
                    //throw new Error("assertion error ?")
                    // console.log("variable overrride " + i )
                }
            }
            s.var_values[i] = b.var_values[i];
        }
        return s;
    }
    Solution_1.fuse = fuse;
    class SolutionGroup {
        constructor() {
            this.solution = [];
        }
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
    Solution_1.getValue = getValue;
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
        if (x.name == "_")
            return sol;
        // bind da variavel e retorna nova solucao derivada 
        let xx = getBindTail(sol, x);
        let value_binded = getBindVarValue(sol, xx);
        if (util_1.isUndefined(value_binded)) {
            let vname = xx.name;
            return sol.add(vname, y);
        }
        if (value_binded instanceof atoms_1.GTems.GValue) {
            if (atoms_1.GTems.isEqually(value_binded, y) == false) {
                return new Solution(SolutionState.QFalse, atoms_1.GTems.atom_false(), {});
            }
            else {
                return sol;
            }
        }
        if (atoms_1.GTems.isEqually(value_binded, y)) {
            return sol;
        }
        throw new Error("undefined binding");
        return new Solution(SolutionState.QFalse, atoms_1.GTems.atom_false(), {});
    }
    function bindVarVar(sol, x, y) {
        if (x.name == "_")
            return sol;
        if (y.name == "_")
            return sol;
        if (x.name == y.name)
            return sol;
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
        if (atoms_1.GTems.isEqually(x_value, y_value)) {
            return sol;
        }
        return new Solution(SolutionState.QFalse, atoms_1.GTems.atom_false(), {});
    }
    function bind(sol, x, y) {
        if (isValid(sol) == false)
            return sol; //nem tenta
        if (util_1.isArray(y))
            throw new Error("array as term, use List");
        if (util_1.isArray(x))
            throw new Error("array as term, use List");
        if (util_1.isArray(y))
            return bind(sol, x, y[0]);
        if (util_1.isArray(x))
            return bind(sol, x[0], y);
        if (x instanceof atoms_1.GTems.LiteralNumber) {
            if (y instanceof atoms_1.GTems.LiteralNumber) {
                if (atoms_1.GTems.isEquallyNumber(x, y))
                    return sol;
                else
                    return new Solution(SolutionState.QFalse, atoms_1.GTems.atom_false(), {});
            }
        }
        if (x instanceof atoms_1.GTems.GList) {
            if (y instanceof atoms_1.GTems.GList) {
                if (x.items.length != y.items.length)
                    return new Solution(SolutionState.QFalse, atoms_1.GTems.atom_false(), {});
                let sol_n = fuse(sol, new Solution(SolutionState.QTrue, atoms_1.GTems.atom_true(), {}));
                let n = x.items.length;
                for (var i = 0; i < n; ++i) {
                    sol_n = bind(sol_n, x.items[i], y.items[i]);
                    if (sol_n.state != SolutionState.QTrue)
                        break;
                }
                return sol_n;
            }
        }
        if (x instanceof atoms_1.GTems.LiteralBool) {
            if (y instanceof atoms_1.GTems.LiteralBool) {
                if (x.value == y.value)
                    return sol;
                else
                    return new Solution(SolutionState.QFalse, atoms_1.GTems.atom_false(), {});
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
                if (atoms_1.GTems.isEqually(x, y))
                    return sol;
                else
                    return new Solution(SolutionState.QFalse, atoms_1.GTems.atom_false(), {});
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
        return new Solution(SolutionState.QFalse, atoms_1.GTems.atom_false(), {});
    }
    Solution_1.bind = bind;
})(Solution = exports.Solution || (exports.Solution = {}));
//# sourceMappingURL=solution.js.map