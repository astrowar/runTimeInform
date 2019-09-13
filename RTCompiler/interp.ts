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
    export   enum SolutionState {
        QTrue,
        QFalse,
        QUndefined        
    }

    export  class Solution {
        public state: SolutionState = SolutionState.QUndefined
        public var_values: { [name: string]: GTems.GBase }  = {}
        constructor(state: SolutionState, var_values ) {
            this.state = state
            this.var_values = var_values
        }

        add(var_name: string, value: GTems.GBase): Solution {
            let nsol = new Solution(this.state, {})

            for (var i in this.var_values) {
                nsol.var_values[i] =  this.var_values[i]
            }
              nsol.var_values[var_name] = value
            
            return nsol
        }
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

    function getBindValue(sol: Solution, x: GTems.Variable): GTems.GBase
    {
        let v = getBindTail(sol, x)
        return getBindVarValue(sol,v)

    }

    function getBindVarValue(sol: Solution, x: GTems.Variable): GTems.GBase {
        for (var i in sol.var_values) {
            if (i == x.name) {
                let value_bind: GTems.GBase = sol.var_values[i]
                if (value_bind instanceof GTems.Variable) {
                    return undefined
                }
                else {
                   return  value_bind
                }
            }
        }
        return undefined
    }

    function getBindTail(sol: Solution, x: GTems.Variable, deep = 0): GTems.Variable {
        if (deep > 300) return x
        for (var i in sol.var_values) {
            if (i == x.name)
            {
                let value_bind: GTems.GBase = sol.var_values[i]
                if (value_bind instanceof GTems.Variable)
                {
                    if (value_bind.name == x.name) return x // fundo do poco .. eu mesmo
                    return getBindTail(sol, value_bind, deep+1)
                }
                else
                {
                    return x //esta anexado ao bind de uma variable
                }
            }
        }
        return x //nao tem bind
    }

    function bindVar(sol: Solution, x: GTems.Variable, y: GTems.GBase): Solution
    {
        if (y instanceof GTems.Variable) {
            return bindVarVar(sol,x,y)
        }

        // bind da variavel e retorna nova solucao derivada 
        let xx: GTems.Variable = getBindTail(sol, x)

        let value_binded = getBindVarValue(sol, xx)
        if (isUndefined(value_binded)) {
            let vname:string  = xx.name
            return sol.add(  vname , y   )
        }

        if (isEqually(value_binded, y)) {
            return sol;
        }
        return    new Solution(SolutionState.QFalse, {})
    }


    function bindVarVar(sol: Solution, x: GTems.Variable, y: GTems.Variable): Solution {

        

        let xx: GTems.Variable = getBindTail(sol, x)
        let yy: GTems.Variable = getBindTail(sol, y)

        let x_value = getBindVarValue(sol, xx)
        let y_value = getBindVarValue(sol, yy)

        if (isUndefined(x_value))   {            
            return sol.add(  xx.name , y  )
        }

        if (isUndefined(y_value)) {
            return sol.add( yy.name, x   )
        }

        //nenhum dos ois eh indefinido 

        if (isEqually(x_value, y_value)) {
            return sol;
        }
        return new Solution(SolutionState.QFalse, {})
    }




    export function bind(sol: Solution, x: GTems.GBase, y: GTems.GBase) 
    {
        if (sol.state == SolutionState.QFalse) return sol //nem tenta

        if (x instanceof   GTems.Atom)
        {
            if (y instanceof   GTems.Atom)
            {
                if (isEqually(x,y))
                    return sol
                else
                    return new Solution(SolutionState.QFalse, {})
            }

            if (y instanceof GTems.Variable )
            {
                return bindVar(sol,y,x)
            }
        }

        if (x instanceof GTems.Variable)
        {
            if (y instanceof GTems.Atom)
            {    
                    return bindVar(sol, x, y)
            }

            if (y instanceof GTems.Variable) {
                return bindVarVar(sol, y, x)
            }
        } 

        return new Solution(SolutionState.QFalse, {}) 
    }


     export   class Context
    {
        //predicades: GTems.Functor[] = []
        values: GTems.Atom[] = []

        predicades : PredicateEntry[] = []

       public  addPredicateFunc(p: GTems.Functor, code:any) {
            this.predicades.push(new PredicateEntry(p,code))
        }

        addPredicateAtom(v: GTems.Atom) {
            this.values.push(v)
        }


        query(functor: GTems.Functor) {

            

        }

        *query_ar2(f_name: string, arg1: GTems.GBase, arg2: GTems.GBase)
        {
            for (var [i, p] of this.predicades.entries()) {
                if (p.entry.name == f_name)
                {
                    let pp = p.entry;
                    if (pp instanceof GTems.Functor)
                    {
                        if (pp.args.length == 2) {
                            let pa0 = pp.args[0]
                            let pa1 = pp.args[1]
                            if (isArray( pa0))  pa0 = pa0[0]
                            if (isArray( pa1))  pa1 = pa1[0]
                            let sol_next = bind(new Solution(SolutionState.QTrue, {}), pa0, arg1)                            
                            sol_next = bind(sol_next,pa1, arg2)
                            if (sol_next.state == SolutionState.QTrue) {
                                yield sol_next
                            }
                        }
                    }
                }
            }
        }


         public *query_ar1(f_name: string, arg1: GTems.GBase)
         {
             console.log(">>")
             for (var [i, p] of this.predicades.entries())
             {
                console.log("aqui>>")
                if (p.entry.name == f_name) {
                    let pp = p.entry;
                    if (pp instanceof GTems.Functor) {
                        if (pp.args.length == 1) {
                            let pa0 = pp.args[0]
                             
                            if (isArray( pa0))  pa0 = pa0[0] 
                            let sol_next = bind(new Solution(SolutionState.QTrue, {}), pa0, arg1) 
                            if (sol_next.state == SolutionState.QTrue) {
                                yield sol_next
                            }
                        }
                    }
                }
            }
        }



    }
}


