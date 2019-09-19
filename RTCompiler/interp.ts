import { GTems } from "./atoms";
import { BADQUERY } from "dns";
import { isUndefined, isArray } from "util";

export namespace Interp {

    class PredicateEntry {
        constructor(public entry: GTems.Functor | GTems.Atom, public value: GTems.GBase,public condition: GTems.GBase) {

        }
    }

    // a clause foi provada .. foi disprovada
    // ou nao da para responder
    export enum SolutionState {
        QTrue,
        QFalse,
        QFail,
        QUndefined
    }


    function atom_false() { return new GTems.LiteralBool(false) }
    function atom_true() { return new GTems.LiteralBool(true) }

    export class Solution {
        public state: SolutionState = SolutionState.QUndefined
        public var_values: { [name: string]: GTems.GBase } = {}
        public value: GTems.GBase = undefined
        constructor(state: SolutionState, value: GTems.GBase, var_values) {
            this.state = state
            this.var_values = var_values
            this.value = value

            if ((value  instanceof GTems.GBase) ==false )
            {
                throw new Error('invalid value term');
            }
        }

        add(var_name: string, value: GTems.GBase): Solution {
            let nsol = new Solution(this.state, this.value, {})

            for (var i in this.var_values) {
                nsol.var_values[i] = this.var_values[i]
            }
            nsol.var_values[var_name] = value

            return nsol
        }

        add_value(value: GTems.GBase): Solution {
            let nsol = new Solution(this.state, value, {})
            for (var i in this.var_values) {
                nsol.var_values[i] = this.var_values[i]
            }
            return nsol
        }

        toString() : string 
        {
          let s = this.value.toString()
          s += " { "
          for(var kv in this.var_values)
          {
              s += kv.toString() +":"+ this.var_values[kv].toString()+ " "
          }
          s += " } "
          return s
        }
    }


    //mantem o segundo termo como valor
    function fuseSolution(a: Solution, b: Solution) {
        if (a.state == SolutionState.QFalse) return a
        if (b.state == SolutionState.QFalse) return b

        let s = new Solution(b.state, b.value, [])

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
        return new Solution(SolutionState.QFalse, atom_false(), {})
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
        return new Solution(SolutionState.QFalse, atom_false(), {})
    }




    export function bind(sol: Solution, x: GTems.GBase, y: GTems.GBase) {
        if (sol.state == SolutionState.QFalse) return sol //nem tenta

        if (isArray(y)) return bind(sol, x, y[0])
        if (isArray(x)) return bind(sol, x[0], y)

        if (x instanceof GTems.LiteralNumber) {
            if (y instanceof GTems.LiteralNumber) {
                if (isEquallyNumber(x, y))
                    return sol
                else
                    return new Solution(SolutionState.QFalse, atom_false(), {})
            }
        }

        if (x instanceof GTems.GList) {
            if (y instanceof GTems.GList)     {
                    if (x.items.length!= y.items.length)return new Solution(SolutionState.QFalse, atom_false(), {})
                     let sol_n = fuseSolution(sol,new Solution(SolutionState.QTrue, atom_true(), {}) )
                     let n = x.items.length 
                     for(var i =0;i<n;++i){
                         sol_n =  bind( sol_n, x.items[i], y.items[i])
                         if (sol_n.state != SolutionState.QTrue) break
                     }
                     return sol_n                
            }
        }

        

        if (x instanceof GTems.LiteralBool) {
            if (y instanceof GTems.LiteralBool) {
                if ( x.value == y.value)
                    return sol
                else
                    return new Solution(SolutionState.QFalse, atom_false(), {})
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
                    return new Solution(SolutionState.QFalse, atom_false(), {})
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

 

        return new Solution(SolutionState.QFalse, atom_false(), {})
    }


    export class Context {
        //predicades: GTems.Functor[] = []
        values: GTems.Atom[] = []

        predicades: PredicateEntry[] = []

        public addPredicateFunc(p: GTems.Functor, code: any, condition: any): boolean {
            this.predicades.push(new PredicateEntry(p, code,condition))
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


   

        public *query_append(sol: Solution, q1: GTems.GBase, q2: GTems.GBase) 
        {
            if (q1 instanceof GTems.GList) 
            {
                let qcopy   = q1.clone()
                qcopy.items.push( q2)                

                yield fuseSolution(sol , new Solution(SolutionState.QTrue,   qcopy , {}))
                return
            }
          return
        }


        public *query_and(sol: Solution, q1: GTems.GBase, q2: GTems.GBase) {
            for (var qq of this.evaluate_query(sol, q1)) {
                let qsol =<Solution>qq
                if (qsol.state == SolutionState.QTrue) {                 
                    let v = qsol.value
                    if (v instanceof GTems.LiteralBool) {
                        if (v.value == false) {
                            yield new Solution(SolutionState.QFalse, atom_false(), {})
                            continue; //nem tenta o segundo termo
                        }                        
                    }
                    for (var qz of this.evaluate_query(qsol, q2)) {
                        if ((<Solution>qz).state == SolutionState.QTrue) {
                            yield fuseSolution(qq, qz)
                        }
                    }
                }
            }
        }


        public *query_or(sol: Solution, q1: GTems.GBase, q2: GTems.GBase) {
            
            for (var qq of this.evaluate_query(sol, q1)) {
                if ((<Solution>qq).state == SolutionState.QTrue) {
                    let v = (<Solution>qq).value
                    if (v instanceof GTems.LiteralBool) {
                        if (v.value == false) {
                            yield new Solution(SolutionState.QFalse, atom_false(), {})                                   
                            continue                
                        }
                    }                    
                    yield qq                    
                }
            }

            //another term
            for (var qq of this.evaluate_query(sol, q2)) {
                if ((<Solution>qq).state == SolutionState.QTrue) {
                    let v = (<Solution>qq).value
                    if (v instanceof GTems.LiteralBool) {
                        if (v.value == false) {
                            yield new Solution(SolutionState.QFalse, atom_false(), {})  
                            continue
                        }
                    }   
                    yield qq         
                }
            }
        }



        public all_query(q: GTems.GBase) {

           // console.dir(q, { depth: null })
            let sol = new Solution(SolutionState.QTrue, atom_true(), {})

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

                if (q.name == "or") {
                    for (var qq of this.query_or(sol, q.args[0], q.args[1])) yield qq
                    return
                }


                if (q.args.length == 1) {
                    let r = []
                    for (var qx of this.query_ar1(sol, q.name, q.args[0])) {
                        yield qx                        
                    }
                    return

                }
                if (q.args.length == 2) {
                    let r = []
 
                    for (var qy of this.query_ar2(sol, q.name, q.args[0], q.args[1])){ 
                        yield qy
                        //r.push(qy)
                    }
                    return 
                }

            }

            if (q instanceof GTems.LiteralBool) {
                if (q.value == false) yield new Solution(SolutionState.QFalse, q, {})
                if (q.value == true) yield new Solution(SolutionState.QTrue, q, {})
                return
            }


            if (q instanceof GTems.Atom) {
                if (q.name == "true") {
                    yield new Solution(SolutionState.QTrue, q, {})
                    return
                }
                if (q.name == "false") {
                    yield new Solution(SolutionState.QFalse, q, {})
                    return
                }
                if (q.name == "fail") {
                    yield new Solution(SolutionState.QFail, q, {})
                    return
                }

                yield new Solution(SolutionState.QTrue, q, {}) //fail
                return 
            }
            if (q instanceof GTems.Variable) {
                if (this.isVar(q)) {
                    let qval = getValue(sol, q);
                    if (isUndefined(qval)) {
                        yield new Solution(SolutionState.QFalse, qval, {}) //fail                        
                    }
                    else {
                        yield new Solution(SolutionState.QTrue, qval, {})
                    }
                    return
                }
            }

            if (q instanceof GTems.LiteralNumber) {
                yield new Solution(SolutionState.QTrue, q, {})
                return
            }

            if (q instanceof GTems.GList) {
                yield new Solution(SolutionState.QTrue, q, {})
                return
            }


            console.log("undefined term :", q)
            //throw new Error('Unassigned Term Evaluator');

       
        }

   

        *evaluate_query(sol: Solution, code: GTems.GBase) {

            if (code instanceof GTems.Variable) {
                let code_value = getValue(sol, code)
                if (isUndefined(code_value)) {
                    yield new Solution(SolutionState.QTrue, code, {})
                    return
                }
                yield new Solution(SolutionState.QTrue, code_value, {}) 
                return 
            }

            if (code instanceof GTems.LiteralNumber) {
                yield new Solution(SolutionState.QTrue, code, {})
                return
            }
            if (code instanceof GTems.LiteralBool) {
                yield new Solution(SolutionState.QTrue, code, {})
                return
            }



            for (var qin of this.query(sol, code)) {
                let fsol = fuseSolution(sol, qin)
                if (fsol.state == SolutionState.QTrue) {
                    yield fsol;
                }
                 
            }
        }



        //buildIn Predicates

        buildIn_add(sol: Solution, arg1: GTems.GBase, arg2: GTems.GBase) {
            //arg1 nao rh uma variavel ..bind o argumento para o valor dela ..senao,bind na saida
            let sol_next = new Solution(SolutionState.QTrue, atom_true(), {})
            if (this.isVar(arg1)) new Solution(SolutionState.QFalse, atom_false(), {})
            if (this.isVar(arg2)) new Solution(SolutionState.QFalse, atom_false(), {})

            for (var v1 of this.evaluate_query(sol, arg1)) {
                for (var v2 of this.evaluate_query(sol, arg2)) {
                    if (v1.value instanceof GTems.LiteralNumber) {
                        if (v2.value instanceof GTems.LiteralNumber) {
                            let r = new GTems.LiteralNumber(v1.value.value + v2.value.value)
                            return new Solution(SolutionState.QTrue, r, {})
                        }
                    }
                }
            }



            return new Solution(SolutionState.QFalse, atom_false(), {})
        }


        buildIn_minus(sol: Solution, arg1: GTems.GBase, arg2: GTems.GBase) {
            //arg1 nao rh uma variavel ..bind o argumento para o valor dela ..senao,bind na saida
            let sol_next = new Solution(SolutionState.QTrue, atom_true(), {})
            if (this.isVar(arg1)) new Solution(SolutionState.QFalse, atom_false(), {})
            if (this.isVar(arg2)) new Solution(SolutionState.QFalse, atom_false(), {})
            for (var v1 of this.evaluate_query(sol, arg1)) {
                for (var v2 of this.evaluate_query(sol, arg2)) {
                    if (v1.value instanceof GTems.LiteralNumber) {
                        if (v2.value instanceof GTems.LiteralNumber) {
                            let r = new GTems.LiteralNumber(v1.value.value - v2.value.value)
                            return new Solution(SolutionState.QTrue, r, {})
                        }
                    }
                }
            }
            return new Solution(SolutionState.QFalse, atom_false(), {})
        }


        buildIn_gt(sol: Solution, arg1: GTems.GBase, arg2: GTems.GBase) {
            //arg1 nao rh uma variavel ..bind o argumento para o valor dela ..senao,bind na saida
            let sol_next = new Solution(SolutionState.QTrue, atom_true(), {})
            if (this.isVar(arg1)) new Solution(SolutionState.QFalse, atom_false(), {})
            if (this.isVar(arg2)) new Solution(SolutionState.QFalse, atom_false(), {})
            for (var v1 of this.evaluate_query(sol, arg1)) {
                for (var v2 of this.evaluate_query(sol, arg2)) {
                    if (v1.value instanceof GTems.LiteralNumber) {
                        if (v2.value instanceof GTems.LiteralNumber) {
                            if (v1.value.value > v2.value.value) {
                                return new Solution(SolutionState.QTrue,   new GTems.LiteralBool( true ), {})
                            }
                            else {
                                return new Solution(SolutionState.QFalse,  new GTems.LiteralBool( false ), {})
                            }
                        }
                    }
                }
            }
            return new Solution(SolutionState.QFalse, atom_false(), {})
        }


        buildIn_lt(sol: Solution, arg1: GTems.GBase, arg2: GTems.GBase) {
            //arg1 nao rh uma variavel ..bind o argumento para o valor dela ..senao,bind na saida
            let sol_next = new Solution(SolutionState.QTrue, atom_true(), {})
            if (this.isVar(arg1)) new Solution(SolutionState.QFalse, atom_false(), {})
            if (this.isVar(arg2)) new Solution(SolutionState.QFalse, atom_false(), {})
            for (var v1 of this.evaluate_query(sol, arg1)) {
                for (var v2 of this.evaluate_query(sol, arg2)) {
                    if (v1.value instanceof GTems.LiteralNumber) {
                        if (v2.value instanceof GTems.LiteralNumber) {
                            if (v1.value.value < v2.value.value) {
                                return new Solution(SolutionState.QTrue, new GTems.LiteralBool( true ), {})
                            }
                            else {
                                return new Solution(SolutionState.QFalse, new GTems.LiteralBool( false ), {})
                            }
                        }
                    }
                }
            }
            return new Solution(SolutionState.QFalse, atom_false(), {})
        }



        buildIn_mul(sol: Solution, arg1: GTems.GBase, arg2: GTems.GBase) {
            //arg1 nao rh uma variavel ..bind o argumento para o valor dela ..senao,bind na saida
            let sol_next = new Solution(SolutionState.QTrue, atom_true(), {})
            if (this.isVar(arg1)) new Solution(SolutionState.QFalse, atom_false(), {})
            if (this.isVar(arg2)) new Solution(SolutionState.QFalse, atom_false(), {})
            for (var v1 of this.evaluate_query(sol, arg1)) {
                for (var v2 of this.evaluate_query(sol, arg2)) {
                    if (v1.value instanceof GTems.LiteralNumber) {
                        if (v2.value instanceof GTems.LiteralNumber) {
                            let vv = (v1.value.value * v2.value.value)
                            return new Solution(SolutionState.QTrue, new GTems.LiteralNumber(vv), {})

                        }
                    }
                }
            }
            return new Solution(SolutionState.QFalse, atom_false(), {})
        }




        //general call


        *query_ar2(sol: Solution, f_name: string, _arg1: GTems.GBase, _arg2: GTems.GBase) {
            if (isArray(_arg1)) _arg1 = _arg1[0]
            if (isArray(_arg2)) _arg2 = _arg2[0]

            let arg1 = _arg1
            let arg2 = _arg2

            //if (isUndefined(arg1)) arg1 = _arg1
            //if (isUndefined(arg2)) arg2 = _arg2



  



            let value_1 = Array.from(this.evaluate_query(sol, _arg1)).filter((x) => x.state == SolutionState.QTrue).map((c) => c.value)
            if (value_1.length > 0) arg1 = value_1[0]
            else arg1 = atom_false()


            let value_2 = Array.from(this.evaluate_query(sol, _arg2)).filter((x) => x.state == SolutionState.QTrue).map((c) => c.value)
            if (value_2.length > 0) arg2 = value_2[0]
            else arg2 = atom_false()

            if (f_name == "unify") {
                let s = bind(sol, arg1, arg2) 
                yield s
                return  
           }

           if (f_name == "append") {
        
            for (var qq of this.query_append(sol, arg1, arg2))    {
                yield qq
            }
            return
        }
            if (f_name == "and") {
                for (var qq of this.query_and(sol, arg1, arg2)) yield qq
                return
            }

/*             if (f_name == "or") 
            {for(var o_or of this.query_or(sol, arg1, arg2))  {
                  yield o_or
                }
                return
            } */
            if (f_name == "plus") {
                yield this.buildIn_add(sol, arg1, arg2)
                return
            }

            if (f_name == "minus") {
                yield this.buildIn_minus(sol, arg1, arg2)
                return
            }

            if (f_name == ">") {
                yield this.buildIn_gt(sol, arg1, arg2)
                return
            }

            if (f_name == "<") {
                yield this.buildIn_lt(sol, arg1, arg2)
                return
            }

            if (f_name == "*") {
                yield this.buildIn_mul(sol, arg1, arg2)
                return
            }

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
                    let sol_next = new Solution(SolutionState.QTrue, atom_true(), {})
                    if (this.isVar(arg1) == false) { sol_next = bind(sol_next, pa0, arg1) }
                    if (this.isVar(arg2) == false) { sol_next = bind(sol_next, pa1, arg2) }


                    // testa a condicao de ativacao do predicado
                    let cond_satisf = true 
                    if ( isUndefined( p.condition ) ==false ) {
                        cond_satisf = false  
                        //testa a condicao
                        for (var sol_cond of this.evaluate_query(sol_next, p.condition)) {
                            if (sol_cond.state == SolutionState.QTrue)
                            {
                                cond_satisf = true 
                                break //apenas a primeira true ja serve
                            }
                        }
                    }
                    if (cond_satisf ==false ) continue  // nem testa o corpo .. proximo termo



                    if (sol_next.state != SolutionState.QTrue) continue
                    for (var sol_next_inner of this.evaluate_query(sol_next, p.value)) {
                        if (sol_next_inner.state != SolutionState.QTrue) continue

                        let sol_n = new Solution(SolutionState.QTrue, atom_true(), {})
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
                        yield sol_n.add_value(sol_next_inner.value)
                    }
                }
            }
        }





        public *query_ar1(sol: Solution, f_name: string, _arg1: GTems.GBase) {



            if (isArray(_arg1)) _arg1 = _arg1[0]

            let arg1 = _arg1

            let value_1 = Array.from(this.evaluate_query(sol, _arg1)).filter((x) => x.state == SolutionState.QTrue).map((c) => c.value)
            if (value_1.length > 0) arg1 = value_1[0] 
            else arg1 = atom_false()

            //let arg1 = getValue(sol, _arg1)
            //if (isUndefined(arg1)) arg1 = _arg1

            for (var [i, p] of this.predicades.entries()) {
                if (p.entry.name != f_name) continue
                let pp = p.entry;
                if (pp instanceof GTems.Functor) {
                    if (pp.args.length != 1) continue
                    let pa0 = pp.args[0]
                    if (isArray(pa0)) pa0 = pa0[0]


                    //arg1 nao rh uma variavel ..bind o argumento para o valor dela ..senao,bind na saida
                    let sol_next = new Solution(SolutionState.QTrue, atom_true(), {})
                    if (this.isVar(arg1) == false) { sol_next = bind(sol_next, pa0, arg1) }

                    if (sol_next.state != SolutionState.QTrue) continue

                    // testa a condicao de ativacao do predicado
                    let cond_satisf = true 
                    if ( isUndefined( p.condition ) ==false  )  {
                        cond_satisf = false  
                        //testa a condicao
                        for (var sol_cond of this.evaluate_query(sol_next, p.condition)) {
                            if (sol_cond.state == SolutionState.QTrue)
                            {
                                cond_satisf = true 
                                break //apenas a primeira true ja serve
                            }
                        }
                    }
                    if (cond_satisf ==false ) continue  // nem testa o corpo .. proximo termo


                    for (var sol_next_inner of this.evaluate_query(sol_next, p.value)) {
                        if (sol_next_inner.state != SolutionState.QTrue) continue

                        if (this.isVar(arg1) || isUndefined(arg1))  //arg1 eh uma variavel ? bind para o resultado 
                        {
                            let v_ret = getValue(sol_next_inner, pa0)
                            if (isUndefined(v_ret) == false) {
                                let sol_n = bind(sol, v_ret, arg1)
                                if (sol_n.state == SolutionState.QTrue) {
                                    sol_n.value = sol_next_inner.value
                                    yield sol_n
                                }
                            }
                            else {
                                //valor do argumento continua sem binding .... mas a saida eh valida


                                yield sol.add_value(sol_next_inner.value)
                            }
                        }
                        else {

                            yield sol.add_value(sol_next_inner.value)

                        }
                    }
                }
            }

            //yield new Solution(SolutionState.QFalse, atom_false(), {})
        }




    } //class
} //namespace




