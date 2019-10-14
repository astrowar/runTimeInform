import { GTems } from "./atoms"
import { isUndefined , isArray, isObject } from "util"
import { write } from "fs"

 
export namespace Solution{

    // a clause foi provada .. foi disprovada
    // ou nao da para responder
    export enum SolutionState {
        QTrue,
        QFalse,
        QFail,
        QCut,
        QUndefined
    }



    export class Solution {
        public state: SolutionState = SolutionState.QUndefined
        public var_values: { [name: string]: GTems.GBase } = {}
        public value: GTems.GBase = undefined
        constructor(state: SolutionState, value: GTems.GBase, var_values: { [name: string]: GTems.GBase }) {
            this.state = state
            this.var_values = var_values
            this.value = value

            if ((value instanceof GTems.GBase) == false) {
                throw new Error('invalid value term');
            }

            if ((isObject(var_values)) == false) {
                throw new Error('invalid var_value term');
            }
        }

        add(var_name: string, value: GTems.GBase): Solution {
            let nsol = new Solution(this.state, this.value, {})

            if (var_name == "_")  throw new Error('variable is cannob be assigned');
            if (value.toString() == "$thing")  throw new Error('variable is cannob be assigned');

            for (var i in this.var_values) {
                nsol.var_values[i] = this.var_values[i]
            }
            nsol.var_values[var_name] = value

            return nsol
        }

        add_value(value: Solution): Solution {
            let nsol = new Solution(this.state, value.value, {})
            for (var i in this.var_values) {
                nsol.var_values[i] = this.var_values[i]
            }
            if (value.state == SolutionState.QCut) nsol.state = SolutionState.QCut

            return nsol
        }

        toString(): string {
            let s = this.value.toString()
            if (Object.keys(this.var_values).length > 0) {
                s += " { "
                for (var kv in this.var_values) {
                    s += kv.toString() + ":" + this.var_values[kv].toString() + " "
                }
                s += " } "
            }
            return s
        }
    }

    export function isTrue(a: Solution):boolean {
        if (isValid(a) ==false ) return false 
        if (a.value instanceof GTems.LiteralBool){
            return a.value.value
        }
        return true
    }
    export function isValid(a: Solution) {
        if (a.state == SolutionState.QTrue) return true
        if (a.state == SolutionState.QCut) return true
        if (a.state == SolutionState.QFalse) return false
        if (a.state == SolutionState.QFail) return false
        throw new Error("invalid state")
    }

    //mantem o segundo termo como valor
   export  function fuse(a: Solution, b: Solution) {
        if (isValid(a) == false) return a
        if (isValid(b) == false) return b


        var s: Solution = new Solution(b.state, b.value, {})

        if (b.value instanceof GTems.Atom)
            if (b.value.name == "cut")
                s = new Solution(SolutionState.QCut, a.value, {})



        if (a.value instanceof GTems.Atom)
            if (a.value.name == "cut")
                s = new Solution(SolutionState.QCut, b.value, {})




        for (var i in a.var_values) {
            if (i=="_") throw "anonimous variable bind ?"
            s.var_values[i] = a.var_values[i]
        }
        for (var i in b.var_values) {
            if (i=="_") throw "anonimous variable bind ?"
            if ( isUndefined( s.var_values[i] ) ==false )
            {
                if  (GTems.isEqually(s.var_values[i],b.var_values[i]) ==false )
                {
                    //throw new Error("assertion error ?")
                   // console.log("variable overrride " + i )
                }
            }
            s.var_values[i] = b.var_values[i]
        }

        return s
    }

    class SolutionGroup {
        public solution: Solution[] = []

    }

   


    //retorna o valor da variavel em questao .. retorna ATOM ou undefined
    function getBindValue(sol: Solution, x: GTems.Variable): GTems.GBase {
        let v = getBindTail(sol, x)
        return getBindVarValue(sol, v)

    }

    export function getValue(sol: Solution, x: GTems.GBase): GTems.GBase {
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

        if (x.name == "_") return sol 

        // bind da variavel e retorna nova solucao derivada 
        let xx: GTems.Variable = getBindTail(sol, x)

        let value_binded = getBindVarValue(sol, xx)
        if (isUndefined(value_binded)) {
            let vname: string = xx.name
            return sol.add(vname, y)
        }
        if(value_binded instanceof GTems.GValue )
        {
            if (GTems.isEqually(value_binded, y) ==false ) 
            {   return new Solution(SolutionState.QFalse, GTems.atom_false(), {})
            } 
            else{
                return sol
            }
        }

        if (GTems.isEqually(value_binded, y)) {
            return sol;
        }
        throw new Error("undefined binding")
        return new Solution(SolutionState.QFalse, GTems.atom_false(), {})
    }


    function bindVarVar(sol: Solution, x: GTems.Variable, y: GTems.Variable): Solution {

        if (x.name == "_") return sol
        if (y.name == "_") return sol

        if (x.name == y.name) return sol

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

        if (GTems.isEqually(x_value, y_value)) {
            return sol;
        }
        return new Solution(SolutionState.QFalse, GTems.atom_false(), {})
    }


    export function bind(sol: Solution, x: GTems.GBase, y: GTems.GBase) :Solution.Solution {
        if (isValid(sol) == false) return sol //nem tenta

        if (isArray(y)) throw new Error("array as term, use List")
        if (isArray(x)) throw new Error("array as term, use List")
        


        if (isArray(y)) return bind(sol, x, y[0])
        if (isArray(x)) return bind(sol, x[0], y)

        if (x instanceof GTems.LiteralNumber) {
            if (y instanceof GTems.LiteralNumber) {
                if (GTems.isEquallyNumber(x, y))
                    return sol
                else
                    return new Solution(SolutionState.QFalse, GTems.atom_false(), {})
            }
        }

        if (x instanceof GTems.GList) {
            if (y instanceof GTems.GList) {
                if (x.items.length != y.items.length) return new Solution(SolutionState.QFalse, GTems.atom_false(), {})
                let sol_n = fuse(sol, new Solution(SolutionState.QTrue, GTems.atom_true(), {}))
                let n = x.items.length
                for (var i = 0; i < n; ++i) {
                    sol_n = bind(sol_n, x.items[i], y.items[i])
                    if (sol_n.state != SolutionState.QTrue) break
                }
                return sol_n
            }
        }



        if (x instanceof GTems.LiteralBool) {
            if (y instanceof GTems.LiteralBool) {
                if (x.value == y.value)
                    return sol
                else
                    return new Solution(SolutionState.QFalse, GTems.atom_false(), {})
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
                if (GTems.isEqually(x, y))
                    return sol
                else
                    return new Solution(SolutionState.QFalse,GTems.atom_false(), {})
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



        return new Solution(SolutionState.QFalse, GTems.atom_false(), {})
    }



}