"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const atoms_1 = require("./atoms");
const solution_1 = require("./solution");
const util_1 = require("util");
var Interp;
(function (Interp) {
    class PredicateEntry {
        constructor(unique_name, entry, value, condition, prior) {
            this.unique_name = unique_name;
            this.entry = entry;
            this.value = value;
            this.condition = condition;
            this.prior = prior;
        }
    }
    class CallItem {
        constructor(unique_name, arg) {
            this.unique_name = unique_name;
            this.arg = arg;
        }
    }
    class QueryStack {
        constructor() {
            this.callStack = [];
        }
        contains(unique_name, arg0 = undefined, arg1 = undefined, arg2 = undefined, arg3 = undefined) {
            for (var [i, cv] of this.callStack.entries()) {
                if (cv.unique_name != unique_name)
                    continue;
                if (util_1.isUndefined(arg0) && cv.arg.length > 0)
                    continue; //arridade nao bate, cv eh menor que o requisitado
                if (util_1.isUndefined(arg1) && cv.arg.length > 1)
                    continue; //arridade nao bate
                if (util_1.isUndefined(arg2) && cv.arg.length > 2)
                    continue; //arridade nao bate
                if (util_1.isUndefined(arg3) && cv.arg.length > 3)
                    continue; //arridade nao bate
                if (util_1.isUndefined(arg0) == false && cv.arg.length < 1)
                    continue; // cv eh  maior do que o requisitado
                if (util_1.isUndefined(arg1) == false && cv.arg.length < 2)
                    continue;
                if (util_1.isUndefined(arg2) == false && cv.arg.length < 3)
                    continue;
                if (util_1.isUndefined(arg3) == false && cv.arg.length < 4)
                    continue;
                if (util_1.isUndefined(arg0) == false)
                    if (atoms_1.GTems.isEqually(cv.arg[0], arg0) == false)
                        continue;
                if (util_1.isUndefined(arg1) == false)
                    if (atoms_1.GTems.isEqually(cv.arg[1], arg1) == false)
                        continue;
                if (util_1.isUndefined(arg2) == false)
                    if (atoms_1.GTems.isEqually(cv.arg[2], arg2) == false)
                        continue;
                if (util_1.isUndefined(arg3) == false)
                    if (atoms_1.GTems.isEqually(cv.arg[3], arg3) == false)
                        continue;
                return true;
            }
            return false;
        }
        clone() {
            let s = new QueryStack();
            for (var [i, cv] of this.callStack.entries())
                s.callStack.push(cv);
            return s;
        }
        pushCall(unique_name, arg0 = undefined, arg1 = undefined, arg2 = undefined, arg3 = undefined) {
            let argv = [];
            if (util_1.isUndefined(arg0) == false)
                argv.push(arg0);
            if (util_1.isUndefined(arg1) == false)
                argv.push(arg1);
            if (util_1.isUndefined(arg2) == false)
                argv.push(arg2);
            if (util_1.isUndefined(arg3) == false)
                argv.push(arg3);
            if (util_1.isUndefined(arg1) == false && (util_1.isUndefined(arg0)))
                throw new Error("invalid call arguments");
            if (util_1.isUndefined(arg2) == false && (util_1.isUndefined(arg0)))
                throw new Error("invalid call arguments");
            if (util_1.isUndefined(arg2) == false && (util_1.isUndefined(arg1)))
                throw new Error("invalid call arguments");
            if (util_1.isUndefined(arg3) == false && (util_1.isUndefined(arg2)))
                throw new Error("invalid call arguments");
            let c = new CallItem(unique_name, argv);
            let s = this.clone();
            s.callStack.push(c);
            return s;
        }
    }
    function getComplexityTerm(p) {
        if (p instanceof atoms_1.GTems.Atom)
            return 10;
        if (p instanceof atoms_1.GTems.Variable)
            return 0;
        if (p instanceof atoms_1.GTems.GList)
            return 40;
        if (p instanceof atoms_1.GTems.GValue)
            return 10;
        if (p instanceof atoms_1.GTems.Functor)
            return 10 + getComplexity(p);
        return 5;
    }
    function getComplexity(p) {
        if (p instanceof atoms_1.GTems.Atom) {
            return 10;
        }
        if (p instanceof atoms_1.GTems.Functor) {
            let prs = p.args.map(getComplexityTerm);
            var total = prs.reduce(function (a, b) { return a * b; }, 1);
            return total;
        }
        return 0;
    }
    // 1 -> a < b 
    function predicateEntryOrder(a, b) {
        let prior_A = -1;
        let prior_B = 1;
        if (a.prior > b.prior)
            return prior_A;
        if (a.prior < b.prior)
            return prior_B;
        if (util_1.isUndefined(a.condition) == false && util_1.isUndefined(b.condition))
            return prior_A;
        if (util_1.isUndefined(b.condition) == false && util_1.isUndefined(a.condition))
            return prior_B;
        let cp_a = getComplexity(a.entry);
        let cp_b = getComplexity(b.entry);
        if (cp_a > cp_b)
            return prior_A;
        if (cp_b > cp_a)
            return prior_B;
        if (util_1.isUndefined(a.condition) == false && util_1.isUndefined(b.condition) == false) {
            let cd_a = getComplexityTerm(a.condition);
            let cd_b = getComplexityTerm(b.condition);
            if (cd_a > cd_b)
                return prior_A;
            if (cd_b > cd_a)
                return prior_B;
        }
        return 0;
    }
    class Context {
        constructor() {
            //predicades: GTems.Functor[] = []
            this.values = [];
            this.predicades = [];
            this.predicades_id = 1;
        }
        addPredicateFunc(p, code, condition, prioridade) {
            let unique_name = p.name + this.predicades_id.toString();
            this.predicades_id++;
            console.log(code);
            this.predicades.unshift(new PredicateEntry(unique_name, p, code, condition, prioridade));
            this.predicades = this.predicades.sort((a, b) => { return predicateEntryOrder(a, b); });
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
        *query_append(sol, q1, q2) {
            if (q1 instanceof atoms_1.GTems.GList) {
                let qcopy = q1.clone();
                qcopy.items.push(q2);
                yield solution_1.Solution.fuse(sol, new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, qcopy, {}));
                return;
            }
            return;
        }
        *query_and(stk, sol, q1, q2) {
            for (var qq of this.evaluate_query(stk, sol, q1)) {
                let qsol = qq;
                if (solution_1.Solution.isValid(qsol)) {
                    let v = qsol.value;
                    if (v instanceof atoms_1.GTems.LiteralBool) {
                        if (v.value == false) {
                            yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QFalse, atoms_1.GTems.atom_false(), {});
                            continue; //nem tenta o segundo termo
                        }
                    }
                    for (var qz of this.evaluate_query(stk, solution_1.Solution.fuse(qsol, sol), q2)) {
                        if (solution_1.Solution.isValid(qz)) {
                            let fz = solution_1.Solution.fuse(qq, qz);
                            yield fz;
                        }
                    }
                }
            }
        }
        *query_or(stk, sol, q1, q2) {
            for (var qq of this.evaluate_query(stk, sol, q1)) {
                if (solution_1.Solution.isValid(qq)) {
                    let v = qq.value;
                    if (v instanceof atoms_1.GTems.LiteralBool) {
                        if (v.value == false) {
                            yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QFalse, atoms_1.GTems.atom_false(), {});
                            continue;
                        }
                    }
                    yield qq;
                }
            }
            //another term
            for (var qq of this.evaluate_query(stk, sol, q2)) {
                if (solution_1.Solution.isValid(qq)) {
                    let v = qq.value;
                    if (v instanceof atoms_1.GTems.LiteralBool) {
                        if (v.value == false) {
                            yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QFalse, atoms_1.GTems.atom_false(), {});
                            continue;
                        }
                    }
                    yield qq;
                }
            }
        }
        all_query(q) {
            // console.dir(q, { depth: null })
            let sol = new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_true(), {});
            let stk = new QueryStack();
            let r = [];
            for (var qz of this.query(stk, sol, q)) {
                if (solution_1.Solution.isValid(qz)) {
                    r.push(qz);
                }
            }
            // console.log("solutions:")
            // console.dir( r, { depth: null })
            return r;
        }
        *query(stk, sol, q) {
            // console.log("...")
            // console.dir(q, { depth: null })
            if (q instanceof atoms_1.GTems.Functor) {
                if (q.name == "and") {
                    for (var qq of this.query_and(stk, sol, q.args[0], q.args[1]))
                        yield qq;
                    return;
                }
                if (q.name == "or") {
                    for (var qq of this.query_or(stk, sol, q.args[0], q.args[1]))
                        yield qq;
                    return;
                }
                if (q.args.length == 1) {
                    for (var qx of this.query_ar1(stk, sol, q.name, q.args[0])) {
                        yield qx;
                    }
                    return;
                }
                if (q.args.length == 2) {
                    for (var qy of this.query_ar2(stk, sol, q.name, q.args[0], q.args[1])) {
                        yield qy;
                    }
                    return;
                }
                if (q.args.length == 3) {
                    for (var qz of this.query_ar3(stk, sol, q.name, q.args[0], q.args[1], q.args[2])) {
                        yield qz;
                    }
                    return;
                }
            }
            if (q instanceof atoms_1.GTems.LiteralBool) {
                if (q.value == false)
                    yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QFalse, q, {});
                if (q.value == true)
                    yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, q, {});
                return;
            }
            if (q instanceof atoms_1.GTems.Atom) {
                if (q.name == "true") {
                    yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, q, {});
                    return;
                }
                if (q.name == "false") {
                    yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QFalse, q, {});
                    return;
                }
                if (q.name == "fail") {
                    yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QFail, q, {});
                    return;
                }
                if (q.name == "cut") {
                    yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QCut, q, {});
                    return;
                }
                yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, q, {}); //fail
                return;
            }
            if (q instanceof atoms_1.GTems.Variable) {
                if (this.isVar(q)) {
                    let qval = solution_1.Solution.getValue(sol, q);
                    if (util_1.isUndefined(qval)) {
                        yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QFalse, qval, {}); //fail                        
                    }
                    else {
                        yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, qval, {});
                    }
                    return;
                }
            }
            if (q instanceof atoms_1.GTems.LiteralNumber) {
                yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, q, {});
                return;
            }
            if (q instanceof atoms_1.GTems.GList) {
                yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, q, {});
                return;
            }
            console.log("undefined term :", q);
            //throw new Error('Unassigned Term Evaluator');
        }
        *evaluate_query(stk, sol, code) {
            if (code instanceof atoms_1.GTems.Atom) {
                if (code.name == "true") {
                    yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, new atoms_1.GTems.LiteralBool(true), {});
                    return;
                }
                if (code.name == "false") {
                    yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QFalse, new atoms_1.GTems.LiteralBool(false), {});
                    return;
                }
                if (code.name == "fail") {
                    yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QFail, code, {});
                    return;
                }
                if (code.name == "cut") {
                    yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QCut, code, {});
                    return;
                }
            }
            if (code instanceof atoms_1.GTems.Variable) {
                let code_value = solution_1.Solution.getValue(sol, code);
                if (util_1.isUndefined(code_value)) {
                    yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, code, {});
                    return;
                }
                yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, code_value, {});
                return;
            }
            if (code instanceof atoms_1.GTems.LiteralNumber) {
                yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, code, {});
                return;
            }
            if (code instanceof atoms_1.GTems.LiteralBool) {
                yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, code, {});
                return;
            }
            if (code instanceof atoms_1.GTems.GList) {
                for (var ecc of this.eval_rec(stk, sol, [], code.items)) {
                    yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, new atoms_1.GTems.GList(ecc), {});
                }
                return;
            }
            for (var qin of this.query(stk, sol, code)) {
                let fsol = solution_1.Solution.fuse(sol, qin);
                if (solution_1.Solution.isValid(fsol)) {
                    yield fsol;
                }
            }
        }
        //buildIn Predicates
        *buildIn_add(stk, sol, arg1, arg2) {
            //arg1 nao rh uma variavel ..bind o argumento para o valor dela ..senao,bind na saida
            let sol_next = new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_true(), {});
            if (this.isVar(arg1))
                new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QFalse, atoms_1.GTems.atom_false(), {});
            if (this.isVar(arg2))
                new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QFalse, atoms_1.GTems.atom_false(), {});
            for (var v1 of this.evaluate_query(stk, sol, arg1)) {
                for (var v2 of this.evaluate_query(stk, sol, arg2)) {
                    if (v1.value instanceof atoms_1.GTems.LiteralNumber) {
                        if (v2.value instanceof atoms_1.GTems.LiteralNumber) {
                            let r = new atoms_1.GTems.LiteralNumber(v1.value.value + v2.value.value);
                            yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, r, {});
                        }
                    }
                }
            }
            return new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QFalse, atoms_1.GTems.atom_false(), {});
        }
        *buildIn_minus(stk, sol, arg1, arg2) {
            //arg1 nao rh uma variavel ..bind o argumento para o valor dela ..senao,bind na saida
            let sol_next = new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_true(), {});
            if (this.isVar(arg1))
                new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QFalse, atoms_1.GTems.atom_false(), {});
            if (this.isVar(arg2))
                new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QFalse, atoms_1.GTems.atom_false(), {});
            for (var v1 of this.evaluate_query(stk, sol, arg1)) {
                for (var v2 of this.evaluate_query(stk, sol, arg2)) {
                    if (v1.value instanceof atoms_1.GTems.LiteralNumber) {
                        if (v2.value instanceof atoms_1.GTems.LiteralNumber) {
                            let r = new atoms_1.GTems.LiteralNumber(v1.value.value - v2.value.value);
                            yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, r, {});
                        }
                    }
                }
            }
            return new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QFalse, atoms_1.GTems.atom_false(), {});
        }
        *buildIn_cmp_op(stk, sol, arg1, arg2, f) {
            //arg1 nao rh uma variavel ..bind o argumento para o valor dela ..senao,bind na saida
            let sol_next = new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_true(), {});
            if (this.isVar(arg1))
                new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QFalse, atoms_1.GTems.atom_false(), {});
            if (this.isVar(arg2))
                new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QFalse, atoms_1.GTems.atom_false(), {});
            for (var v1 of this.evaluate_query(stk, sol, arg1)) {
                for (var v2 of this.evaluate_query(stk, sol, arg2)) {
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
        *buildIn_gte(stk, sol, arg1, arg2) {
            for (var vv of this.buildIn_cmp_op(stk, sol, arg1, arg2, (x1, x2) => { return x1 >= x2; }))
                yield vv;
        }
        *buildIn_lte(stk, sol, arg1, arg2) {
            for (var vv of this.buildIn_cmp_op(stk, sol, arg1, arg2, (x1, x2) => { return x1 <= x2; }))
                yield vv;
        }
        *buildIn_gt(stk, sol, arg1, arg2) {
            //arg1 nao rh uma variavel ..bind o argumento para o valor dela ..senao,bind na saida
            let sol_next = new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_true(), {});
            if (this.isVar(arg1))
                new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QFalse, atoms_1.GTems.atom_false(), {});
            if (this.isVar(arg2))
                new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QFalse, atoms_1.GTems.atom_false(), {});
            for (var v1 of this.evaluate_query(stk, sol, arg1)) {
                for (var v2 of this.evaluate_query(stk, sol, arg2)) {
                    if (v1.value instanceof atoms_1.GTems.LiteralNumber) {
                        if (v2.value instanceof atoms_1.GTems.LiteralNumber) {
                            if (v1.value.value > v2.value.value) {
                                yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, new atoms_1.GTems.LiteralBool(true), {});
                            }
                            else {
                                yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QFalse, new atoms_1.GTems.LiteralBool(false), {});
                            }
                        }
                    }
                }
            }
            return new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QFalse, atoms_1.GTems.atom_false(), {});
        }
        *buildIn_lt(stk, sol, arg1, arg2) {
            //arg1 nao rh uma variavel ..bind o argumento para o valor dela ..senao,bind na saida
            let sol_next = new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_true(), {});
            if (this.isVar(arg1))
                new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QFalse, atoms_1.GTems.atom_false(), {});
            if (this.isVar(arg2))
                new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QFalse, atoms_1.GTems.atom_false(), {});
            for (var v1 of this.evaluate_query(stk, sol, arg1)) {
                for (var v2 of this.evaluate_query(stk, sol, arg2)) {
                    if (v1.value instanceof atoms_1.GTems.LiteralNumber) {
                        if (v2.value instanceof atoms_1.GTems.LiteralNumber) {
                            if (v1.value.value < v2.value.value) {
                                yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, new atoms_1.GTems.LiteralBool(true), {});
                            }
                            else {
                                yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QFalse, new atoms_1.GTems.LiteralBool(false), {});
                            }
                        }
                    }
                }
            }
            //  return new Solution.Solution(Solution.SolutionState.QFalse, GTems.atom_false(), {})
        }
        *buildIn_mul(stk, sol, arg1, arg2) {
            //arg1 nao rh uma variavel ..bind o argumento para o valor dela ..senao,bind na saida
            let sol_next = new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_true(), {});
            if (this.isVar(arg1))
                new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QFalse, atoms_1.GTems.atom_false(), {});
            if (this.isVar(arg2))
                new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QFalse, atoms_1.GTems.atom_false(), {});
            for (var v1 of this.evaluate_query(stk, sol, arg1)) {
                for (var v2 of this.evaluate_query(stk, sol, arg2)) {
                    if (v1.value instanceof atoms_1.GTems.LiteralNumber) {
                        if (v2.value instanceof atoms_1.GTems.LiteralNumber) {
                            let vv = (v1.value.value * v2.value.value);
                            yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, new atoms_1.GTems.LiteralNumber(vv), {});
                        }
                    }
                }
            }
            // return new Solution.Solution(Solution.SolutionState.QFalse, GTems.atom_false(), {})
        }
        *buildIn_head(stk, sol, arg1, arg2) {
            //arg1 nao rh uma variavel ..bind o argumento para o valor dela ..senao,bind na saida
            let sol_next = new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_true(), {});
            // if (this.isVar(arg1)) new Solution.Solution(Solution.SolutionState.QFalse, GTems.atom_false(), {})
            if (this.isVar(arg2)) {
                console.log("Warring: head of a unbound variable is not possible");
                // yield new Solution.Solution(Solution.SolutionState.QFalse, GTems.atom_false(), {})
            }
            if (arg2 instanceof atoms_1.GTems.GList) {
                if (arg2.items.length > 0) {
                    let head = arg2.items[0];
                    let s = solution_1.Solution.bind(sol, head, arg1);
                    yield s;
                }
            }
            // return new Solution.Solution(Solution.SolutionState.QFalse, GTems.atom_false(), {})
        }
        *buildIn_tail(stk, sol, arg1, arg2) {
            //arg1 nao rh uma variavel ..bind o argumento para o valor dela ..senao,bind na saida
            let sol_next = new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_true(), {});
            // if (this.isVar(arg1)) new Solution.Solution(Solution.SolutionState.QFalse, GTems.atom_false(), {})
            if (this.isVar(arg2)) {
                console.log("Warring: tail of a unbound variable is not possible");
                //yield new Solution.Solution(Solution.SolutionState.QFalse, GTems.atom_false(), {})
            }
            if (arg2 instanceof atoms_1.GTems.GList) {
                if (arg2.items.length > 0) {
                    let tail = arg2.clone();
                    tail.items.shift();
                    let s = solution_1.Solution.bind(sol, tail, arg1);
                    yield s;
                }
            }
            //return new Solution.Solution(Solution.SolutionState.QFalse, GTems.atom_false(), {})
        }
        *eval_rec(stk, sol, acc, args) {
            if (args.length == 0) {
                yield acc;
                return;
            }
            let args_c = Object.assign([], args);
            let arg = args_c.shift();
            for (var v of this.evaluate_query(stk, sol, arg)) {
                if (solution_1.Solution.isValid(v)) {
                    let acc2 = Object.assign([], acc);
                    acc2.push(v.value);
                    for (var rval of this.eval_rec(stk, sol, acc2, args_c))
                        yield rval;
                }
            }
        }
        *apply_rec(stk, sol, acc, args, func) {
            if (args.length == 0) {
                yield acc;
                return;
            }
            let args_c = Object.assign([], args);
            let arg = args_c.shift();
            for (var v of this.evaluate_query(stk, sol, arg)) {
                if (solution_1.Solution.isValid(v)) {
                    for (var qs of this.query_ar1(stk, sol, func, v.value)) {
                        if (qs instanceof solution_1.Solution.Solution) {
                            let acc2 = Object.assign([], acc);
                            acc2.push(qs.value);
                            for (var rval of this.apply_rec(stk, sol, acc2, args_c, func))
                                yield rval;
                        }
                    }
                }
            }
        }
        *buildIn_maplist(stk, sol, arg1, arg2) {
            let sol_next = new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_true(), {});
            if (this.isVar(arg1)) {
                console.log("Warring: maplist of a unbound predicate is not possible");
                yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QFalse, atoms_1.GTems.atom_false(), {});
            }
            if (this.isVar(arg2)) {
                console.log("Warring: maplist of a unbound input list is not possible");
                yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QFalse, atoms_1.GTems.atom_false(), {});
            }
            if (arg1 instanceof atoms_1.GTems.Atom) {
                if (arg2 instanceof atoms_1.GTems.GList) {
                    for (var qs of this.apply_rec(stk, sol, [], arg2.items, arg1.name))
                        yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, new atoms_1.GTems.GList(qs), {});
                }
            }
        }
        //general call
        *query_ar3(stk, sol, f_name, _arg1, _arg2, _arg3) {
            let hasY = false;
            for (var s of this.query_ar3_inner(stk, sol, f_name, _arg1, _arg2, _arg3)) {
                yield s;
                if (solution_1.Solution.isValid(s))
                    hasY = true;
            }
            if (hasY == false && f_name.startsWith("ULS") == false) {
                for (var sq of this.query_ar3_inner(stk, sol, "ULS" + f_name, _arg1, _arg2, _arg3)) {
                    yield sq;
                }
            }
            return;
        }
        *query_ar3_inner(stk, sol, f_name, _arg1, _arg2, _arg3) {
            for (var x1 of this.evaluate_query(stk, sol, _arg1)) {
                if (solution_1.Solution.isValid(x1)) {
                    let nsol = solution_1.Solution.fuse(sol, x1);
                    for (var x2 of this.evaluate_query(stk, nsol, _arg2)) {
                        if (solution_1.Solution.isValid(x2)) {
                            let nsol2 = solution_1.Solution.fuse(nsol, x2);
                            for (var x3 of this.evaluate_query(stk, nsol2, _arg3)) {
                                if (solution_1.Solution.isValid(x3)) {
                                    let nsol3 = solution_1.Solution.fuse(nsol2, x3);
                                    for (var z of this.query_ar3_inner_argv(stk, nsol3, f_name, x1.value, x2.value, x3.value)) {
                                        yield z;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        *query_ar3_inner_argv(stk, sol, f_name, _arg1, _arg2, _arg3) {
            if (util_1.isArray(_arg1))
                _arg1 = _arg1[0];
            if (util_1.isArray(_arg2))
                _arg2 = _arg2[0];
            if (util_1.isArray(_arg3))
                _arg3 = _arg3[0];
            let arg1 = _arg1;
            let arg2 = _arg2;
            let arg3 = _arg3;
            let hasFound = false;
            let query_satisf = false;
            for (var [i, p] of this.predicades.entries()) {
                // if (query_satisf)  continue
                if (p.entry.name != f_name)
                    continue;
                let pp = p.entry;
                if (pp instanceof atoms_1.GTems.Functor) {
                    hasFound = true;
                    if (pp.args.length != 3)
                        continue;
                    let pa0 = pp.args[0];
                    if (util_1.isArray(pa0))
                        pa0 = pa0[0];
                    let pa1 = pp.args[1];
                    if (util_1.isArray(pa1))
                        pa1 = pa1[0];
                    let pa2 = pp.args[2];
                    if (util_1.isArray(pa2))
                        pa2 = pa2[0];
                    if (stk.contains(p.unique_name, arg1, arg2, arg3))
                        continue; //nao tenta de novo se ja estiver tetando dar query no mesmo predicado e nos mesmo parametros
                    let stk_next = stk.pushCall(p.unique_name, arg1, arg2, arg3);
                    //arg1 nao rh uma variavel ..bind o argumento para o valor dela ..senao,bind na saida
                    let sol_next = new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_true(), {});
                    if (this.isVar(arg1) == false) {
                        sol_next = solution_1.Solution.bind(sol_next, pa0, arg1);
                    }
                    if (this.isVar(arg2) == false) {
                        sol_next = solution_1.Solution.bind(sol_next, pa1, arg2);
                    }
                    if (this.isVar(arg3) == false) {
                        sol_next = solution_1.Solution.bind(sol_next, pa2, arg3);
                    }
                    //same parameter 
                    if (this.isVar(pa1) && this.isVar(pa2)) {
                        if (pa1 instanceof atoms_1.GTems.Variable)
                            if (pa2 instanceof atoms_1.GTems.Variable) {
                                if (pa1.name == pa2.name) {
                                }
                            }
                    }
                    // testa a condicao de ativacao do predicado
                    let cond_satisf = true;
                    if (util_1.isUndefined(p.condition) == false) {
                        cond_satisf = false;
                        //testa a condicao
                        for (var sol_cond of this.evaluate_query(stk_next, sol_next, p.condition)) {
                            if (solution_1.Solution.isValid(sol_cond)) {
                                cond_satisf = true;
                                break; //apenas a primeira true ja serve
                            }
                        }
                    }
                    if (cond_satisf == false)
                        continue; // nem testa o corpo .. proximo termo
                    if (solution_1.Solution.isValid(sol_next) == false)
                        continue;
                    for (var sol_next_inner of this.evaluate_query(stk_next, sol_next, p.value)) {
                        if (solution_1.Solution.isValid(sol_next_inner) == false)
                            continue;
                        sol_next_inner = solution_1.Solution.fuse(sol_next_inner, sol_next);
                        let sol_n = new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_true(), {});
                        sol_n = solution_1.Solution.fuse(sol, sol_n); //just a copy 
                        if (this.isVar(arg1)) //arg1 eh uma variavel ? bind para o resultado 
                         {
                            let v_ret = solution_1.Solution.getValue(sol_next_inner, pa0);
                            if (util_1.isUndefined(v_ret) == false)
                                sol_n = solution_1.Solution.bind(sol_n, v_ret, arg1);
                        }
                        if (solution_1.Solution.isValid(sol_n) == false)
                            continue;
                        if (this.isVar(arg2)) //arg1 eh uma variavel ? bind para o resultado 
                         {
                            let v_ret = solution_1.Solution.getValue(sol_next_inner, pa1);
                            if (util_1.isUndefined(v_ret) == false)
                                sol_n = solution_1.Solution.bind(sol_n, v_ret, arg2);
                        }
                        if (solution_1.Solution.isValid(sol_n) == false)
                            continue;
                        if (this.isVar(arg3)) //arg1 eh uma variavel ? bind para o resultado 
                         {
                            let v_ret = solution_1.Solution.getValue(sol_next_inner, pa2);
                            if (util_1.isUndefined(v_ret) == false)
                                sol_n = solution_1.Solution.bind(sol_n, v_ret, arg3);
                        }
                        if (solution_1.Solution.isValid(sol_n) == false)
                            continue;
                        query_satisf = true;
                        let ret = sol_n.add_value(sol_next_inner);
                        if (ret.state == solution_1.Solution.SolutionState.QCut) {
                            ret.state = solution_1.Solution.SolutionState.QTrue;
                            yield ret;
                            return;
                        }
                        else {
                            yield ret;
                        }
                    }
                }
            }
            if (f_name.startsWith("ULS") == false)
                if (hasFound == false) {
                    console.log("Predicate " + f_name + "/3  not found ");
                }
        }
        *query_ar2(stk, sol, f_name, _arg1, _arg2) {
            let hasY = false;
            for (var s of this.query_ar2_inner(stk, sol, f_name, _arg1, _arg2)) {
                yield s;
                if (solution_1.Solution.isValid(s))
                    hasY = true;
            }
            if (hasY == false && f_name.startsWith("ULS") == false) {
                for (var sq of this.query_ar2_inner(stk, sol, "ULS" + f_name, _arg1, _arg2)) {
                    yield sq;
                }
            }
            return;
        }
        *query_ar2_inner(stk, sol, f_name, _arg1, _arg2) {
            for (var x1 of this.evaluate_query(stk, sol, _arg1)) {
                if (solution_1.Solution.isValid(x1)) {
                    let nsol = solution_1.Solution.fuse(sol, x1);
                    for (var x2 of this.evaluate_query(stk, nsol, _arg2)) {
                        if (solution_1.Solution.isValid(x2)) {
                            let nsol2 = solution_1.Solution.fuse(nsol, x2);
                            for (var z of this.query_ar2_inner_argv(stk, nsol2, f_name, x1.value, x2.value)) {
                                yield z;
                            }
                        }
                    }
                }
            }
        }
        *query_ar2_inner_argv(stk, sol, f_name, _arg1, _arg2) {
            if (util_1.isArray(_arg1))
                _arg1 = _arg1[0];
            if (util_1.isArray(_arg2))
                _arg2 = _arg2[0];
            let arg1 = _arg1;
            let arg2 = _arg2;
            if (f_name == "unify") {
                var bvar = solution_1.Solution.bind(sol, arg1, arg2);
                yield bvar;
                return;
            }
            if (f_name == "equal") {
                var bvar_e = solution_1.Solution.bind(sol, arg1, arg2);
                if (solution_1.Solution.isValid(bvar_e))
                    yield new solution_1.Solution.Solution(bvar_e.state, atoms_1.GTems.atom_true(), {});
                else
                    yield new solution_1.Solution.Solution(bvar_e.state, atoms_1.GTems.atom_false(), {});
                return;
            }
            if (f_name == "append") {
                for (var qq of this.query_append(sol, arg1, arg2)) {
                    yield qq;
                }
                return;
            }
            if (f_name == "and") {
                for (var qq of this.query_and(stk, sol, arg1, arg2)) {
                    yield qq;
                }
                return;
            }
            if (f_name == "plus") {
                for (var ssk of this.buildIn_add(stk, sol, arg1, arg2))
                    yield ssk;
                //yield this.buildIn_add(stk,sol, arg1, arg2)
                return;
            }
            if (f_name == "minus") {
                for (var ss8 of this.buildIn_minus(stk, sol, arg1, arg2))
                    yield ss8;
                //yield this.buildIn_minus(stk,sol, arg1, arg2)
                return;
            }
            if (f_name == ">") {
                //yield this.buildIn_gt(stk,sol, arg1, arg2)
                for (var ss7 of this.buildIn_gt(stk, sol, arg1, arg2))
                    yield ss7;
                return;
            }
            if (f_name == "<") {
                //yield this.buildIn_lt(stk,sol, arg1, arg2)
                for (var ss5 of this.buildIn_lt(stk, sol, arg1, arg2))
                    yield ss5;
                return;
            }
            if (f_name == ">=") {
                //yield this.buildIn_gt(stk,sol, arg1, arg2)
                for (var ss7 of this.buildIn_gte(stk, sol, arg1, arg2))
                    yield ss7;
                return;
            }
            if (f_name == "<=") {
                //yield this.buildIn_lt(stk,sol, arg1, arg2)
                for (var ss5 of this.buildIn_lte(stk, sol, arg1, arg2))
                    yield ss5;
                return;
            }
            if (f_name == "*") {
                // yield this.buildIn_mul(stk,sol, arg1, arg2)
                for (var ss4 of this.buildIn_mul(stk, sol, arg1, arg2)) {
                    yield ss4;
                }
                return;
            }
            if (f_name == "head") {
                // yield this.buildIn_head(stk,sol, arg1, arg2)
                for (var ss2 of this.buildIn_head(stk, sol, arg1, arg2))
                    yield ss2;
                return;
            }
            if (f_name == "tail") {
                //yield this.buildIn_tail(stk,sol, arg1, arg2)
                for (var ss2 of this.buildIn_tail(stk, sol, arg1, arg2))
                    yield ss2;
                return;
            }
            if (f_name == "maplist") {
                //yield this.buildIn_tail(stk,sol, arg1, arg2)
                for (var ssm of this.buildIn_maplist(stk, sol, arg1, arg2))
                    yield ssm;
                return;
            }
            let hasFound = false;
            let query_satisf = false;
            for (var [i, p] of this.predicades.entries()) {
                // if (query_satisf)  continue
                if (p.entry.name != f_name)
                    continue;
                let pp = p.entry;
                if (pp instanceof atoms_1.GTems.Functor) {
                    hasFound = true;
                    if (pp.args.length != 2)
                        continue;
                    let pa0 = pp.args[0];
                    if (util_1.isArray(pa0))
                        pa0 = pa0[0];
                    let pa1 = pp.args[1];
                    if (util_1.isArray(pa1))
                        pa1 = pa1[0];
                    if (stk.contains(p.unique_name, arg1, arg2))
                        continue; //nao tenta de novo se ja estiver tetando dar query no mesmo predicado e nos mesmo parametros
                    let stk_next = stk.pushCall(p.unique_name, arg1, arg2);
                    //arg1 nao rh uma variavel ..bind o argumento para o valor dela ..senao,bind na saida
                    let sol_next = new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_true(), {});
                    if (this.isVar(arg1) == false) {
                        sol_next = solution_1.Solution.bind(sol_next, pa0, arg1);
                    }
                    if (this.isVar(arg2) == false) {
                        sol_next = solution_1.Solution.bind(sol_next, pa1, arg2);
                    }
                    // testa a condicao de ativacao do predicado
                    let cond_satisf = true;
                    if (util_1.isUndefined(p.condition) == false) {
                        cond_satisf = false;
                        //testa a condicao
                        for (var sol_cond of this.evaluate_query(stk_next, sol_next, p.condition)) {
                            if (solution_1.Solution.isValid(sol_cond)) {
                                cond_satisf = true;
                                break; //apenas a primeira true ja serve
                            }
                        }
                    }
                    if (cond_satisf == false)
                        continue; // nem testa o corpo .. proximo termo
                    if (solution_1.Solution.isValid(sol_next) == false)
                        continue;
                    for (var sol_next_inner of this.evaluate_query(stk_next, sol_next, p.value)) {
                        if (solution_1.Solution.isValid(sol_next_inner) == false)
                            continue;
                        let sol_n = new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_true(), {});
                        sol_n = solution_1.Solution.fuse(sol, sol_n); //just a copy 
                        if (this.isVar(arg1)) //arg1 eh uma variavel ? bind para o resultado 
                         {
                            let v_ret = solution_1.Solution.getValue(sol_next_inner, pa0);
                            if (util_1.isUndefined(v_ret) == false)
                                sol_n = solution_1.Solution.bind(sol_n, v_ret, arg1);
                        }
                        if (solution_1.Solution.isValid(sol_n) == false)
                            continue;
                        if (this.isVar(arg2)) //arg1 eh uma variavel ? bind para o resultado 
                         {
                            let v_ret = solution_1.Solution.getValue(sol_next_inner, pa1);
                            if (util_1.isUndefined(v_ret) == false)
                                sol_n = solution_1.Solution.bind(sol_n, v_ret, arg2);
                        }
                        if (solution_1.Solution.isValid(sol_n) == false)
                            continue;
                        query_satisf = true;
                        let ret = sol_n.add_value(sol_next_inner);
                        if (ret.state == solution_1.Solution.SolutionState.QCut) {
                            ret.state = solution_1.Solution.SolutionState.QTrue;
                            yield ret;
                            return;
                        }
                        else {
                            yield ret;
                        }
                    }
                }
            }
            if (f_name.startsWith("ULS") == false)
                if (hasFound == false) {
                    console.log("Predicate " + f_name + "/2  not found ");
                }
        }
        *query_ar1(stk, sol, f_name, _arg1) {
            let hasY = false;
            for (var s of this.query_ar1_inner(stk, sol, f_name, _arg1)) {
                yield s;
                if (solution_1.Solution.isValid(s))
                    hasY = true;
            }
            if (hasY == false && f_name.startsWith("ULS") == false) {
                for (var sq of this.query_ar1_inner(stk, sol, "ULS" + f_name, _arg1)) {
                    yield sq;
                }
            }
            return;
        }
        *query_ar1_inner(stk, sol, f_name, _arg1) {
            for (var x1 of this.evaluate_query(stk, sol, _arg1)) {
                if (solution_1.Solution.isValid(x1)) {
                    let nsol = solution_1.Solution.fuse(sol, x1);
                    for (var z of this.query_ar1_inner_argv(stk, nsol, f_name, x1.value)) {
                        yield z;
                    }
                }
            }
        }
        *query_ar1_inner_argv(stk, sol, f_name, _arg1) {
            if (util_1.isArray(_arg1))
                _arg1 = _arg1[0];
            let arg1 = _arg1;
            let value_1 = Array.from(this.evaluate_query(stk, sol, _arg1)).filter((x) => solution_1.Solution.isValid(x)).map((c) => c.value);
            if (value_1.length > 1) {
                for (var [i, q_arg1] of value_1.entries()) {
                    for (var r_arg1 of this.query_ar1_inner(stk, sol, f_name, q_arg1))
                        yield r_arg1;
                }
                return;
            }
            if (value_1.length > 0)
                arg1 = value_1[0];
            else
                arg1 = atoms_1.GTems.atom_false();
            //let arg1 = getValue(sol, _arg1)
            //if (isUndefined(arg1)) arg1 = _arg1
            let query_satisf = false;
            let hasFound = false;
            for (var [i, p] of this.predicades.entries()) {
                // if (query_satisf) continue
                if (p.entry.name != f_name)
                    continue;
                let pp = p.entry;
                if (pp instanceof atoms_1.GTems.Functor) {
                    if (pp.args.length != 1)
                        continue;
                    let pa0 = pp.args[0];
                    if (util_1.isArray(pa0))
                        pa0 = pa0[0];
                    hasFound = true;
                    if (stk.contains(p.unique_name, arg1)) {
                        console.log("Block ");
                        continue; //nao tenta de novo se ja estiver tetando dar query no mesmo predicado e nos mesmo parametros
                    }
                    // console.log("pass " ,p.unique_name ,arg1 )  
                    let stk_next = stk.pushCall(p.unique_name, arg1);
                    //arg1 nao rh uma variavel ..bind o argumento para o valor dela ..senao,bind na saida
                    let sol_next = new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_true(), {});
                    if (this.isVar(arg1) == false) {
                        sol_next = solution_1.Solution.bind(sol_next, pa0, arg1);
                    }
                    if (solution_1.Solution.isValid(sol_next) == false)
                        continue;
                    // testa a condicao de ativacao do predicado
                    let cond_satisf = true;
                    if (util_1.isUndefined(p.condition) == false) {
                        cond_satisf = false;
                        //testa a condicao
                        for (var sol_cond of this.evaluate_query(stk_next, sol_next, p.condition)) {
                            if (solution_1.Solution.isValid(sol_cond)) {
                                cond_satisf = true;
                                break; //apenas a primeira true ja serve
                            }
                        }
                    }
                    if (cond_satisf == false)
                        continue; // nem testa o corpo .. proximo termo
                    for (var sol_next_inner of this.evaluate_query(stk_next, sol_next, p.value)) {
                        if (solution_1.Solution.isValid(sol_next_inner) == false)
                            continue;
                        if (this.isVar(arg1) || util_1.isUndefined(arg1)) //arg1 eh uma variavel ? bind para o resultado 
                         {
                            let v_ret = solution_1.Solution.getValue(sol_next_inner, pa0);
                            if (util_1.isUndefined(v_ret) == false) {
                                let sol_n = solution_1.Solution.bind(sol, v_ret, arg1);
                                if (solution_1.Solution.isValid(sol_n)) {
                                    sol_n.value = sol_next_inner.value;
                                    query_satisf = true;
                                    //yield sol_n
                                    let ret = sol_n;
                                    if (ret.state == solution_1.Solution.SolutionState.QCut) {
                                        ret.state = solution_1.Solution.SolutionState.QTrue;
                                        yield ret;
                                        return;
                                    }
                                    else {
                                        yield ret;
                                    }
                                }
                            }
                            else {
                                //valor do argumento continua sem binding .... mas a saida eh valida
                                query_satisf = true;
                                let ret = sol.add_value(sol_next_inner);
                                if (ret.state == solution_1.Solution.SolutionState.QCut) {
                                    ret.state = solution_1.Solution.SolutionState.QTrue;
                                    yield ret;
                                    return;
                                }
                                else {
                                    yield ret;
                                }
                                //yield sol.add_value(sol_next_inner.value)
                            }
                        }
                        else {
                            query_satisf = true;
                            let ret = sol.add_value(sol_next_inner);
                            if (ret.state == solution_1.Solution.SolutionState.QCut) {
                                ret.state = solution_1.Solution.SolutionState.QTrue;
                                yield ret;
                                return;
                            }
                            else {
                                yield ret;
                            }
                            //yield sol.add_value(sol_next_inner.value)
                        }
                    }
                }
            }
            //yield new Solution.Solution(Solution.SolutionState.QFalse, GTems.atom_false(), {})
            if (f_name.startsWith("ULS") == false)
                if (hasFound == false) {
                    console.log("Predicate " + f_name + "/1  not found ");
                }
        }
    } //class
    Interp.Context = Context;
})(Interp = exports.Interp || (exports.Interp = {})); //namespace
//# sourceMappingURL=interp.js.map