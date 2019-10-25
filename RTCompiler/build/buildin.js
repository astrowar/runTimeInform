"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const atoms_1 = require("./atoms");
const solution_1 = require("./solution");
const util_1 = require("util");
var BuildIns;
(function (BuildIns) {
    //buildIn Predicates
    function isVar(v) {
        if (v instanceof atoms_1.GTems.Variable) {
            return true;
        }
        return false;
    }
    function warring(x) { }
    function* buildIn_arith_op(ctx, stk, sol, arg1, arg2, f) {
        //arg1 nao rh uma variavel ..bind o argumento para o valor dela ..senao,bind na saida
        let sol_next = new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_true(), {});
        if (isVar(arg1))
            new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QFalse, atoms_1.GTems.atom_false(), {});
        if (isVar(arg2))
            new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QFalse, atoms_1.GTems.atom_false(), {});
        for (var v1 of ctx.evaluate_query(stk, sol, arg1)) {
            if (solution_1.Solution.isValid(v1) == false)
                continue;
            for (var v2 of ctx.evaluate_query(stk, sol, arg2)) {
                if (solution_1.Solution.isValid(v2) == false)
                    continue;
                if (v1.value instanceof atoms_1.GTems.LiteralNumber) {
                    if (v2.value instanceof atoms_1.GTems.LiteralNumber) {
                        let z = f(v1.value.value, v2.value.value);
                        {
                            yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, new atoms_1.GTems.LiteralNumber(z), {});
                        }
                    }
                }
            }
        }
    }
    BuildIns.buildIn_arith_op = buildIn_arith_op;
    function* buildIn_binary_op(ctx, stk, sol, arg1, arg2, f) {
        //arg1 nao rh uma variavel ..bind o argumento para o valor dela ..senao,bind na saida
        let sol_next = new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_true(), {});
        if (isVar(arg1))
            new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QFalse, atoms_1.GTems.atom_false(), {});
        if (isVar(arg2))
            new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QFalse, atoms_1.GTems.atom_false(), {});
        for (var v1 of ctx.evaluate_query(stk, sol, arg1)) {
            if (solution_1.Solution.isValid(v1) == false)
                continue;
            for (var v2 of ctx.evaluate_query(stk, sol, arg2)) {
                if (solution_1.Solution.isValid(v2) == false)
                    continue;
                let z = f(v1.value, v2.value);
                {
                    if (util_1.isUndefined(z) == false)
                        yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, z, {});
                }
            }
        }
    }
    BuildIns.buildIn_binary_op = buildIn_binary_op;
    function* buildIn_cmp_op(ctx, stk, sol, arg1, arg2, f) {
        //arg1 nao rh uma variavel ..bind o argumento para o valor dela ..senao,bind na saida
        let sol_next = new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_true(), {});
        if (isVar(arg1))
            new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QFalse, atoms_1.GTems.atom_false(), {});
        if (isVar(arg2))
            new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QFalse, atoms_1.GTems.atom_false(), {});
        for (var v1 of ctx.evaluate_query(stk, sol, arg1)) {
            for (var v2 of ctx.evaluate_query(stk, sol, arg2)) {
                if (v1.value instanceof atoms_1.GTems.LiteralNumber) {
                    if (v2.value instanceof atoms_1.GTems.LiteralNumber) {
                        if (f(v1.value.value, v2.value.value)) {
                            yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, new atoms_1.GTems.LiteralBool(true), {});
                        }
                        else {
                            yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, new atoms_1.GTems.LiteralBool(false), {});
                        }
                    }
                }
            }
        }
        return new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QFalse, atoms_1.GTems.atom_false(), {});
    }
    BuildIns.buildIn_cmp_op = buildIn_cmp_op;
    function* buildIn_gte(ctx, stk, sol, arg1, arg2) {
        for (var vv of buildIn_cmp_op(ctx, stk, sol, arg1, arg2, (x1, x2) => {
            return x1 >= x2;
        }))
            yield vv;
    }
    BuildIns.buildIn_gte = buildIn_gte;
    function* buildIn_lte(ctx, stk, sol, arg1, arg2) {
        for (var vv of buildIn_cmp_op(ctx, stk, sol, arg1, arg2, (x1, x2) => {
            return x1 <= x2;
        }))
            yield vv;
    }
    BuildIns.buildIn_lte = buildIn_lte;
    function* buildIn_lt(ctx, stk, sol, arg1, arg2) {
        for (var vv of buildIn_cmp_op(ctx, stk, sol, arg1, arg2, (x1, x2) => {
            return x1 < x2;
        }))
            yield vv;
    }
    BuildIns.buildIn_lt = buildIn_lt;
    function* buildIn_gt(ctx, stk, sol, arg1, arg2) {
        for (var vv of buildIn_cmp_op(ctx, stk, sol, arg1, arg2, (x1, x2) => {
            return x1 > x2;
        }))
            yield vv;
    }
    BuildIns.buildIn_gt = buildIn_gt;
    function* buildIn_mul(ctx, stk, sol, arg1, arg2) {
        for (var vv of buildIn_arith_op(ctx, stk, sol, arg1, arg2, (x1, x2) => {
            return x1 * x2;
        }))
            yield vv;
    }
    BuildIns.buildIn_mul = buildIn_mul;
    function* buildIn_add(ctx, stk, sol, arg1, arg2) {
        for (var vv of buildIn_binary_op(ctx, stk, sol, arg1, arg2, (x1, x2) => {
            if (x1 instanceof atoms_1.GTems.LiteralStr)
                if (x2 instanceof atoms_1.GTems.LiteralStr) {
                    return new atoms_1.GTems.LiteralStr(x1.value + x2.value);
                }
            if (x1 instanceof atoms_1.GTems.LiteralNumber)
                if (x2 instanceof atoms_1.GTems.LiteralNumber) {
                    return new atoms_1.GTems.LiteralNumber(x1.value + x2.value);
                }
            return undefined;
        }))
            yield vv;
    }
    BuildIns.buildIn_add = buildIn_add;
    function* buildIn_minus(ctx, stk, sol, arg1, arg2) {
        for (var vv of buildIn_arith_op(ctx, stk, sol, arg1, arg2, (x1, x2) => {
            return x1 - x2;
        }))
            yield vv;
    }
    BuildIns.buildIn_minus = buildIn_minus;
    function* buildIn_div(ctx, stk, sol, arg1, arg2) {
        for (var vv of buildIn_arith_op(ctx, stk, sol, arg1, arg2, (x1, x2) => {
            return x1 / x2;
        }))
            yield vv;
    }
    BuildIns.buildIn_div = buildIn_div;
    function* buildIn_mod(ctx, stk, sol, arg1, arg2) {
        for (var vv of buildIn_arith_op(ctx, stk, sol, arg1, arg2, (x1, x2) => {
            return x1 % x2;
        }))
            yield vv;
    }
    BuildIns.buildIn_mod = buildIn_mod;
    function* buildIn_head(ctx, stk, sol, arg1, arg2) {
        //arg1 nao rh uma variavel ..bind o argumento para o valor dela ..senao,bind na saida
        let sol_next = new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_true(), {});
        // if (isVar(arg1)) new Solution.Solution(Solution.SolutionState.QFalse, GTems.atom_false(), {})
        if (isVar(arg2)) {
            warring('head of a unbound variable is not possible');
            // yield new Solution.Solution(Solution.SolutionState.QFalse, GTems.atom_false(), {})
        }
        if (arg2 instanceof atoms_1.GTems.GList) {
            if (arg2.items.length > 0) {
                let head = arg2.items[0];
                let ss2 = ctx.bind(sol, head, arg1);
                yield ss2;
            }
        }
        // return new Solution.Solution(Solution.SolutionState.QFalse, GTems.atom_false(), {})
    }
    BuildIns.buildIn_head = buildIn_head;
    function* buildIn_tail(ctx, stk, sol, arg1, arg2) {
        //arg1 nao rh uma variavel ..bind o argumento para o valor dela ..senao,bind na saida
        let sol_next = new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_true(), {});
        // if (isVar(arg1)) new Solution.Solution(Solution.SolutionState.QFalse, GTems.atom_false(), {})
        if (isVar(arg2)) {
            ctx.warring('tail of a unbound variable is not possible');
            //yield new Solution.Solution(Solution.SolutionState.QFalse, GTems.atom_false(), {})
        }
        if (arg2 instanceof atoms_1.GTems.GList) {
            if (arg2.items.length > 0) {
                let tail = arg2.clone();
                tail.items.shift();
                let s = ctx.bind(sol, tail, arg1);
                yield s;
            }
        }
        //return new Solution.Solution(Solution.SolutionState.QFalse, GTems.atom_false(), {})
    }
    BuildIns.buildIn_tail = buildIn_tail;
    function* buildIn_atom_string(ctx, stk, sol, arg1, arg2) {
        let sol_next = new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_true(), {});
        if (arg1 instanceof atoms_1.GTems.Atom && arg2 instanceof atoms_1.GTems.Variable) {
            let s1 = new atoms_1.GTems.LiteralStr(arg1.name);
            yield ctx.bind(sol_next, arg2, s1);
            return;
        }
        if (arg1 instanceof atoms_1.GTems.Variable &&
            arg2 instanceof atoms_1.GTems.LiteralStr) {
            let s2 = new atoms_1.GTems.Atom(arg2.value);
            yield ctx.bind(sol_next, arg1, s2);
            return;
        }
        if (arg1 instanceof atoms_1.GTems.Atom && arg2 instanceof atoms_1.GTems.LiteralStr) {
            if (arg1.name == arg2.value) {
                yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_true(), {});
            }
            else {
                yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QFalse, atoms_1.GTems.atom_false(), {});
            }
            return;
        }
        throw new Error('invalid argument for atom_string');
    }
    BuildIns.buildIn_atom_string = buildIn_atom_string;
    function* buildIn_member(ctx, stk, sol, arg1, arg2) {
        let sol_next = new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_true(), {});
        if (arg2 instanceof atoms_1.GTems.GList) {
            for (var i = 0; i < arg2.items.length; i++) {
                let r = ctx.bind(sol_next, arg2.items[i], arg1);
                if (solution_1.Solution.isValid(r)) {
                    yield r;
                }
            }
            return;
        }
        throw new Error('invalid argument for member, segond arg must be a list');
    }
    BuildIns.buildIn_member = buildIn_member;
    function* buildIn_random_member(ctx, stk, sol, arg1, arg2) {
        let getRandomInt = function (min, max) {
            min = Math.ceil(min);
            max = Math.floor(max);
            return Math.floor(Math.random() * (max - min)) + min;
        };
        let sol_next = new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_true(), {});
        if (arg2 instanceof atoms_1.GTems.GList) {
            let i = getRandomInt(0, arg2.items.length);
            {
                let r = ctx.bind(sol_next, arg2.items[i], arg1);
                if (solution_1.Solution.isValid(r)) {
                    yield r;
                }
            }
            return;
        }
        throw new Error('invalid argument for member, segond arg must be a list');
    }
    BuildIns.buildIn_random_member = buildIn_random_member;
    function* buildIn_nextto(ctx, stk, sol, arg1, arg2, arg3) {
        let sol_next = new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_true(), {});
        if (arg3 instanceof atoms_1.GTems.GList) {
            for (var i = 0; i <= arg3.items.length - 1; i++) {
                let x1 = arg3.items[i];
                let r = ctx.bind(sol_next, x1, arg1);
                if (solution_1.Solution.isValid(r)) {
                    let r2 = ctx.bind(r, arg3.items[i + 1], arg2);
                    if (solution_1.Solution.isValid(r2)) {
                        yield r2;
                    }
                }
            }
        }
    }
    BuildIns.buildIn_nextto = buildIn_nextto;
    function* buildIn_append(ctx, stk, sol, arg1, arg2, arg3) {
        let sol_next = new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_true(), {});
        if (arg1 instanceof atoms_1.GTems.GList) {
            if (arg2 instanceof atoms_1.GTems.GList) {
                let qs = arg1.items.concat(arg2.items);
                let ql = new atoms_1.GTems.GList(qs);
                let r = ctx.bind(sol_next, ql, arg3);
                yield r;
                return;
            }
        }
        if (arg3 instanceof atoms_1.GTems.GList) {
            if (arg1 instanceof atoms_1.GTems.Variable && arg2 instanceof atoms_1.GTems.GList) {
                if (arg2.items.length > arg3.items.length)
                    return;
                let nlast = arg2.items.length;
                let q2 = new atoms_1.GTems.GList(arg3.items.slice(nlast));
                let r = ctx.bind(sol_next, q2, arg2);
                if (solution_1.Solution.isValid(r)) {
                    let q1 = new atoms_1.GTems.GList(arg3.items.slice(0, nlast));
                    yield ctx.bind(r, q1, arg1);
                }
            }
            if (arg1 instanceof atoms_1.GTems.GList && arg2 instanceof atoms_1.GTems.Variable) {
                if (arg1.items.length > arg3.items.length)
                    return;
                let nlast = arg3.items.length - arg1.items.length;
                let q1 = new atoms_1.GTems.GList(arg3.items.slice(0, arg1.items.length));
                let q2 = new atoms_1.GTems.GList(arg3.items.slice(nlast));
                let r = ctx.bind(sol_next, q1, arg1);
                if (solution_1.Solution.isValid(r)) {
                    yield ctx.bind(r, q2, arg2);
                }
            }
            if (arg1 instanceof atoms_1.GTems.Variable &&
                arg2 instanceof atoms_1.GTems.Variable) {
                for (var i = 0; i <= arg3.items.length; i++) {
                    let q1 = new atoms_1.GTems.GList(arg3.items.slice(0, i));
                    let q2 = new atoms_1.GTems.GList(arg3.items.slice(i));
                    let r = ctx.bind(sol_next, q1, arg1);
                    if (solution_1.Solution.isValid(r)) {
                        let r2 = ctx.bind(r, q2, arg2);
                        yield r2;
                    }
                }
            }
            return;
        }
        throw new Error('invalid arguments');
    }
    BuildIns.buildIn_append = buildIn_append;
    function* buildIn_ht(ctx, stk, sol, arg1, arg2, arg3) {
        let sol_next = new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_true(), {});
        if (arg3 instanceof atoms_1.GTems.GList) {
            if (arg3.items.length > 0) {
                let t = arg3.clone();
                let h = t.items[0];
                t.items.shift();
                let s = ctx.bind(sol, t, arg2);
                s = ctx.bind(s, h, arg1);
                yield s;
            }
            return;
        }
        if (arg3 instanceof atoms_1.GTems.Variable)
            if (arg2 instanceof atoms_1.GTems.GList) {
                let nlist1 = new atoms_1.GTems.GList([arg1]);
                for (var v of buildIn_append(ctx, stk, sol, nlist1, arg2, arg3))
                    yield v;
                return;
            }
        return;
        throw new Error('invalid arguments');
    }
    BuildIns.buildIn_ht = buildIn_ht;
    function* buildIn_maplist(ctx, stk, sol, arg1, arg2) {
        let sol_next = new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_true(), {});
        if (isVar(arg1)) {
            ctx.warring('maplist of a unbound predicate is not possible');
            yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QFalse, atoms_1.GTems.atom_false(), {});
        }
        if (isVar(arg2)) {
            ctx.warring(' maplist of a unbound input list is not possible');
            yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QFalse, atoms_1.GTems.atom_false(), {});
        }
        if (arg1 instanceof atoms_1.GTems.Atom) {
            if (arg2 instanceof atoms_1.GTems.GList) {
                for (var qs of ctx.apply_rec(stk, sol, [], arg2.items, arg1.name))
                    yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, new atoms_1.GTems.GList(qs), {});
            }
        }
    }
    BuildIns.buildIn_maplist = buildIn_maplist;
})(BuildIns = exports.BuildIns || (exports.BuildIns = {}));
//# sourceMappingURL=buildin.js.map