﻿import { GTems } from "./atoms";
import { BADQUERY } from "dns";
import { isUndefined, isArray, isObject } from "util";
import { DH_UNABLE_TO_CHECK_GENERATOR } from "constants";

export namespace Interp {

    class PredicateEntry {
        constructor( public unique_name:string,  public entry: GTems.Functor | GTems.Atom, public value: GTems.GBase,public condition: GTems.GBase,public prior: number) {

        }
    }



    // a clause foi provada .. foi disprovada
    // ou nao da para responder
    export enum SolutionState {
        QTrue,
        QFalse,
        QFail,
        QCut,
        QUndefined
    }


    function atom_false() { return new GTems.LiteralBool(false) }
    function atom_true() { return new GTems.LiteralBool(true) }


    class CallItem{
        constructor( public unique_name:string,   public arg: GTems.GBase[] ) { }

    }

    class QueryStack 
    {
        public  callStack : CallItem[] = []
        constructor(  ) { }
        contains  ( unique_name:string ,arg0: GTems.GBase=undefined , arg1: GTems.GBase =undefined, arg2: GTems.GBase =undefined, arg3: GTems.GBase =undefined  ):boolean
        {
           for( var  [i,cv] of this.callStack.entries())
           {
                 if (cv.unique_name != unique_name) continue 
                 
                 if (isUndefined(arg0) && cv.arg.length >0  ) continue; //arridade nao bate, cv eh menor que o requisitado
                 if (isUndefined(arg1) && cv.arg.length >1 ) continue; //arridade nao bate
                 if (isUndefined(arg2) && cv.arg.length >2 ) continue; //arridade nao bate
                 if (isUndefined(arg3) && cv.arg.length >3 ) continue; //arridade nao bate

                 if ( isUndefined( arg0 )==false  && cv.arg.length < 1  ) continue // cv eh  maior do que o requisitado
                 if ( isUndefined( arg1 )==false  && cv.arg.length < 2  ) continue
                 if ( isUndefined( arg2 )==false  && cv.arg.length < 3  ) continue
                 if ( isUndefined( arg3 )==false  && cv.arg.length < 4  ) continue

                 
                 if ( isUndefined( arg0 )==false )   if ( isEqually( cv.arg[0] , arg0) ==false) continue 
                 if ( isUndefined( arg1 )==false )   if ( isEqually( cv.arg[1] , arg1) ==false) continue 
                 if ( isUndefined( arg2 )==false )   if ( isEqually( cv.arg[2] , arg2) ==false) continue 
                 if ( isUndefined( arg3 )==false )   if ( isEqually( cv.arg[3] , arg3) ==false) continue 

               return true
           }
           return false 
        }


        clone():QueryStack   {
           let s = new QueryStack()
           for( var  [i,cv] of this.callStack.entries())       s.callStack.push(cv)
           return s;
        }


        pushCall( unique_name:string ,arg0: GTems.GBase=undefined , arg1: GTems.GBase =undefined, arg2: GTems.GBase =undefined, arg3: GTems.GBase =undefined):QueryStack 
        {
            let argv =[]
            if (isUndefined(arg0) ==false  ) argv.push(arg0)
            if (isUndefined(arg1) ==false ) argv.push(arg1)
            if (isUndefined(arg2) ==false ) argv.push(arg2)
            if (isUndefined(arg3) ==false ) argv.push(arg3)

            if (isUndefined(arg1) ==false && (isUndefined(arg0) )) throw new Error("invalid call arguments")
            if (isUndefined(arg2) ==false && (isUndefined(arg0) )) throw new Error("invalid call arguments")
            if (isUndefined(arg2) ==false && (isUndefined(arg1) )) throw new Error("invalid call arguments")
            if (isUndefined(arg3) ==false && (isUndefined(arg2) )) throw new Error("invalid call arguments")
            
            let c = new CallItem(unique_name,argv)
            let s = this.clone()
            s.callStack.push(c)
            return s
        }
    }





    export class Solution {
        public state: SolutionState = SolutionState.QUndefined
        public var_values: { [name: string]: GTems.GBase } = {}
        public value: GTems.GBase = undefined
        constructor(state: SolutionState, value: GTems.GBase, var_values: { [name: string]: GTems.GBase } ) {
            this.state = state
            this.var_values = var_values
            this.value = value

            if ((value  instanceof GTems.GBase) ==false )
            {
                throw new Error('invalid value term');
            }

            if (( isObject(var_values) ) ==false )
            {
                throw new Error('invalid var_value term');
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

        add_value(value: Solution): Solution {
            let nsol = new Solution(this.state, value.value, {})
            for (var i in this.var_values) {
                nsol.var_values[i] = this.var_values[i]
            }
            if (value.state ==  SolutionState.QCut)nsol.state = SolutionState.QCut
            
            return nsol
        }

        toString() : string 
        {
          let s = this.value.toString()
          if ( Object.keys(this.var_values).length > 0  ){
          s += " { "
          for(var kv in this.var_values)
          {
              s += kv.toString() +":"+ this.var_values[kv].toString()+ " "
          }
          s += " } "
         }
          return s
        }
    }


    function isValidSolution( a: Solution )
    {
        if (a.state == SolutionState.QTrue) return true
        if (a.state == SolutionState.QCut) return true
        if (a.state == SolutionState.QFalse) return false
        if (a.state == SolutionState.QFail) return false
        throw new Error("invalid state")
    }

    //mantem o segundo termo como valor
    function fuseSolution(a: Solution, b: Solution) {
        if (isValidSolution(a)==false ) return a
        if (isValidSolution(b)==false ) return b
        

        var s :Solution = new Solution(b.state, b.value, {})        

        if (b.value instanceof GTems.Atom)         
          if (b.value.name == "cut")
           s =   new Solution( SolutionState.QCut, a.value, {}) 
        
        

        if (a.value instanceof GTems.Atom) 
          if (a.value.name == "cut")
           s =   new Solution( SolutionState.QCut, b.value, {}) 
        



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

        if (isEqually(x_value, y_value)) {
            return sol;
        }
        return new Solution(SolutionState.QFalse, atom_false(), {})
    }




    export function bind(sol: Solution, x: GTems.GBase, y: GTems.GBase) {
        if (isValidSolution(sol) ==false ) return sol //nem tenta

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

   function getComplexityTerm( p: GTems.GBase ) :number  {

      
       if (p instanceof GTems.Atom) return 10
       if (p instanceof GTems.Variable) return 0
       if (p instanceof GTems.GList) return 40
       if (p instanceof GTems.GValue) return 10
       if (p instanceof GTems.Functor) return 10 + getComplexity(p)
       return 5
   }

   function getComplexity( p: GTems.Functor | GTems.Atom ) :number  {    
    
    if (p instanceof GTems.Atom )
    {
      return 10
    }
    if (p instanceof GTems.Functor )
    {
     let prs = p.args.map(getComplexityTerm )
     var total = prs.reduce(function(a, b){ return a * b; }, 1 ); 
     return total
      
    }
    return 0
}

    // 1 -> a < b 
    function predicateEntryOrder(a:PredicateEntry , b:PredicateEntry):number {
        let prior_A = -1
        let prior_B = 1
        if (a.prior > b.prior )return prior_A
        if (a.prior < b.prior )return prior_B

        if ( isUndefined( a.condition )==false  && isUndefined( b.condition )) return prior_A
        if ( isUndefined( b.condition )==false  && isUndefined( a.condition )) return prior_B        
        let cp_a =   getComplexity( a.entry )
        let cp_b =   getComplexity( b.entry )
        if (cp_a > cp_b ) return prior_A
        if (cp_b > cp_a ) return prior_B

        if ( isUndefined( a.condition )==false  && isUndefined( b.condition )==false)
        {
          let cd_a =   getComplexityTerm( a.condition )
          let cd_b =   getComplexityTerm( b.condition )
          if (cd_a > cd_b) return prior_A
          if (cd_b > cd_a) return prior_B
        }
 
        return 0
    }


    export class Context {
        //predicades: GTems.Functor[] = []
        values: GTems.Atom[] = []

        predicades: PredicateEntry[] = []
        predicades_id: number  = 1

        public addPredicateFunc(p: GTems.Functor, code: any, condition: any,prioridade:number ): boolean {
            let unique_name = p.name + this.predicades_id.toString()
            this.predicades_id++;
            
            console.log(code)

            this.predicades.unshift(new PredicateEntry(unique_name, p, code,condition,prioridade))
           
            this.predicades = this.predicades.sort((a, b) => {return predicateEntryOrder(a,b )})
            
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


        public *query_and(stk:QueryStack,sol: Solution, q1: GTems.GBase, q2: GTems.GBase) {
            for (var qq of this.evaluate_query(stk,sol, q1)) {
                let qsol =<Solution>qq
                if (isValidSolution(qsol)) {                 
                    let v = qsol.value
                    if (v instanceof GTems.LiteralBool) {
                        if (v.value == false) {
                            yield new Solution(SolutionState.QFalse, atom_false(), {})
                            continue; //nem tenta o segundo termo
                        }                        
                    }
                    for (var qz of this.evaluate_query(stk, fuseSolution(qsol,sol), q2)) {
                        if ( isValidSolution(<Solution>qz)) {
                            let fz=  fuseSolution(qq, qz)
                            yield fz
                            
                        }
                         

                    }
                }
            }
        }


        public *query_or(stk:QueryStack,sol: Solution, q1: GTems.GBase, q2: GTems.GBase) {
            
            for (var qq of this.evaluate_query(stk,sol, q1)) {
                if (isValidSolution(<Solution>qq)) {
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
            for (var qq of this.evaluate_query(stk,sol, q2)) {
                if (isValidSolution(<Solution>qq) ) {
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
            
            let stk:QueryStack = new QueryStack()

            let r = []
            for (var qz of this.query(stk,sol, q)) {                
                if (isValidSolution((<Solution>qz))) {
                
                    r.push(qz)
                }
            }
            // console.log("solutions:")
            // console.dir( r, { depth: null })
            return r
        }

        public *query(stk:QueryStack, sol: Solution, q: GTems.GBase) {

            // console.log("...")
            // console.dir(q, { depth: null })



            if (q instanceof GTems.Functor) {
                if (q.name == "and") {
                    for (var qq of this.query_and(stk,sol, q.args[0], q.args[1])) yield qq
                    return
                }

                if (q.name == "or") {
                    for (var qq of this.query_or(stk,sol, q.args[0], q.args[1])) yield qq
                    return
                }


                if (q.args.length == 1) {                    
                    for (var qx of this.query_ar1(stk,sol, q.name, q.args[0])) {                        
                        yield qx                                             
                    }
                    return

                }

                if (q.args.length == 2) {                    
                    for (var qy of this.query_ar2(stk,sol, q.name, q.args[0], q.args[1])){ 
                        yield qy                        
                    }
                    return 
                }

                if (q.args.length == 3) {                    
                    for (var qz of this.query_ar3(stk,sol, q.name, q.args[0], q.args[1] , q.args[2]  )){ 
                        yield qz 
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
                if (q.name == "cut") {
                    yield new Solution(SolutionState.QCut, q, {})
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

   

        *evaluate_query(stk:QueryStack , sol: Solution, code: GTems.GBase) {


            if (code instanceof GTems.Atom) {
                if (code.name == "true") {
                    yield new Solution(SolutionState.QTrue, new GTems.LiteralBool(true) , {})
                    return
                }
                if (code.name == "false") {
                    yield new Solution(SolutionState.QFalse, new GTems.LiteralBool(false), {})
                    return
                }
                if (code.name == "fail") {
                    yield new Solution(SolutionState.QFail, code, {})
                    return
                }
                if (code.name == "cut") {
                    yield new Solution(SolutionState.QCut, code, {})
                    return
                } 
            }

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

            if (code instanceof GTems.GList) 
            {
                for(var ecc of this.eval_rec( stk,sol, [],code.items ))
                {
                    yield new Solution(SolutionState.QTrue, new GTems.GList(ecc), {})
                }                
                return
            }

            for (var qin of this.query(stk,sol, code)) {
                let fsol = fuseSolution(sol, qin)
                if (isValidSolution(fsol)) {
                    yield fsol;
                }
                 
            }
        }



        //buildIn Predicates

        *buildIn_add(stk:QueryStack,sol: Solution, arg1: GTems.GBase, arg2: GTems.GBase) {
            //arg1 nao rh uma variavel ..bind o argumento para o valor dela ..senao,bind na saida
            let sol_next = new Solution(SolutionState.QTrue, atom_true(), {})
            if (this.isVar(arg1)) new Solution(SolutionState.QFalse, atom_false(), {})
            if (this.isVar(arg2)) new Solution(SolutionState.QFalse, atom_false(), {})

            for (var v1 of this.evaluate_query(stk,sol, arg1)) {
                for (var v2 of this.evaluate_query(stk,sol, arg2)) {
                    if (v1.value instanceof GTems.LiteralNumber) {
                        if (v2.value instanceof GTems.LiteralNumber) {
                            let r = new GTems.LiteralNumber(v1.value.value + v2.value.value)
                            yield new Solution(SolutionState.QTrue, r, {})
                        }
                    }
                }
            }



            return new Solution(SolutionState.QFalse, atom_false(), {})
        }


        *buildIn_minus(stk:QueryStack,sol: Solution, arg1: GTems.GBase, arg2: GTems.GBase) {
            //arg1 nao rh uma variavel ..bind o argumento para o valor dela ..senao,bind na saida
            let sol_next = new Solution(SolutionState.QTrue, atom_true(), {})
            if (this.isVar(arg1)) new Solution(SolutionState.QFalse, atom_false(), {})
            if (this.isVar(arg2)) new Solution(SolutionState.QFalse, atom_false(), {})
            for (var v1 of this.evaluate_query(stk,sol, arg1)) {
                for (var v2 of this.evaluate_query(stk,sol, arg2)) {
                    if (v1.value instanceof GTems.LiteralNumber) {
                        if (v2.value instanceof GTems.LiteralNumber) {
                            let r = new GTems.LiteralNumber(v1.value.value - v2.value.value)
                            yield new Solution(SolutionState.QTrue, r, {})
                        }
                    }
                }
            }
            return new Solution(SolutionState.QFalse, atom_false(), {})
        }


        *buildIn_gt(stk:QueryStack,sol: Solution, arg1: GTems.GBase, arg2: GTems.GBase) {
            //arg1 nao rh uma variavel ..bind o argumento para o valor dela ..senao,bind na saida
            let sol_next = new Solution(SolutionState.QTrue, atom_true(), {})
            if (this.isVar(arg1)) new Solution(SolutionState.QFalse, atom_false(), {})
            if (this.isVar(arg2)) new Solution(SolutionState.QFalse, atom_false(), {})
            for (var v1 of this.evaluate_query(stk,sol, arg1)) {
                for (var v2 of this.evaluate_query(stk,sol, arg2)) {
                    if (v1.value instanceof GTems.LiteralNumber) {
                        if (v2.value instanceof GTems.LiteralNumber) {
                            if (v1.value.value > v2.value.value) {
                                yield new Solution(SolutionState.QTrue,   new GTems.LiteralBool( true ), {})
                            }
                            else {
                                yield new Solution(SolutionState.QFalse,  new GTems.LiteralBool( false ), {})
                            }
                        }
                    }
                }
            }
            return new Solution(SolutionState.QFalse, atom_false(), {})
        }


        *buildIn_lt(stk:QueryStack,sol: Solution, arg1: GTems.GBase, arg2: GTems.GBase) {
            //arg1 nao rh uma variavel ..bind o argumento para o valor dela ..senao,bind na saida
            let sol_next = new Solution(SolutionState.QTrue, atom_true(), {})
            if (this.isVar(arg1)) new Solution(SolutionState.QFalse, atom_false(), {})
            if (this.isVar(arg2)) new Solution(SolutionState.QFalse, atom_false(), {})
            for (var v1 of this.evaluate_query(stk,sol, arg1)) {
                for (var v2 of this.evaluate_query(stk,sol, arg2)) {
                    if (v1.value instanceof GTems.LiteralNumber) {
                        if (v2.value instanceof GTems.LiteralNumber) {
                            if (v1.value.value < v2.value.value) {
                                yield new Solution(SolutionState.QTrue, new GTems.LiteralBool( true ), {})
                            }
                            else {
                                yield new Solution(SolutionState.QFalse, new GTems.LiteralBool( false ), {})
                            }
                        }
                    }
                }
            }
          //  return new Solution(SolutionState.QFalse, atom_false(), {})
        }



        *buildIn_mul(stk:QueryStack,sol: Solution, arg1: GTems.GBase, arg2: GTems.GBase) {
            //arg1 nao rh uma variavel ..bind o argumento para o valor dela ..senao,bind na saida
            let sol_next = new Solution(SolutionState.QTrue, atom_true(), {})
            if (this.isVar(arg1)) new Solution(SolutionState.QFalse, atom_false(), {})
            if (this.isVar(arg2)) new Solution(SolutionState.QFalse, atom_false(), {})
            for (var v1 of this.evaluate_query(stk,sol, arg1)) {
                for (var v2 of this.evaluate_query(stk,sol, arg2)) 
                {

                    if (v1.value instanceof GTems.LiteralNumber) {
                        if (v2.value instanceof GTems.LiteralNumber) {
                            let vv = (v1.value.value * v2.value.value)
                            yield new Solution(SolutionState.QTrue, new GTems.LiteralNumber(vv), {})
                        }
                    }
                }
            }
           // return new Solution(SolutionState.QFalse, atom_false(), {})
        }



        


        *buildIn_head(stk:QueryStack,sol: Solution, arg1: GTems.GBase, arg2: GTems.GBase) {
            //arg1 nao rh uma variavel ..bind o argumento para o valor dela ..senao,bind na saida
            let sol_next = new Solution(SolutionState.QTrue, atom_true(), {})
           // if (this.isVar(arg1)) new Solution(SolutionState.QFalse, atom_false(), {})
            if (this.isVar(arg2)) 
            { 
                console.log("Warring: head of a unbound variable is not possible")
               // yield new Solution(SolutionState.QFalse, atom_false(), {})
            }

            if (arg2  instanceof GTems.GList)
            {
                if (arg2.items.length > 0) 
                {
                   let head = arg2.items[0]
                   let s = bind(sol, head, arg1) 
                   yield s
                }
            } 
           // return new Solution(SolutionState.QFalse, atom_false(), {})
        }

        *buildIn_tail(stk:QueryStack,sol: Solution, arg1: GTems.GBase, arg2: GTems.GBase) {
            //arg1 nao rh uma variavel ..bind o argumento para o valor dela ..senao,bind na saida
            let sol_next = new Solution(SolutionState.QTrue, atom_true(), {})
           // if (this.isVar(arg1)) new Solution(SolutionState.QFalse, atom_false(), {})
            if (this.isVar(arg2)) 
            {
                console.log("Warring: tail of a unbound variable is not possible")
                //yield new Solution(SolutionState.QFalse, atom_false(), {})
            }
            if (arg2  instanceof GTems.GList)
            {
                if (arg2.items.length > 0) 
                {
                   let tail = arg2.clone()
                   tail.items.shift()
                   let s = bind(sol, tail, arg1) 
                   yield s
                }
            } 
            //return new Solution(SolutionState.QFalse, atom_false(), {})
        }

        *eval_rec( stk,sol, acc:GTems.GBase[] , args:GTems.GBase[] ){
                if (args.length==0)
                {
                    yield acc;
                    return 
                }
                let args_c = Object.assign([], args);
                let arg = args_c.shift()   
                for (var v of this.evaluate_query(stk,sol, arg))     
                {
                    if (isValidSolution(v)) {                                          
                                let acc2 = Object.assign([], acc);
                                acc2.push( v.value )
                                for(var rval of this.eval_rec( stk,sol,acc2, args_c)) yield rval
                    }
                }
            }
            
        


        *apply_rec( stk,sol, acc:GTems.GBase[] , args:GTems.GBase[], func  ){
            if (args.length==0)
            {
                yield acc;
                return 
            }
            let args_c = Object.assign([], args);
            let arg = args_c.shift()   
            for (var v of this.evaluate_query(stk,sol, arg))     
            {
                if (isValidSolution(v)) {
                    for(var qs of  this.query_ar1( stk, sol, func, v.value )){
                        if (qs instanceof Solution) {
                               let acc2 = Object.assign([], acc);
                               acc2.push( qs.value )
                               for(var rval of this.apply_rec( stk,sol,acc2, args_c,func)) yield rval
                        }
                    }
                }
            }
        }

        *buildIn_maplist(stk:QueryStack,sol: Solution, arg1: GTems.GBase, arg2: GTems.GBase)      {
            let sol_next = new Solution(SolutionState.QTrue, atom_true(), {})
            if (this.isVar(arg1)) 
            {
                console.log("Warring: maplist of a unbound predicate is not possible")
                yield new Solution(SolutionState.QFalse, atom_false(), {})
            }
            if (this.isVar(arg2)) 
            {
                console.log("Warring: maplist of a unbound input list is not possible")
                yield new Solution(SolutionState.QFalse, atom_false(), {})
            }
            if (arg1 instanceof GTems.Atom ) {

                    if (arg2  instanceof GTems.GList)
                    {

                       for(var qs of  this.apply_rec( stk,sol,[], arg2.items, arg1.name  ) )
                          yield new Solution(SolutionState.QTrue, new GTems.GList(qs), {})
                        
                    } 
                }
            }
        


        //general call



        public *query_ar3(stk:QueryStack,sol: Solution, f_name: string, _arg1: GTems.GBase,_arg2: GTems.GBase,_arg3: GTems.GBase) {
            let hasY:boolean =false  
            for (var s of this.query_ar3_inner(stk,sol,f_name,_arg1,_arg2,_arg3) ) {
                yield s
                if (isValidSolution(s)) hasY= true 
            }
            if (hasY ==false && f_name.startsWith("ULS")==false   )
            {
                for (var sq of this.query_ar3_inner(stk,sol,"ULS"+f_name,_arg1,_arg2,_arg3) ) {
                    yield sq                   
                }   
            }
            return 
        }

        *query_ar3_inner(stk:QueryStack,sol: Solution, f_name: string, _arg1: GTems.GBase, _arg2: GTems.GBase, _arg3: GTems.GBase) {
            for(var x1 of  this.evaluate_query(stk,sol, _arg1)){ 
                if(isValidSolution(x1)){
                       let nsol =   fuseSolution(sol,x1)                       
                       for(var x2 of  this.evaluate_query(stk,nsol, _arg2)){ 
                        if(isValidSolution(x2)){
                               let nsol2 =   fuseSolution(nsol,x2)           
                               for(var x3 of  this.evaluate_query(stk,nsol2, _arg3)){ 
                                    if(isValidSolution(x3)){                                    
                                        let nsol3 = fuseSolution(nsol2,x3)           
                                            for(var z of  this.query_ar3_inner_argv(stk,nsol3, f_name, x1.value,x2.value , x3.value))
                                            {
                                                yield z
                                            }
                                    }
                               }
                        }         
                        }
                }
            }
        }

        *query_ar3_inner_argv(stk:QueryStack,sol: Solution, f_name: string, _arg1: GTems.GBase, _arg2: GTems.GBase,_arg3: GTems.GBase) {
            if (isArray(_arg1)) _arg1 = _arg1[0]
            if (isArray(_arg2)) _arg2 = _arg2[0]
            if (isArray(_arg3)) _arg3 = _arg3[0]

            let arg1 = _arg1
            let arg2 = _arg2 
            let arg3 = _arg3 
 

            let hasFound = false 
            let query_satisf:Boolean = false 
            for (var [i, p] of this.predicades.entries()) {

               // if (query_satisf)  continue

                if (p.entry.name != f_name) continue
                let pp = p.entry;
                if (pp instanceof GTems.Functor) {
                    hasFound =true 
                    if (pp.args.length != 3) continue
                    let pa0 = pp.args[0]
                    if (isArray(pa0)) pa0 = pa0[0]

                    let pa1 = pp.args[1]
                    if (isArray(pa1)) pa1 = pa1[0]

                    let pa2 = pp.args[2]
                    if (isArray(pa2)) pa2 = pa2[0]

                    if (stk.contains(p.unique_name ,arg1,arg2,arg3 )) continue //nao tenta de novo se ja estiver tetando dar query no mesmo predicado e nos mesmo parametros
                    let stk_next:QueryStack = stk.pushCall(p.unique_name ,arg1 ,arg2,arg3)


                    //arg1 nao rh uma variavel ..bind o argumento para o valor dela ..senao,bind na saida
                    let sol_next = new Solution(SolutionState.QTrue, atom_true(), {})
                    if (this.isVar(arg1) == false) { sol_next = bind(sol_next, pa0, arg1) }
                    if (this.isVar(arg2) == false) { sol_next = bind(sol_next, pa1, arg2) }
                    if (this.isVar(arg3) == false) { sol_next = bind(sol_next, pa2, arg3) }

                    //same parameter 
                    if (this.isVar(pa1) && this.isVar(pa2))
                    {
                        if (pa1 instanceof GTems.Variable)
                        if (pa2 instanceof GTems.Variable)
                        {
                          if (pa1.name == pa2.name)
                          {
                               
                          }
                        }
                    }

                    // testa a condicao de ativacao do predicado
                    let cond_satisf = true 
                    if ( isUndefined( p.condition ) ==false ) {
                        cond_satisf = false  
                        //testa a condicao
                        for (var sol_cond of this.evaluate_query(stk_next,sol_next, p.condition)) {
                            if (isValidSolution(sol_cond) )
                            {
                                cond_satisf = true 
                                break //apenas a primeira true ja serve
                            }
                        }
                    }
                    if (cond_satisf ==false ) continue  // nem testa o corpo .. proximo termo




                    if (isValidSolution(sol_next) ==false ) continue
                    for (var sol_next_inner of this.evaluate_query(stk_next,sol_next, p.value)) {
                        if (isValidSolution(sol_next_inner) ==false ) continue
                        sol_next_inner = fuseSolution(sol_next_inner , sol_next);
                        
                        let sol_n = new Solution(SolutionState.QTrue, atom_true(), {})
                        sol_n = fuseSolution(sol, sol_n) //just a copy 
                        if (this.isVar(arg1))  //arg1 eh uma variavel ? bind para o resultado 
                        {
                            let v_ret = getValue(sol_next_inner, pa0)
                            if (isUndefined(v_ret) == false) sol_n = bind(sol_n, v_ret, arg1)
                        }
                        if (isValidSolution(sol_n) ==false ) continue
                        if (this.isVar(arg2))  //arg1 eh uma variavel ? bind para o resultado 
                        {
                            let v_ret = getValue(sol_next_inner, pa1)
                            if (isUndefined(v_ret) == false) sol_n = bind(sol_n, v_ret, arg2)
                        }
                        if (isValidSolution(sol_n) ==false ) continue

                        if (this.isVar(arg3))  //arg1 eh uma variavel ? bind para o resultado 
                        {
                            let v_ret = getValue(sol_next_inner, pa2)
                            if (isUndefined(v_ret) == false) sol_n = bind(sol_n, v_ret, arg3)
                        }
                        if (isValidSolution(sol_n) ==false ) continue



                        query_satisf = true 
                        let ret = sol_n.add_value(sol_next_inner)
                        if (ret.state == SolutionState.QCut)
                        {
                            ret.state = SolutionState.QTrue;
                            yield ret
                            return                         
                        }
                        else    { 
                             yield ret
                        }
                    }
                }
            }
            if (f_name.startsWith("ULS")==false )
                if (hasFound ==false  ){
                    console.log("Predicate "+f_name + "/3  not found " )
                }
        }






        public *query_ar2(stk:QueryStack,sol: Solution, f_name: string, _arg1: GTems.GBase,_arg2: GTems.GBase) {
            let hasY:boolean =false  
            for (var s of this.query_ar2_inner(stk,sol,f_name,_arg1,_arg2) ) {
                yield s
                if (isValidSolution(s)) hasY= true 
            }
            if (hasY ==false && f_name.startsWith("ULS")==false   )
            {
                for (var sq of this.query_ar2_inner(stk,sol,"ULS"+f_name,_arg1,_arg2) ) {
                    yield sq                   
                }   
            }
            return 
        }


        *query_ar2_inner(stk:QueryStack,sol: Solution, f_name: string, _arg1: GTems.GBase, _arg2: GTems.GBase) {
            for(var x1 of  this.evaluate_query(stk,sol, _arg1)){ 
                if(isValidSolution(x1)){
                       let nsol =   fuseSolution(sol,x1)
                       
                       for(var x2 of  this.evaluate_query(stk,nsol, _arg2)){ 
                        if(isValidSolution(x2)){
                               let nsol2 =   fuseSolution(nsol,x2)                                 
                               for(var z of  this.query_ar2_inner_argv(stk,nsol2, f_name, x1.value,x2.value ))
                               {
                                   yield z
                               }
                        }
                    }
                }
            }
        }


        *query_ar2_inner_argv(stk:QueryStack,sol: Solution, f_name: string, _arg1: GTems.GBase, _arg2: GTems.GBase) {
            if (isArray(_arg1)) _arg1 = _arg1[0]
            if (isArray(_arg2)) _arg2 = _arg2[0]

            let arg1 = _arg1
            let arg2 = _arg2 

            if (f_name == "unify") {
                var bvar =   bind(sol, arg1, arg2)
                yield bvar
                return  
           }

           if (f_name == "equal") {
            var bvar_e =   bind(sol, arg1, arg2)
            if ( isValidSolution(bvar_e)) yield new Solution(bvar_e.state , atom_true(), {})
            else yield new Solution(bvar_e.state , atom_false(), {})
            return  
       }

           if (f_name == "append") {
        
            for (var qq of this.query_append(sol, arg1, arg2))    {
                yield qq
            }
            return
        }
            if (f_name == "and") {
                for (var qq of this.query_and(stk,sol, arg1, arg2)) 
                {
                    yield qq
                }
                return
            }
 
            if (f_name == "plus") {
                for(var ssk of this.buildIn_add(stk,sol, arg1, arg2) )  yield ssk
                //yield this.buildIn_add(stk,sol, arg1, arg2)
                return
            }

            if (f_name == "minus") {
                for(var ss8 of this.buildIn_minus(stk,sol, arg1, arg2) )  yield ss8
                //yield this.buildIn_minus(stk,sol, arg1, arg2)
                return
            }

            if (f_name == ">") {
                //yield this.buildIn_gt(stk,sol, arg1, arg2)
                for(var ss7 of this.buildIn_gt(stk,sol, arg1, arg2) )  yield ss7
                return
            }

            if (f_name == "<") {
                //yield this.buildIn_lt(stk,sol, arg1, arg2)
                for(var ss5 of this.buildIn_lt(stk,sol, arg1, arg2) )  yield ss5
                return
            }

            if (f_name == "*") {
               // yield this.buildIn_mul(stk,sol, arg1, arg2)
                for(var ss4 of this.buildIn_mul(stk,sol, arg1, arg2) )  
                {
                    yield ss4
                }
                return
            }

            if (f_name == "head") {
               // yield this.buildIn_head(stk,sol, arg1, arg2)
                for(var ss2 of this.buildIn_head(stk,sol, arg1, arg2) )  yield ss2
                return
            }

            if (f_name == "tail") {
                //yield this.buildIn_tail(stk,sol, arg1, arg2)
                for(var ss2 of this.buildIn_tail(stk,sol, arg1, arg2) )  yield ss2
                return
            }

            if (f_name == "maplist") {
                //yield this.buildIn_tail(stk,sol, arg1, arg2)
                for(var ssm of this.buildIn_maplist(stk,sol, arg1, arg2) )  yield ssm
                return
            }


            let hasFound = false 
            let query_satisf:Boolean = false 
            for (var [i, p] of this.predicades.entries()) {

               // if (query_satisf)  continue

                if (p.entry.name != f_name) continue
                let pp = p.entry;
                if (pp instanceof GTems.Functor) {
                    hasFound =true 
                    if (pp.args.length != 2) continue
                    let pa0 = pp.args[0]
                    if (isArray(pa0)) pa0 = pa0[0]

                    let pa1 = pp.args[1]
                    if (isArray(pa1)) pa1 = pa1[0]

                    if (stk.contains(p.unique_name ,arg1,arg2 )) continue //nao tenta de novo se ja estiver tetando dar query no mesmo predicado e nos mesmo parametros
                    let stk_next:QueryStack = stk.pushCall(p.unique_name ,arg1 ,arg2)


                    //arg1 nao rh uma variavel ..bind o argumento para o valor dela ..senao,bind na saida
                    let sol_next = new Solution(SolutionState.QTrue, atom_true(), {})
                    if (this.isVar(arg1) == false) { sol_next = bind(sol_next, pa0, arg1) }
                    if (this.isVar(arg2) == false) { sol_next = bind(sol_next, pa1, arg2) }


                    // testa a condicao de ativacao do predicado
                    let cond_satisf = true 
                    if ( isUndefined( p.condition ) ==false ) {
                        cond_satisf = false  
                        //testa a condicao
                        for (var sol_cond of this.evaluate_query(stk_next,sol_next, p.condition)) {
                            if (isValidSolution(sol_cond) )
                            {
                                cond_satisf = true 
                                break //apenas a primeira true ja serve
                            }
                        }
                    }
                    if (cond_satisf ==false ) continue  // nem testa o corpo .. proximo termo



                    if (isValidSolution(sol_next) ==false ) continue
                    for (var sol_next_inner of this.evaluate_query(stk_next,sol_next, p.value)) {
                        if (isValidSolution(sol_next_inner) ==false ) continue

                        let sol_n = new Solution(SolutionState.QTrue, atom_true(), {})
                        sol_n = fuseSolution(sol, sol_n) //just a copy 
                        if (this.isVar(arg1))  //arg1 eh uma variavel ? bind para o resultado 
                        {
                            let v_ret = getValue(sol_next_inner, pa0)
                            if (isUndefined(v_ret) == false) sol_n = bind(sol_n, v_ret, arg1)
                        }
                        if (isValidSolution(sol_n) ==false ) continue
                        if (this.isVar(arg2))  //arg1 eh uma variavel ? bind para o resultado 
                        {
                            let v_ret = getValue(sol_next_inner, pa1)
                            if (isUndefined(v_ret) == false) sol_n = bind(sol_n, v_ret, arg2)
                        }
                        if (isValidSolution(sol_n) ==false ) continue

                        query_satisf = true 
                        let ret = sol_n.add_value(sol_next_inner)
                        if (ret.state == SolutionState.QCut)
                        {
                            ret.state = SolutionState.QTrue;
                            yield ret
                            return                         
                        }
                        else    { 
                             yield ret
                        }
                    }
                }
            }
            if (f_name.startsWith("ULS")==false )
                if (hasFound ==false  ){
                    console.log("Predicate "+f_name + "/2  not found " )
                }
        }




        public *query_ar1(stk:QueryStack,sol: Solution, f_name: string, _arg1: GTems.GBase) {

            let hasY:boolean =false  
            for (var s of this.query_ar1_inner(stk,sol,f_name,_arg1) ) {
                yield s
                if (isValidSolution(s)) hasY= true 
            }
            if (hasY ==false && f_name.startsWith("ULS")==false   )
            {
                for (var sq of this.query_ar1_inner(stk,sol,"ULS"+f_name,_arg1) ) {
                    yield sq                   
                }   
            }
            return 
        }



        *query_ar1_inner(stk:QueryStack,sol: Solution, f_name: string, _arg1: GTems.GBase) {
            for(var x1 of  this.evaluate_query(stk,sol, _arg1)){ 
                if(isValidSolution(x1)){
                       let nsol =   fuseSolution(sol,x1)                                         
                               for(var z of  this.query_ar1_inner_argv(stk,nsol, f_name, x1.value ))
                               {
                                   yield z
                               }
                        }
             }
        }
            
        


        *query_ar1_inner_argv (stk:QueryStack,sol: Solution, f_name: string, _arg1: GTems.GBase) {



            if (isArray(_arg1)) _arg1 = _arg1[0]

            let arg1 = _arg1

            let value_1 = Array.from(this.evaluate_query(stk,sol, _arg1)).filter((x) => isValidSolution(x)).map((c) => c.value)

            if (value_1.length > 1) 
            {
                 for(var [i,q_arg1] of  value_1.entries())
                 {
                    for(var r_arg1 of  this.query_ar1_inner( stk, sol, f_name, q_arg1 )) yield r_arg1
                 }
                 return 
            }


            if (value_1.length > 0) arg1 = value_1[0] 
            else arg1 = atom_false()

            //let arg1 = getValue(sol, _arg1)
            //if (isUndefined(arg1)) arg1 = _arg1
            let query_satisf:Boolean = false 
            let hasFound = false 
            for (var [i, p] of this.predicades.entries()) {

               // if (query_satisf) continue
                if (p.entry.name != f_name) continue
                let pp = p.entry;
                if (pp instanceof GTems.Functor) {
                    if (pp.args.length != 1) continue
                    let pa0 = pp.args[0]
                    if (isArray(pa0)) pa0 = pa0[0]

                    hasFound = true  
                  
                    if (stk.contains(p.unique_name ,arg1 ))
                    {
                       console.log("Block "  )  
                       continue //nao tenta de novo se ja estiver tetando dar query no mesmo predicado e nos mesmo parametros
                    }
                   // console.log("pass " ,p.unique_name ,arg1 )  

                    let stk_next:QueryStack = stk.pushCall(p.unique_name ,arg1 )

                    //arg1 nao rh uma variavel ..bind o argumento para o valor dela ..senao,bind na saida
                    let sol_next = new Solution(SolutionState.QTrue, atom_true(), {})
                    if (this.isVar(arg1) == false) { sol_next = bind(sol_next, pa0, arg1) }

                    if (isValidSolution(sol_next ) ==false ) continue

                    // testa a condicao de ativacao do predicado
                    let cond_satisf = true 
                    if ( isUndefined( p.condition ) ==false  )  {
                        cond_satisf = false  
                        //testa a condicao
                        for (var sol_cond of this.evaluate_query(stk_next,sol_next, p.condition)) {
                            if (isValidSolution(sol_cond))
                            {
                                cond_satisf = true 
                                break //apenas a primeira true ja serve
                            }
                        }
                    }
                    if (cond_satisf ==false ) continue  // nem testa o corpo .. proximo termo


                    for (var sol_next_inner of this.evaluate_query(stk_next,sol_next, p.value)) {
                        if (isValidSolution(sol_next_inner) ==false ) continue

                        if (this.isVar(arg1) || isUndefined(arg1))  //arg1 eh uma variavel ? bind para o resultado 
                        {
                            let v_ret = getValue(sol_next_inner, pa0)
                            if (isUndefined(v_ret) == false) {
                                let sol_n = bind(sol, v_ret, arg1)
                                if (isValidSolution(sol_n)) {
                                    sol_n.value = sol_next_inner.value
                                    query_satisf = true 
                                    //yield sol_n

                                    let ret = sol_n
                                    if (ret.state == SolutionState.QCut)
                                    {
                                        ret.state = SolutionState.QTrue;
                                        yield ret
                                        return                         
                                    }
                                    else    { 
                                         yield ret
                                    }

                                    
                                }
                            }
                            else {
                                //valor do argumento continua sem binding .... mas a saida eh valida

                                query_satisf = true 
                                
                                let ret = sol.add_value(sol_next_inner)
                                if (ret.state == SolutionState.QCut)
                                {
                                    ret.state = SolutionState.QTrue;
                                    yield ret
                                    return                         
                                }
                                else    { 
                                     yield ret
                                }

                                //yield sol.add_value(sol_next_inner.value)
                                
                            }
                        }
                        else {

                            query_satisf = true 
                            let ret = sol.add_value(sol_next_inner )
                            if (ret.state == SolutionState.QCut)
                            {
                                ret.state = SolutionState.QTrue;
                                yield ret
                                return                         
                            }
                            else    { 
                                 yield ret
                            }

                            //yield sol.add_value(sol_next_inner.value)
                            

                        }
                    }
                }
            }

            //yield new Solution(SolutionState.QFalse, atom_false(), {})

            if (f_name.startsWith("ULS")==false )
                if (hasFound ==false  ){
                    console.log("Predicate "+f_name + "/1  not found " )
                }
            
        }




    } //class
} //namespace




