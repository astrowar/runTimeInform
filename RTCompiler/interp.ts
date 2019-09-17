import { GTems } from "./atoms";
import { BADQUERY } from "dns";
import { isUndefined, isArray } from "util";

export namespace Interp {

    class PredicateEntry {
        constructor(public entry: GTems.Functor | GTems.Atom, public value: GTems.GBase) {

        }
    }

    // a clause foi provada .. foi disprovada
    // ou nao da para responder
    export enum SolutionState {
        QTrue,
        QFalse,
        QUndefined
    }

    export class Solution {
        public state: SolutionState = SolutionState.QUndefined
        public var_values: { [name: string]: GTems.GBase } = {}
        constructor(state: SolutionState, var_values) {
            this.state = state
            this.var_values = var_values
        }

        add(var_name: string, value: GTems.GBase): Solution {
            let nsol = new Solution(this.state, {})

            for (var i in this.var_values) {
                nsol.var_values[i] = this.var_values[i]
            }
            nsol.var_values[var_name] = value

            return nsol
        }
    }



    function fuseSolution(a: Solution, b: Solution) {
        if (a.state == SolutionState.QFalse) return a
        if (b.state == SolutionState.QFalse) return b

        let s = new Solution(a.state, [])

        for (var i in a.var_values) {
            s.var_values[i] = a.var_values[i]
        }
        for (var i in b.var_values) {
            s.var_values[i] = b.var_values[i]
        }

        return s
    }


    class SolutionGroup {
        public solution: Solution[] = []

    }

    function isEqually(x: GTems.GBase, y: GTems.GBase) {
        let s1 = x.toString()
        let s2 = y.toString()
        if (s1 == s2) return true
        return false;
    }

    function isEquallyNumber(x: GTems.LiteralNumber, y: GTems.LiteralNumber) {
        
        if (x.value == y.value) return true
        return false;
    }

    //retorna o valor da variavel em questao .. retorna ATOM ou undefined
    function getBindValue(sol: Solution, x: GTems.Variable): GTems.GBase {
        let v = getBindTail(sol, x)
        return getBindVarValue(sol, v)

    }

    function getValue(sol: Solution, x: GTems.GBase): GTems.GBase {
        if (x instanceof GTems.Variable) {
            {
                let v = getBindTail(sol, x)
                return getBindVarValue(sol, v)
            }
        }
        return x

    }

    function getBindVarValue(sol: Solution, x: GTems.Variable): GTems.GBase {
        for (var i in sol.var_values) {
            if (i == x.name) {
                let value_bind: GTems.GBase = sol.var_values[i]
                if (value_bind instanceof GTems.Variable) {
                    return undefined
                }
                else {
                    return value_bind
                }
            }
        }
        return undefined
    }

    function getBindTail(sol: Solution, x: GTems.Variable, deep = 0): GTems.Variable {
        if (deep > 300) return x
        for (var i in sol.var_values) {
            if (i == x.name) {
                let value_bind: GTems.GBase = sol.var_values[i]
                if (value_bind instanceof GTems.Variable) {
                    if (value_bind.name == x.name) return x // fundo do poco .. eu mesmo
                    return getBindTail(sol, value_bind, deep + 1)
                }
                else {
                    return x //esta anexado ao bind de uma variable
                }
            }
        }
        return x //nao tem bind
    }

    function bindVar(sol: Solution, x: GTems.Variable, y: GTems.GBase): Solution {
        if (y instanceof GTems.Variable) {
            return bindVarVar(sol, x, y)
        }

        // bind da variavel e retorna nova solucao derivada 
        let xx: GTems.Variable = getBindTail(sol, x)

        let value_binded = getBindVarValue(sol, xx)
        if (isUndefined(value_binded)) {
            let vname: string = xx.name
            return sol.add(vname, y)
        }

        if (isEqually(value_binded, y)) {
            return sol;
        }
        return new Solution(SolutionState.QFalse, {})
    }


    function bindVarVar(sol: Solution, x: GTems.Variable, y: GTems.Variable): Solution {



        let xx: GTems.Variable = getBindTail(sol, x)
        let yy: GTems.Variable = getBindTail(sol, y)

        let x_value = getBindVarValue(sol, xx)
        let y_value = getBindVarValue(sol, yy)

        if (isUndefined(x_value)) {
            return sol.add(xx.name, y)
        }

        if (isUndefined(y_value)) {
            return sol.add(yy.name, x)
        }

        //nenhum dos ois eh indefinido 

        if (isEqually(x_value, y_value)) {
            return sol;
        }
        return new Solution(SolutionState.QFalse, {})
    }




    export function bind(sol: Solution, x: GTems.GBase, y: GTems.GBase) {
        if (sol.state == SolutionState.QFalse) return sol //nem tenta

        if (isArray(y)) return bind(sol, x, y[0])
        if (isArray(x)) return bind(sol, x[0], y)

            if (x instanceof GTems.LiteralNumber) 
            {
                if (y instanceof GTems.LiteralNumber) {
                    if (isEquallyNumber(x, y))
                        return sol
                    else
                        return new Solution(SolutionState.QFalse, {})
                }
            } 



            if (x instanceof GTems.GValue) {
                if (y instanceof GTems.Variable) {
                    return bindVar(sol, y, x)
                }
            }

            if (x instanceof GTems.Variable) {
                if (y instanceof GTems.GValue) {
                    return bindVar(sol, x, y)
                }
            }



        if (x instanceof GTems.Atom) {
            if (y instanceof GTems.Atom) {
                if (isEqually(x, y))
                    return sol
                else
                    return new Solution(SolutionState.QFalse, {})
            }

     

            if (y instanceof GTems.Variable) {
                return bindVar(sol, y, x)
            }
        }

        if (x instanceof GTems.Variable) {
            if (y instanceof GTems.Atom) {
                return bindVar(sol, x, y)
            }

            if (y instanceof GTems.Variable) {
                return bindVarVar(sol, y, x)
            }
        }

        return new Solution(SolutionState.QFalse, {})
    }


    export class Context {
        //predicades: GTems.Functor[] = []
        values: GTems.Atom[] = []

        predicades: PredicateEntry[] = []

        public addPredicateFunc(p: GTems.Functor, code: any, condition: any): boolean {
            this.predicades.push(new PredicateEntry(p, code))
            //console.dir(code, { depth: null })
            return true
        }


        isVar(v: GTems.GBase): boolean {
            if (v instanceof GTems.Variable) {
                return true
            }
            return false
        }

        addPredicateAtom(v: GTems.Atom) {
            this.values.push(v)
        }


        public *query_and(sol: Solution, q1: GTems.GBase, q2: GTems.GBase) {

            for (var qq of this.query(sol, q1)) {
                if ((<Solution>qq).state == SolutionState.QTrue) {
                    for (var qz of this.query(sol, q2)) {
                        if ((<Solution>qz).state == SolutionState.QTrue) {
                            yield fuseSolution(qq, qz)
                        }
                    }
                }
            }
        }
        public all_query(q: GTems.GBase) {

            let sol = new Solution(SolutionState.QTrue, {})

            let r = []
            for (var qz of this.query(sol, q)) {
                if ((<Solution>qz).state == SolutionState.QTrue) {
                    r.push(qz)
                }
            }
            // console.log("solutions:")
            // console.dir( r, { depth: null })
            return r
        }

        public *query(sol: Solution, q: GTems.GBase) {

            // console.log("...")
            // console.dir(q, { depth: null })



            if (q instanceof GTems.Functor) {
                if (q.name == "and") {
                    for (var qq of this.query_and(sol, q.args[0], q.args[1])) yield qq

                    return
                }
                if (q.args.length == 1) {
                    for (var qx of this.query_ar1(sol, q.name, q.args[0])) yield qx

                }
                if (q.args.length == 2) {
                    for (var qy of this.query_ar2(sol, q.name,q.args[0], q.args[1])) yield qy 
                }

            }

            if (q instanceof GTems.Atom) {
                if (q.name == "true") yield new Solution(SolutionState.QTrue, {})
                if (q.name == "false") yield new Solution(SolutionState.QFalse, {})
                if (q.name == "fail") yield new Solution(SolutionState.QFalse, {})
                yield new Solution(SolutionState.QFalse, {}) //fail
            }

        }


        *evaluate_query(sol: Solution, code: GTems.GBase) {

            for (var qin of this.query(sol, code)) {
                let fsol = fuseSolution(sol, qin)
                if (fsol.state == SolutionState.QTrue) {
                    yield fsol;
                }
            }
        }



 //buildIn Predicates

buildIn_add(sol: Solution, arg1: GTems.GBase, arg2: GTems.GBase){
                    //arg1 nao rh uma variavel ..bind o argumento para o valor dela ..senao,bind na saida
                    let sol_next = new Solution(SolutionState.QTrue, {})
                    if (this.isVar(arg1) ) new Solution(SolutionState.QFalse, {})
                    if (this.isVar(arg2) ) new Solution(SolutionState.QFalse, {})

                   if ( arg1 instanceof GTems.LiteralNumber )
                   {
                   if ( arg2 instanceof GTems.LiteralNumber )
                   {
                       return new GTems.LiteralNumber(   arg1.value + arg2.value )
                   }
                }
                return  new Solution(SolutionState.QFalse, {})  
            }





//general call


        *query_ar2(sol: Solution, f_name: string, _arg1: GTems.GBase, _arg2: GTems.GBase) {
            if (isArray(_arg1)) _arg1 = _arg1[0]
            if (isArray(_arg2)) _arg2 = _arg2[0]

            let arg1 = getValue(sol, _arg1)
            let arg2 = getValue(sol, _arg2)

            if (isUndefined(arg1)) arg1 = _arg1
            if (isUndefined(arg2)) arg2 = _arg2


            for (var [i, p] of this.predicades.entries()) {
                if (p.entry.name != f_name) continue
                let pp = p.entry;
                if (pp instanceof GTems.Functor) {
                    if (pp.args.length != 2) continue
                    let pa0 = pp.args[0]
                    if (isArray(pa0)) pa0 = pa0[0]

                    let pa1 = pp.args[1]
                    if (isArray(pa1)) pa1 = pa1[0] 

                    //arg1 nao rh uma variavel ..bind o argumento para o valor dela ..senao,bind na saida
                    let sol_next = new Solution(SolutionState.QTrue, {})
                    if (this.isVar(arg1) == false) { sol_next = bind(sol_next, pa0, arg1) }
                    if (this.isVar(arg2) == false) { sol_next = bind(sol_next, pa1, arg2) }

                    if (sol_next.state != SolutionState.QTrue) continue
                    for (var sol_next_inner of this.evaluate_query(sol_next, p.value)) {
                        if (sol_next_inner.state != SolutionState.QTrue) continue

                        let sol_n = new Solution(SolutionState.QTrue, {})
                        sol_n = fuseSolution(sol, sol_n) //just a copy 
                        if (this.isVar(arg1))  //arg1 eh uma variavel ? bind para o resultado 
                        {
                            let v_ret = getValue(sol_next_inner, pa0)
                            if (isUndefined(v_ret) == false) sol_n = bind(sol_n, v_ret, arg1)
                        }
                        if (sol_n.state != SolutionState.QTrue) continue
                        if (this.isVar(arg2))  //arg1 eh uma variavel ? bind para o resultado 
                        {
                            let v_ret = getValue(sol_next_inner, pa1)
                            if (isUndefined(v_ret) == false) sol_n = bind(sol_n, v_ret, arg2)
                        }
                        if (sol_n.state != SolutionState.QTrue) continue
                        yield sol_n
                    }
                }
            }
        }





        public *query_ar1(sol: Solution, f_name: string, _arg1: GTems.GBase) {



            if (isArray(_arg1)) _arg1 = _arg1[0]
            let arg1 = getValue(sol, _arg1)

            if (isUndefined(arg1)) arg1 = _arg1

            for (var [i, p] of this.predicades.entries()) {
                if (p.entry.name != f_name) continue
                let pp = p.entry;
                if (pp instanceof GTems.Functor) {
                    if (pp.args.length != 1) continue
                    let pa0 = pp.args[0]
                    if (isArray(pa0)) pa0 = pa0[0]


                    //arg1 nao rh uma variavel ..bind o argumento para o valor dela ..senao,bind na saida
                    let sol_next = new Solution(SolutionState.QTrue, {})
                    if (this.isVar(arg1) == false) { sol_next = bind(sol_next, pa0, arg1) }

                    if (sol_next.state != SolutionState.QTrue) continue
                    for (var sol_next_inner of this.evaluate_query(sol_next, p.value)) {
                        if (sol_next_inner.state != SolutionState.QTrue) continue

                        if (this.isVar(arg1) || isUndefined(arg1))  //arg1 eh uma variavel ? bind para o resultado 
                        {
                            let v_ret = getValue(sol_next_inner, pa0)
                            if (isUndefined(v_ret) == false) {
                                let sol_n = bind(sol, v_ret, arg1)
                                if (sol_n.state == SolutionState.QTrue) {
                                    yield sol_n
                                }
                            }
                            else {
                                //valor do argumento continua sem binding .... mas a saida eh valida
                                yield sol
                            }
                        }
                        else {
                            yield sol
                        }
                    }
                }
            }
        }




    } //class
} //namespace




