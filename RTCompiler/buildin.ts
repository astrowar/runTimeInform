import { GTems } from './atoms'
import { Solution } from './solution'
import { isUndefined, isArray, isObject } from 'util'
import { QueryStack as QS } from './querystack'
import { ContextBase } from './contextBase'

import QueryStack = QS.QueryStack

export namespace BuildIns {
    //buildIn Predicates

    function isVar(v: GTems.GBase): boolean {
        if (v instanceof GTems.Variable) {
            return true
        }
        return false
    }

    function warring(x) {}

    export function* buildIn_arith_op(
        ctx: ContextBase,
        stk: QueryStack,
        sol: Solution.Solution,
        arg1: GTems.GBase,
        arg2: GTems.GBase,
        f
    ) {
        //arg1 nao rh uma variavel ..bind o argumento para o valor dela ..senao,bind na saida
        let sol_next = new Solution.Solution(
            Solution.SolutionState.QTrue,
            GTems.atom_true(),
            {}
        )
        if (isVar(arg1))
            new Solution.Solution(
                Solution.SolutionState.QFalse,
                GTems.atom_false(),
                {}
            )
        if (isVar(arg2))
            new Solution.Solution(
                Solution.SolutionState.QFalse,
                GTems.atom_false(),
                {}
            )
        for (var v1 of ctx.evaluate_query(stk, sol, arg1)) {
            if (Solution.isValid(v1) == false) continue
            for (var v2 of ctx.evaluate_query(stk, sol, arg2)) {
                if (Solution.isValid(v2) == false) continue
                if (v1.value instanceof GTems.LiteralNumber) {
                    if (v2.value instanceof GTems.LiteralNumber) {
                        let z = f(v1.value.value, v2.value.value)
                        {
                            yield new Solution.Solution(
                                Solution.SolutionState.QTrue,
                                new GTems.LiteralNumber(z),
                                {}
                            )
                        }
                    }
                }
            }
        }
    }

    export function* buildIn_binary_op(
        ctx: ContextBase,
        stk: QueryStack,
        sol: Solution.Solution,
        arg1: GTems.GBase,
        arg2: GTems.GBase,
        f
    ) {
        //arg1 nao rh uma variavel ..bind o argumento para o valor dela ..senao,bind na saida
        let sol_next = new Solution.Solution(
            Solution.SolutionState.QTrue,
            GTems.atom_true(),
            {}
        )
        if (isVar(arg1))
            new Solution.Solution(
                Solution.SolutionState.QFalse,
                GTems.atom_false(),
                {}
            )
        if (isVar(arg2))
            new Solution.Solution(
                Solution.SolutionState.QFalse,
                GTems.atom_false(),
                {}
            )
        for (var v1 of ctx.evaluate_query(stk, sol, arg1)) {
            if (Solution.isValid(v1) == false) continue
            for (var v2 of ctx.evaluate_query(stk, sol, arg2)) {
                if (Solution.isValid(v2) == false) continue
                let z = f(v1.value, v2.value)
                {
                    if (isUndefined(z) == false)
                        yield new Solution.Solution(
                            Solution.SolutionState.QTrue,
                            z,
                            {}
                        )
                }
            }
        }
    }

    export function* buildIn_cmp_op(
        ctx: ContextBase,
        stk: QueryStack,
        sol: Solution.Solution,
        arg1: GTems.GBase,
        arg2: GTems.GBase,
        f
    ) {
        //arg1 nao rh uma variavel ..bind o argumento para o valor dela ..senao,bind na saida
        let sol_next = new Solution.Solution(
            Solution.SolutionState.QTrue,
            GTems.atom_true(),
            {}
        )
        if (isVar(arg1))
            new Solution.Solution(
                Solution.SolutionState.QFalse,
                GTems.atom_false(),
                {}
            )
        if (isVar(arg2))
            new Solution.Solution(
                Solution.SolutionState.QFalse,
                GTems.atom_false(),
                {}
            )
        for (var v1 of ctx.evaluate_query(stk, sol, arg1)) {
            for (var v2 of ctx.evaluate_query(stk, sol, arg2)) {
                if (v1.value instanceof GTems.LiteralNumber) {
                    if (v2.value instanceof GTems.LiteralNumber) {
                        if (f(v1.value.value, v2.value.value)) {
                            yield new Solution.Solution(
                                Solution.SolutionState.QTrue,
                                new GTems.LiteralBool(true),
                                {}
                            )
                        } else {
                            yield new Solution.Solution(
                                Solution.SolutionState.QTrue,
                                new GTems.LiteralBool(false),
                                {}
                            )
                        }
                    }
                }
            }
        }
        return new Solution.Solution(
            Solution.SolutionState.QFalse,
            GTems.atom_false(),
            {}
        )
    }

    export function* buildIn_gte(
        ctx: ContextBase,
        stk: QueryStack,
        sol: Solution.Solution,
        arg1: GTems.GBase,
        arg2: GTems.GBase
    ) {
        for (var vv of buildIn_cmp_op(ctx, stk, sol, arg1, arg2, (x1, x2) => {
            return x1 >= x2
        }))
            yield vv
    }
    export function* buildIn_lte(
        ctx: ContextBase,
        stk: QueryStack,
        sol: Solution.Solution,
        arg1: GTems.GBase,
        arg2: GTems.GBase
    ) {
        for (var vv of buildIn_cmp_op(ctx, stk, sol, arg1, arg2, (x1, x2) => {
            return x1 <= x2
        }))
            yield vv
    }

    export function* buildIn_lt(
        ctx: ContextBase,
        stk: QueryStack,
        sol: Solution.Solution,
        arg1: GTems.GBase,
        arg2: GTems.GBase
    ) {
        for (var vv of buildIn_cmp_op(ctx, stk, sol, arg1, arg2, (x1, x2) => {
            return x1 < x2
        }))
            yield vv
    }

    export function* buildIn_gt(
        ctx: ContextBase,
        stk: QueryStack,
        sol: Solution.Solution,
        arg1: GTems.GBase,
        arg2: GTems.GBase
    ) {
        for (var vv of buildIn_cmp_op(ctx, stk, sol, arg1, arg2, (x1, x2) => {
            return x1 > x2
        }))
            yield vv
    }

    export function* buildIn_mul(
        ctx: ContextBase,
        stk: QueryStack,
        sol: Solution.Solution,
        arg1: GTems.GBase,
        arg2: GTems.GBase
    ) {
        for (var vv of buildIn_arith_op(ctx, stk, sol, arg1, arg2, (x1, x2) => {
            return x1 * x2
        }))
            yield vv
    }

    export function* buildIn_add(
        ctx: ContextBase,
        stk: QueryStack,
        sol: Solution.Solution,
        arg1: GTems.GBase,
        arg2: GTems.GBase
    ) {
        for (var vv of buildIn_binary_op(
            ctx,
            stk,
            sol,
            arg1,
            arg2,
            (x1, x2) => {
                if (x1 instanceof GTems.LiteralStr)
                    if (x2 instanceof GTems.LiteralStr) {
                        return new GTems.LiteralStr(x1.value + x2.value)
                    }
                if (x1 instanceof GTems.LiteralNumber)
                    if (x2 instanceof GTems.LiteralNumber) {
                        return new GTems.LiteralNumber(x1.value + x2.value)
                    }

                return undefined
            }
        ))
            yield vv
    }
    export function* buildIn_minus(
        ctx: ContextBase,
        stk: QueryStack,
        sol: Solution.Solution,
        arg1: GTems.GBase,
        arg2: GTems.GBase
    ) {
        for (var vv of buildIn_arith_op(ctx, stk, sol, arg1, arg2, (x1, x2) => {
            return x1 - x2
        }))
            yield vv
    }
    export function* buildIn_div(
        ctx: ContextBase,
        stk: QueryStack,
        sol: Solution.Solution,
        arg1: GTems.GBase,
        arg2: GTems.GBase
    ) {
        for (var vv of buildIn_arith_op(ctx, stk, sol, arg1, arg2, (x1, x2) => {
            return x1 / x2
        }))
            yield vv
    }

    export function* buildIn_mod(
        ctx: ContextBase,
        stk: QueryStack,
        sol: Solution.Solution,
        arg1: GTems.GBase,
        arg2: GTems.GBase
    ) {
        for (var vv of buildIn_arith_op(ctx, stk, sol, arg1, arg2, (x1, x2) => {
            return x1 % x2
        }))
            yield vv
    }

    export function* buildIn_head(
        ctx: ContextBase,
        stk: QueryStack,
        sol: Solution.Solution,
        arg1: GTems.GBase,
        arg2: GTems.GBase
    ) {
        //arg1 nao rh uma variavel ..bind o argumento para o valor dela ..senao,bind na saida
        let sol_next = new Solution.Solution(
            Solution.SolutionState.QTrue,
            GTems.atom_true(),
            {}
        )
        // if (isVar(arg1)) new Solution.Solution(Solution.SolutionState.QFalse, GTems.atom_false(), {})
        if (isVar(arg2)) {
            warring('head of a unbound variable is not possible')
            // yield new Solution.Solution(Solution.SolutionState.QFalse, GTems.atom_false(), {})
        }

        if (arg2 instanceof GTems.GList) {
            if (arg2.items.length > 0) {
                let head = arg2.items[0]
                let ss2 = ctx.bind(sol, head, arg1)
                yield ss2
            }
        }
        // return new Solution.Solution(Solution.SolutionState.QFalse, GTems.atom_false(), {})
    }

    export function* buildIn_tail(
        ctx: ContextBase,
        stk: QueryStack,
        sol: Solution.Solution,
        arg1: GTems.GBase,
        arg2: GTems.GBase
    ) {
        //arg1 nao rh uma variavel ..bind o argumento para o valor dela ..senao,bind na saida
        let sol_next = new Solution.Solution(
            Solution.SolutionState.QTrue,
            GTems.atom_true(),
            {}
        )
        // if (isVar(arg1)) new Solution.Solution(Solution.SolutionState.QFalse, GTems.atom_false(), {})
        if (isVar(arg2)) {
            ctx.warring('tail of a unbound variable is not possible')
            //yield new Solution.Solution(Solution.SolutionState.QFalse, GTems.atom_false(), {})
        }
        if (arg2 instanceof GTems.GList) {
            if (arg2.items.length > 0) {
                let tail = arg2.clone()
                tail.items.shift()
                let s = ctx.bind(sol, tail, arg1)
                yield s
            }
        }
        //return new Solution.Solution(Solution.SolutionState.QFalse, GTems.atom_false(), {})
    }

    export function* buildIn_atom_string(
        ctx: ContextBase,
        stk: QueryStack,
        sol: Solution.Solution,
        arg1: GTems.GBase,
        arg2: GTems.GBase
    ) {
        let sol_next = new Solution.Solution(
            Solution.SolutionState.QTrue,
            GTems.atom_true(),
            {}
        )

        if (arg1 instanceof GTems.Atom && arg2 instanceof GTems.Variable) {
            let s1 = new GTems.LiteralStr(arg1.name)
            yield ctx.bind(sol_next, arg2, s1)
            return
        }

        if (
            arg1 instanceof GTems.Variable &&
            arg2 instanceof GTems.LiteralStr
        ) {
            let s2 = new GTems.Atom(arg2.value)
            yield ctx.bind(sol_next, arg1, s2)
            return
        }

        if (arg1 instanceof GTems.Atom && arg2 instanceof GTems.LiteralStr) {
            if (arg1.name == arg2.value) {
                yield new Solution.Solution(
                    Solution.SolutionState.QTrue,
                    GTems.atom_true(),
                    {}
                )
            } else {
                yield new Solution.Solution(
                    Solution.SolutionState.QFalse,
                    GTems.atom_false(),
                    {}
                )
            }
            return
        }

        throw new Error('invalid argument for atom_string')
    }

    export function* buildIn_member(
        ctx: ContextBase,
        stk: QueryStack,
        sol: Solution.Solution,
        arg1: GTems.GBase,
        arg2: GTems.GBase
    ) {
        let sol_next = new Solution.Solution(
            Solution.SolutionState.QTrue,
            GTems.atom_true(),
            {}
        )

        if (arg2 instanceof GTems.GList) {
            for (var i = 0; i < arg2.items.length; i++) {
                let r = ctx.bind(sol_next, arg2.items[i], arg1)
                if (Solution.isValid(r)) {
                    yield r
                }
            }
            return
        }
        throw new Error(
            'invalid argument for member, segond arg must be a list'
        )
    }

    export function* buildIn_random_member(
        ctx: ContextBase,
        stk: QueryStack,
        sol: Solution.Solution,
        arg1: GTems.GBase,
        arg2: GTems.GBase
    ) {
        let getRandomInt = function(min, max) {
            min = Math.ceil(min)
            max = Math.floor(max)
            return Math.floor(Math.random() * (max - min)) + min
        }

        let sol_next = new Solution.Solution(
            Solution.SolutionState.QTrue,
            GTems.atom_true(),
            {}
        )

        if (arg2 instanceof GTems.GList) {
            let i = getRandomInt(0, arg2.items.length)
            {
                let r = ctx.bind(sol_next, arg2.items[i], arg1)
                if (Solution.isValid(r)) {
                    yield r
                }
            }
            return
        }
        throw new Error(
            'invalid argument for member, segond arg must be a list'
        )
    }

    export function* buildIn_nextto(
        ctx: ContextBase,
        stk: QueryStack,
        sol: Solution.Solution,
        arg1: GTems.GBase,
        arg2: GTems.GBase,
        arg3: GTems.GBase
    ) {
        let sol_next = new Solution.Solution(
            Solution.SolutionState.QTrue,
            GTems.atom_true(),
            {}
        )
        if (arg3 instanceof GTems.GList) {
            for (var i = 0; i <= arg3.items.length - 1; i++) {
                let x1 = arg3.items[i]
                let r = ctx.bind(sol_next, x1, arg1)
                if (Solution.isValid(r)) {
                    let r2 = ctx.bind(r, arg3.items[i + 1], arg2)
                    if (Solution.isValid(r2)) {
                        yield r2
                    }
                }
            }
        }
    }

    export function* buildIn_append(
        ctx: ContextBase,
        stk: QueryStack,
        sol: Solution.Solution,
        arg1: GTems.GBase,
        arg2: GTems.GBase,
        arg3: GTems.GBase
    ) {
        let sol_next = new Solution.Solution(
            Solution.SolutionState.QTrue,
            GTems.atom_true(),
            {}
        )

        if (arg1 instanceof GTems.GList) {
            if (arg2 instanceof GTems.GList) {
                let qs = arg1.items.concat(arg2.items)
                let ql = new GTems.GList(qs)
                let r = ctx.bind(sol_next, ql, arg3)
                yield r
                return
            }
        }

        if (arg3 instanceof GTems.GList) {
            if (arg1 instanceof GTems.Variable && arg2 instanceof GTems.GList) {
                if (arg2.items.length > arg3.items.length) return

                let nlast = arg2.items.length
                let q2 = new GTems.GList(arg3.items.slice(nlast))
                let r = ctx.bind(sol_next, q2, arg2)
                if (Solution.isValid(r)) {
                    let q1 = new GTems.GList(arg3.items.slice(0, nlast))
                    yield ctx.bind(r, q1, arg1)
                }
            }

            if (arg1 instanceof GTems.GList && arg2 instanceof GTems.Variable) {
                if (arg1.items.length > arg3.items.length) return

                let nlast = arg3.items.length - arg1.items.length
                let q1 = new GTems.GList(arg3.items.slice(0, arg1.items.length))
                let q2 = new GTems.GList(arg3.items.slice(nlast))
                let r = ctx.bind(sol_next, q1, arg1)
                if (Solution.isValid(r)) {
                    yield ctx.bind(r, q2, arg2)
                }
            }

            if (
                arg1 instanceof GTems.Variable &&
                arg2 instanceof GTems.Variable
            ) {
                for (var i = 0; i <= arg3.items.length; i++) {
                    let q1 = new GTems.GList(arg3.items.slice(0, i))
                    let q2 = new GTems.GList(arg3.items.slice(i))
                    let r = ctx.bind(sol_next, q1, arg1)
                    if (Solution.isValid(r)) {
                        let r2 = ctx.bind(r, q2, arg2)
                        yield r2
                    }
                }
            }

            return
        }

        throw new Error('invalid arguments')
    }

    export function* buildIn_ht(
        ctx: ContextBase,
        stk: QueryStack,
        sol: Solution.Solution,
        arg1: GTems.GBase,
        arg2: GTems.GBase,
        arg3: GTems.GBase
    ) {
        let sol_next = new Solution.Solution(
            Solution.SolutionState.QTrue,
            GTems.atom_true(),
            {}
        )

        if (arg3 instanceof GTems.GList) {
            if (arg3.items.length > 0) {
                let t: GTems.GList = arg3.clone()
                let h: GTems.GBase = t.items[0]
                t.items.shift()
                let s = ctx.bind(sol, t, arg2)
                s = ctx.bind(s, h, arg1)
                yield s
            }
            return
        }

        if (arg3 instanceof GTems.Variable)
            if (arg2 instanceof GTems.GList) {
                let nlist1 = new GTems.GList([arg1])
                for (var v of buildIn_append(ctx, stk, sol, nlist1, arg2, arg3))
                    yield v
                return
            }
        return
        throw new Error('invalid arguments')
    }

    export function* buildIn_maplist(
        ctx: ContextBase,
        stk: QueryStack,
        sol: Solution.Solution,
        arg1: GTems.GBase,
        arg2: GTems.GBase
    ) {
        let sol_next = new Solution.Solution(
            Solution.SolutionState.QTrue,
            GTems.atom_true(),
            {}
        )
        if (isVar(arg1)) {
            ctx.warring('maplist of a unbound predicate is not possible')
            yield new Solution.Solution(
                Solution.SolutionState.QFalse,
                GTems.atom_false(),
                {}
            )
        }
        if (isVar(arg2)) {
            ctx.warring(' maplist of a unbound input list is not possible')
            yield new Solution.Solution(
                Solution.SolutionState.QFalse,
                GTems.atom_false(),
                {}
            )
        }
        if (arg1 instanceof GTems.Atom) {
            if (arg2 instanceof GTems.GList) {
                for (var qs of ctx.apply_rec(
                    stk,
                    sol,
                    [],
                    arg2.items,
                    arg1.name
                ))
                    yield new Solution.Solution(
                        Solution.SolutionState.QTrue,
                        new GTems.GList(qs),
                        {}
                    )
            }
        }
    }
}
