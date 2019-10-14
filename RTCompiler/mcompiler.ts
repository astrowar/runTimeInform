import { start } from "repl";
import { isUndefined } from "util";


/// <reference path="./mterms.ts" />
//import * as mterms from "./mterms";

import { UTerm } from "./mterms";
import { GTems } from "./atoms";
import { Interp } from "./interp"
import { MParse } from "./parse";

 
 


type ITerm = UTerm.ITerm
var parseString = UTerm.parseString
 
var splitStringInput = UTerm.splitStringInput
 

namespace SyntaxParser {
 
   
    function resolve_as(args: ITerm[]) {
        let codeexpr = Array.from(codebodyMatch(args))
        if (codeexpr.length > 0) return codeexpr[0]

        //aqui ..................esta o problema das EXP dentro das Expo
        let q = args.map(function (t: ITerm) { return t.getGeneralTerm(); })
        return q;
    }

    function isBalanced(x: ITerm[]) {
        let n = x.length
        var x_par = 0
        var x_bra = 0
        var x_str = false

        for (var i = 0; i < n; ++i) {
            if (x[i].txt == ")") x_par = x_par - 1
            if (x[i].txt == "(") x_par = x_par + 1

            if (x[i].txt == "]") x_bra = x_bra - 1
            if (x[i].txt == "[") x_bra = x_bra + 1

            if (x[i].txt === '"') x_str = !x_str
            if (x_par < 0) return false
            if (x_bra < 0) return false

        }

        if (x_par !== 0) return false
        if (x_bra !== 0) return false
        if (x_str == true) return false
        return true

    }

    function resolve_args(args: ITerm[]) {

        
        if (args.length ==0 ) return []
        if (isBalanced(args) == false) return undefined

        let arg_b = []
        let acc: ITerm[] = []
        let n = args.length

        let args_c = splitTerms(args, ",")
        for (var [i, ac] of args_c.entries()) {
            let rac = resolve_as(ac)
            arg_b.push(rac)
        }
 
        return arg_b
    }

  
    function isValidAtomName(pname: ITerm[]): boolean {        
        if (pname.length != 1) return false
        let pstr = (pname.map(function (t: ITerm) { return t.gettext(); })).join()
        for (var c of pstr) {
            if (";.,()[]|&+-*/".indexOf(c) >= 0) {
                return false
            }
        }
        return true
    }
    function isValidAtomNameStr(pstr:  string): boolean {        
        if (pstr.length < 1) return false 
        for (var c of pstr) {
            if (";.,()[]|&+-*/".indexOf(c) >= 0) {
                return false
            }
        }
        if (pstr[0] == "$") return false 
        return true
    }

    function funct_resolve_2(pname: ITerm[], args: ITerm[],args2: ITerm[]) {
        if (pname.length != 1) return undefined
        let arg_a = resolve_args(args)
        if (isUndefined(arg_a)) return undefined

      
        let arg_a2 = resolve_args(args2)
        if (isUndefined(arg_a2)) return undefined
        
        
        if (isValidAtomName(pname) == false) return undefined 
        let patm = pname[0].getGeneralTerm() 
        arg_a = arg_a.concat(arg_a2)
        return new GTems.Functor(patm.toString(), ...arg_a)
    }

    function funct_resolve(pname: ITerm[], args: ITerm[]) {
        if (pname.length != 1) return undefined
        let arg_a = resolve_args(args)
        if (isUndefined(arg_a)) return undefined
        if (isValidAtomName(pname) == false) return undefined
        let patm = pname[0].getGeneralTerm() 
        return new GTems.Functor(patm.toString(), ...arg_a)
    }

    function* funct_0(args_dict) {
        let pname: ITerm[] = args_dict["$funct"]
         
        yield new GTems.Functor(pname[0].txt)
        //let r = pname[0].getGeneralTerm()
        //yield r
      
    }

    function* funct_z(args_dict) {
        let pname: ITerm[] = args_dict["$funct"]     
        if ( pname.length == 1 )    
                yield new GTems.Functor(pname[0].txt)
    }

    

    function* var_z(args_dict) {
        let pname: ITerm[] = args_dict["$variable"]     
        if ( pname.length == 1 )    
            if (pname[0].txt[0] === "$")
                yield new GTems.Variable(pname[0].txt.substr(1))
    }

    function* funct_1(args_dict) {
        yield funct_resolve(args_dict["$funct"], args_dict["$A"])
    }

    function* funct_2(args_dict) {
        let pname: ITerm[] = args_dict["$funct"]
        if (pname.length != 1) return undefined

        let arg_a = resolve_args(args_dict["$A"])
        if ( isUndefined( arg_a) ==false ){

                let arg_b = resolve_args(args_dict["$B"])
                if ( isUndefined( arg_b) ==false ){
                    let patm = pname[0].getGeneralTerm() 
                    arg_a = arg_a.concat(arg_b)
                    yield new GTems.Functor(patm.toString(), ...arg_a )
            }
        }
      
    }


    function* funct_and(args_dict) {
        let pname1: ITerm[] = args_dict["$funct1"]
        if (pname1.length != 1) return undefined
        let pname2: ITerm[] = args_dict["$funct2"]
        if (pname2.length != 1) return undefined
        let arg_1 = args_dict["$args1"]
        let arg_2 = args_dict["$args2"]
        let p1 = funct_resolve(pname1, arg_1)
        if (isUndefined(p1)) return undefined
        let p2 = funct_resolve(pname2, arg_2)
        if (isUndefined(p2)) return undefined
        yield new GTems.Functor("and", p1, p2)
    }


    function* funct_rem(args_dict) {
        let pname1: ITerm[] = args_dict["$funct1"]
        if (pname1.length != 1) return undefined
        let arg_1 = args_dict["$args1"]
        let p1 = funct_resolve(pname1, arg_1)
        if (isUndefined(p1)) return undefined
        for (var pnext of predDecl(args_dict["$rem"])) {
            if (isUndefined(pnext)) continue
            yield new GTems.Functor("and", p1, pnext)
        }
        return
    }

    function* funct_rem_or(args_dict) {
        let pname1: ITerm[] = args_dict["$funct1"]
        if (pname1.length != 1) return undefined
        let arg_1 = args_dict["$args1"]
        let p1 = funct_resolve(pname1, arg_1)
        if (isUndefined(p1)) return undefined
        for (var pnext of predDecl(args_dict["$rem"])) {
            if (isUndefined(pnext)) continue
            yield new GTems.Functor("or", p1, pnext)
        }
        return
    }


    function* predDecl(args) {
        let basePathens = [
            new MParse.Matchfunctior("$funct1 ( $args1 ) , $funct2 ( $args2 )", funct_and),
            new MParse.Matchfunctior("$funct1 ( $args1 ) , $rem", funct_rem),
            new MParse.Matchfunctior("$funct1 ( $args1 ) | $rem", funct_rem_or),
            //new MParse.Matchfunctior("$funct ( $A , $B )", funct_2),
            new MParse.Matchfunctior("$funct ( $A )", funct_1),
            new MParse.Matchfunctior("$funct (  )", funct_0),
            new MParse.Matchfunctior(" ( $A , $funct , $B )", funct_2),
            new MParse.Matchfunctior("$funct", funct_z)
        ]
        for (var vj of MParse.genPattens_i(args, basePathens)) { 
            let pool = []
            for (var vv of vj[1](vj[0])) {
                if (isUndefined(vv) == false) {
                    pool.push(vv)
                }
                else {
                    pool = [] //um termo nao deu certo .. invalida toda sequencia
                    break
                }
            } 
            //alimanta saida dos termos
            for (var [i, vv] of pool.entries()) yield vv
            if (pool.length > 0) break 
        }
    }


   
    function* predDeclSet(args) {
        let basePathens = [ 
            new MParse.Matchfunctior("$funct ( $A )", funct_1), 
            new MParse.Matchfunctior(" ( $A , $funct , $B )", funct_2)
        ]
        for (var vj of MParse.genPattens_i(args, basePathens)) { 
            let pool = []
            for (var vv of vj[1](vj[0])) {
                if (isUndefined(vv) == false) {
                    pool.push(vv)
                }
                else {
                    pool = [] //um termo nao deu certo .. invalida toda sequencia
                    break
                }
            } 
            //alimanta saida dos termos
            for (var [i, vv] of pool.entries()) yield vv
            if (pool.length > 0) break 
        }
    }

    function* predDecl0(args) {
        let basePathens = [     
            new MParse.Matchfunctior("$funct", funct_z)
        ]
        for (var vj of MParse.genPattens_i(args, basePathens)) { 
            let pool = []
            for (var vv of vj[1](vj[0])) {
                if (isUndefined(vv) == false) {
                    pool.push(vv)
                }
                else {
                    pool = [] //um termo nao deu certo .. invalida toda sequencia
                    break
                }
            } 
            //alimanta saida dos termos
            for (var [i, vv] of pool.entries()) yield vv
            if (pool.length > 0) break 
        }
    }

  

    function* varDecl0(args) {
        let basePathens = [     
            new MParse.Matchfunctior("$variable", var_z)
        ]
        for (var vj of MParse.genPattens_i(args, basePathens)) { 
            let pool = []
            for (var vv of vj[1](vj[0])) {
                if (isUndefined(vv) == false) {
                    pool.push(vv)
                }
                else {
                    pool = [] //um termo nao deu certo .. invalida toda sequencia
                    break
                }
            } 
            //alimanta saida dos termos
            for (var [i, vv] of pool.entries()) yield vv
            if (pool.length > 0) break 
        }
    }

    function* pmatch_or(args_dict) {
        let pname1: ITerm[] = args_dict["$term"]
        if (pname1.length != 1) return undefined       
        let p1 = pname1[0] 
        if (isUndefined(p1)) return undefined
        for (var pnext of understandDecl(args_dict["$rem"])) {
            if (isUndefined(pnext)) continue
            yield new GTems.Functor("or", p1.gettext(), pnext)
        }
        return
    }

    function* pmatch_item(args_dict) {
        let pname1: ITerm[] = args_dict["$term"]
        if (pname1.length != 1) return undefined       
        let p1 = pname1[0] 
        if (isUndefined(p1)) return undefined
        yield new GTems.LiteralStr(p1.gettext())
        return
    }


    function* understandDecl(args) {
        let basePathens = [
            new MParse.Matchfunctior("$term ; $rem", pmatch_or),
            new MParse.Matchfunctior("$term ", pmatch_item),
        ]
        for (var vj of MParse.genPattens_i(args, basePathens)) { 
            let pool = []
            for (var vv of vj[1](vj[0])) {
                if (isUndefined(vv) == false) {
                    pool.push(vv)
                }
                else {
                    pool = []
                    break
                }
            }             
            for (var [i, vv] of pool.entries()) yield vv
            if (pool.length > 0) break 
        }
    }




    // Serarate Terms by

    function splitTerms(x: ITerm[], sep: string) {
        let r = []
        let acc: ITerm[] = []
        let n = x.length
        var x_par = 0
        var x_bra = 0
        var x_str = false

        for (var i = 0; i < n; ++i) {
            if (x[i].txt == ")") x_par = x_par - 1
            if (x[i].txt == "(") x_par = x_par + 1

            if (x[i].txt == "]") x_bra = x_bra - 1
            if (x[i].txt == "[") x_bra = x_bra + 1

            if (x[i].txt === '"') x_str = !x_str

            if (x_bra == 0 && x_par == 0 && x_str == false) {
                if (x[i].txt === sep) {
                    if (acc.length > 0) r.push(acc)
                    acc = []
                    continue
                }
            }
            acc.push(x[i])
        }

        if (acc.length > 0) r.push(acc)
        return r
    }

    //==============================================================================================

    function* expr_inner(args_dict) {
        let pname: ITerm[] = args_dict["$X"]
        if (isUndefined(pname)) return undefined
        for (var cy of codebodyMatch(pname)) yield cy
    }

    function* expr_and(args_dict) {
        let x: ITerm[] = args_dict["$X"]
        let y: ITerm[] = args_dict["$Y"]
        for (var cx of codebodyMatch(x)) {
            if (isUndefined(cx)) continue
            for (var cy of codebodyMatch(y)) {
                if (isUndefined(cy)) continue
                yield new GTems.Functor("and", cx, cy)
            }
        }
    }

    function* expr_or(args_dict) {
        let x: ITerm[] = args_dict["$X"]
        let y: ITerm[] = args_dict["$Y"]
        for (var cx of codebodyMatch(x)) {
            if (isUndefined(cx)) continue
            for (var cy of codebodyMatch(y)) {
                if (isUndefined(cy)) continue
                yield new GTems.Functor("or", cx, cy)
            }
        }
    }

    function* expr_xy_operator(op_name: string, args_dict) {
        let x: ITerm[] = args_dict["$X"]
        let y: ITerm[] = args_dict["$Y"]
        for (var cx of codebodyMatch(x)) {
            if (isUndefined(cx)) continue
            for (var cy of codebodyMatch(y)) {
                if (isUndefined(cy)) continue
                yield new GTems.Functor(op_name, cx, cy)
            }
        }
    }



    function* expr_if_else(args_dict) {
        let x: ITerm[] = args_dict["$X"]
        let y: ITerm[] = args_dict["$Y"]
        let z: ITerm[] = args_dict["$Z"]
        for (var cx of codebodyMatch(x)) {
            if (isUndefined(cx)) continue
            for (var cy of codebodyMatch(y)) {
                if (isUndefined(cy)) continue
                for (var cz of codebodyMatch(z)) {
                    if (isUndefined(cz)) continue
                    yield new GTems.Functor("if_else", cx,cy,cz)
                }
            }
        }
    }
 
    function* expr_not(args_dict) {
        let x: ITerm[] = args_dict["$X"]
        for (var cx of codebodyMatch(x)) {
            if (isUndefined(cx)) continue
            yield new GTems.Functor("not", cx)
        }
    }
   

 
    function* expr_set(args_dict) {        
        for (var px of predDeclSet(args_dict["$X"])) {
            if (isUndefined(px)) continue
            yield new GTems.Functor("set", px)
        }
    }

    function* expr_reset(args_dict) {        
        for (var px of predDeclSet(args_dict["$X"])) {
            if (isUndefined(px)) continue
            yield new GTems.Functor("reset", px)
        }
    }

    function* expr_plus(args_dict) {
        for (var x of expr_xy_operator("plus", args_dict)) yield x
    }
    function* expr_minus(args_dict) {
        for (var x of expr_xy_operator("minus", args_dict)) yield x
    }

    function* expr_GT(args_dict) {
        for (var x of expr_xy_operator(">", args_dict)) yield x
    }
    function* expr_LT(args_dict) {
        for (var x of expr_xy_operator("<", args_dict)) yield x
    }

    function* expr_GTE(args_dict) {
        for (var x of expr_xy_operator(">=", args_dict)) yield x
    }
    function* expr_LTE(args_dict) {
        for (var x of expr_xy_operator("<=", args_dict)) yield x
    }


    function* expr_MUL(args_dict) {
        for (var x of expr_xy_operator("*", args_dict)) yield x
    }
    function* expr_DIV(args_dict) {
        for (var x of expr_xy_operator("/", args_dict)) yield x
    }
    function* expr_MOD(args_dict) {
        for (var x of expr_xy_operator("%", args_dict)) yield x
    }

    function* expr_UNIFY(args_dict) {
        for (var x of expr_xy_operator("unify", args_dict)) yield x
    }
    function* expr_EQUAL(args_dict) {
        for (var x of expr_xy_operator("equal", args_dict)) yield x
    }
    function* expr_ASIGN(args_dict) {
        for (var x of expr_xy_operator("assign", args_dict)) yield x
    }

    function* expr_NEQUAL(args_dict) {
        for (var x of expr_xy_operator("not_equal", args_dict)) yield x
    }

    function* expr_funct(args_dict) {
        let fname: ITerm[] = args_dict["$funct"]
        if (fname.length != 1) return undefined
        let fargs: ITerm[] = args_dict["$args"]
        if ( isUndefined(fargs) ==false ) 
        {  let p1 = funct_resolve(fname, fargs)
           yield p1
        }
    }

    function* expr_funct_m(args_dict) {
        let fname: ITerm[] = args_dict["$funct"]
        if (fname.length != 1) return undefined
        let fargs_1: ITerm[] = args_dict["$a1"]
        if ( isUndefined(fargs_1)  ==false  ) {

            let fargs_2: ITerm[] = args_dict["$a2"]
            if ( isUndefined(fargs_2) ==false ) 
                {  let p1 = funct_resolve_2(fname, fargs_1 ,fargs_2)
                yield p1
                }
      }
    }

    function* expr_funct_0(args_dict) {
        let fname: ITerm[] = args_dict["$funct"]
        if (fname.length != 1) return undefined
     
       
         let p1 = funct_resolve(fname, [])
           yield p1
        
    }



    function* expr_atorm_reserv(value: string) {
        if (value == "false") yield new GTems.LiteralBool(false)
        else if (value == "true") yield new GTems.LiteralBool(true)
        else yield new GTems.Atom(value)
    }



    function* expr_lst(args_dict) {

        let x: ITerm[] = args_dict["$X"]
        if (isUndefined(x)) {
            yield new GTems.GList([]) //empty list
            return
        }
        let xs: ITerm[][] = splitTerms(x, ",")

        let lst_x = []

        for (var [i, xj] of xs.entries()) {

            for (var cx of codebodyMatch(xj)) {
                if (isUndefined(cx)) {
                    return
                }
                lst_x.push(cx)
                break
            }

            yield new GTems.GList(lst_x)
        }
    }

    function* expr_literal(args_dict) {

        let x: ITerm[] = args_dict["$X"]
        if (x.length == 1) {

            yield (x[0].getGeneralTerm() )
            return 

            let n = Number(x[0].txt)
            if (isNaN(n) == false) {
                yield new GTems.LiteralNumber(n)
                return
            }
        }

     

        if (x.length == 2 ) {
            if (x[0].txt =='+' ) 
            {
                let n = Number(x[1].txt)
                if (isNaN(n) == false) { yield new GTems.LiteralNumber(n) } 
            }
            if (x[0].txt =='-' ) 
            {
                let n = Number(x[1].txt)
                if (isNaN(n) == false) { yield new GTems.LiteralNumber( -n) } 
            }

        }

        if (x.length == 1 ) 
         {   yield x[0].getGeneralTerm() } 
        else {  
            let all_str = []
            for( var [i,xx] of x.entries())
            {
                all_str.push(xx.gettext() )
            }
            let atm_name = all_str.join(" ")            
            if (isValidAtomNameStr(atm_name)) 
            { 
                yield new GTems.Atom(atm_name)  
            }
        }
    }


    function* codebodyMatch(args) {
        let basePathens = [
            new MParse.Matchfunctior("{ $X }", expr_inner),

            new MParse.Matchfunctior("true", (x) => { return expr_atorm_reserv("true") }),
            new MParse.Matchfunctior("false", (x) => { return expr_atorm_reserv("false") }),
            new MParse.Matchfunctior("fail", (x) => { return expr_atorm_reserv("fail") }),
            new MParse.Matchfunctior("done", (x) => { return expr_atorm_reserv("done") }),
            new MParse.Matchfunctior("!", (x) => { return expr_atorm_reserv("cut") }),

            new MParse.Matchfunctior("$X , $Y", expr_and),
            new MParse.Matchfunctior("$X ; $Y", expr_or),
            new MParse.Matchfunctior("$X = = $Y", expr_EQUAL),
            new MParse.Matchfunctior("$X : = $Y", expr_ASIGN),
            new MParse.Matchfunctior("$X ! = $Y", expr_NEQUAL),
            new MParse.Matchfunctior("$X = $Y", expr_UNIFY),

            new MParse.Matchfunctior("$X + $Y", expr_plus),
            new MParse.Matchfunctior("$X - $Y", expr_minus),

            new MParse.Matchfunctior("$X > $Y", expr_GT),
            new MParse.Matchfunctior("$X < $Y", expr_LT),

            new MParse.Matchfunctior("$X > = $Y", expr_GTE),
            new MParse.Matchfunctior("$X < = $Y", expr_LTE),


            new MParse.Matchfunctior("$X * $Y", expr_MUL),
            new MParse.Matchfunctior("$X / $Y", expr_DIV),
            new MParse.Matchfunctior("$X % $Y", expr_MOD),
            
            new MParse.Matchfunctior("if ( $X  ) $Y else $Z", expr_if_else),
            new MParse.Matchfunctior("not ( $X  )", expr_not),
            new MParse.Matchfunctior("set ( $X  )", expr_set),
            new MParse.Matchfunctior("reset ( $X  )", expr_reset),
            new MParse.Matchfunctior("$funct (   )", expr_funct_0),
            new MParse.Matchfunctior("$funct ( $args )", expr_funct),
            new MParse.Matchfunctior("( $a1 , $funct , $a2  )", expr_funct_m),
            new MParse.Matchfunctior("[ $X ]", expr_lst),
            new MParse.Matchfunctior("[ ]", expr_lst),


            new MParse.Matchfunctior("$X ", expr_literal)
        ]
        for (var vj of MParse.genPattens_i(args, basePathens)) {
            let pool = []
            for (var vv of vj[1](vj[0])) {
                if (isUndefined(vv) == false) {
                    pool.push(vv)
                }
                else {
                    pool = [] //um termo nao deu certo .. invalida toda sequencia
                    break
                }
            }

            //alimanta saida dos termos
            for (var [i, vv] of pool.entries()) yield vv
            if (pool.length > 0) break

        }
    }
    function* codeBody(y) {
        //maior e mais complexa funcao
        for (var cy of codebodyMatch(y)) {
            yield cy
        }
    }


    function syntax_xyz(args_dict, reFunc): boolean {
        let x = args_dict["$X"]
        let y = args_dict["$Y"]
        let z = args_dict["$Z"]
        for (var px of predDecl(x)) {
            for (var cy of codeBody(y)) {
                for (var cz of codeBody(z)) {
                    reFunc(px, cy, cz, [])
                    return true
                }
            }
        }
        return false
    }



    function syntax_xy(args_dict, reFunc): boolean {
        let x = args_dict["$X"]
        let y = args_dict["$Y"]
        for (var px of predDecl(x)) {
            for (var cy of codeBody(y)) {
                // console.dir([px, cy, []], { depth: null })
                reFunc(px, cy, undefined, [])
                return true
            }
        }
        return false
    }
    function syntax_x(args_dict, reFunc): boolean {
        let x = args_dict["$X"]
        for (var px of predDecl(x)) {
            //console.dir([px, [], []], { depth: null })
            reFunc(px, new GTems.LiteralBool(true), undefined, [])
            return true
        }
        return false
    }

    function const_xy(args_dict, reFunc): boolean {
        let x = args_dict["$X"]
        let y = args_dict["$Y"]
        for (var px of predDecl0(x)) {
            for (var cy of codeBody(y)) {              
                reFunc(px, cy, undefined, ["const"])
                return true
            }
        }
        return false
    }

    function var_xy(args_dict, reFunc): boolean {
        let x = args_dict["$X"]
        let y = args_dict["$Y"]
        for (var px of varDecl0(x)) {
            for (var cy of codeBody(y)) {              
                reFunc(px, cy, undefined, ["var"])
                return true
            }
        }
        return false
    }
 
   
    function let_xy(args_dict, reFunc): boolean {
        return syntax_xy(args_dict, (p, body, cond, poptions) => { p.name =   p.name; reFunc(p, body, cond, poptions.concat(["let"])) })
    }
  
    function understand_xy(args_dict, reFunc): boolean {
        let x = args_dict["$X"]
        let y = args_dict["$Y"]
        for (var px of understandDecl(x)) {
            for (var cy of codeBody(y)) { 
                reFunc(px, cy, undefined, ["understand"])
                return true
            }
        }
        return false
    }


    function unless_xyz(args_dict, reFunc): boolean {
        return syntax_xyz(args_dict, (p, body, cond, poptions) => { p.name =   p.name; reFunc(p, body, cond, poptions.concat(["unless"])) })
    }

    function unless_xy(args_dict, reFunc): boolean {
        return syntax_xy(args_dict, (p, body, cond, poptions) => { p.name =   p.name; reFunc(p, body, cond, poptions.concat(["unless"])) })
    }

    function unless_x(args_dict, reFunc): boolean {
        return syntax_x(args_dict, (p, body, cond, poptions) => { p.name =   p.name; reFunc(p, body, cond, poptions.concat(["unless"])) })
    }

    function syntax_xyz_direct(args_dict, reFunc): boolean {
        return syntax_xyz(args_dict, (p, body, cond, poptions) => { reFunc(p, body, cond, poptions.concat(["direct"])) })
    }

    function syntax_xy_direct(args_dict, reFunc): boolean {
        return syntax_xy(args_dict, (p, body, cond, poptions) => { reFunc(p, body, cond, poptions.concat(["direct"])) })
    }

    function syntax_x_direct(args_dict, reFunc): boolean {
        return syntax_x(args_dict, (p, body, cond, poptions) => { reFunc(p, body, cond, poptions.concat(["direct"])) })
    }



    function syntax_xyz_low(args_dict, reFunc): boolean {
        return syntax_xyz(args_dict, (p, body, cond, poptions) => { reFunc(p, body, cond, poptions.concat(["lowP"])  ) })
    }

    function syntax_xy_low(args_dict, reFunc): boolean {
        return syntax_xy(args_dict, (p, body, cond, poptions) => { reFunc(p, body, cond, poptions.concat(["lowP"])) })
    }

    function syntax_x_low(args_dict, reFunc): boolean {
        return syntax_x(args_dict, (p, body, cond, poptions) => { reFunc(p, body, cond, poptions.concat(["lowP"])   ) })
    }

    function syntax_xyz_high(args_dict, reFunc): boolean {
        return syntax_xyz(args_dict, (p, body, cond, poptions) => { reFunc(p, body, cond, poptions.concat(["highP"])  ) })
    }

    function syntax_xy_high(args_dict, reFunc): boolean {
        return syntax_xy(args_dict, (p, body, cond, poptions) => { reFunc(p, body, cond, poptions.concat(["highP"])  ) })
    }

    function syntax_x_high(args_dict, reFunc): boolean {
        return syntax_x(args_dict, (p, body, cond, poptions) => { reFunc(p, body, cond, poptions.concat(["highP"])  ) })
    }



    function before_x(args_dict, reFunc): boolean {
        return syntax_x(args_dict, reFunc)
    }
    function before_xy(args_dict, reFunc): boolean {
        return syntax_xy(args_dict, reFunc)
    }

    function before_xyz(args_dict, reFunc): boolean {
        return syntax_xyz(args_dict, reFunc)
    }

 
    

    class LineCode {
        constructor(public line: string , public addr: number, public linenumber: number   ) { }
    }


    function linesSplit(xcode: string) {
        let n = xcode.length
        let xc = ""
        let xcs: LineCode[] = []
        let p = 0;
        let lc =0 
        let comment = false 
        for (var i = 0; i < n; ++i) {
            if (xcode[i] =="/" && i <n-1 ) if (xcode[i+1] == "/") { 
                // pula para o fim da linha  
                while (xcode[i] !== "\n" && i< n) i++   
                continue             
            }

            if (xcode[i] == "\n") lc= lc+1
            if (xcode[i] == "\r") continue

            if (xcode[i] == "{") {
                p = p + 1
            }
            if (xcode[i] == "}") {
                p = p - 1
            }
            if (p < 0) return undefined //error

            if (xcode[i] == "\n") {                
                if (p == 0) {
                    if (xc.length > 0) xcs.push(new LineCode(xc, i, lc))
                    xc = ""
                }
                else {
                    xc = xc + " \n "
                }
            }
            else {
                xc = xc + xcode[i]
            }
        }
        if (xc.length > 0) xcs.push(new LineCode(xc, i, lc))
        return xcs
    }


    function isEmptyLine(x:string ):boolean
    {
        var regex = /^\s+$/;
        if (x.match(regex)) return true 
        return false 
    }

    export function MatchSyntaxDecl(xcode: string, resolutionFunc) {

        let basePathens = [

           // new MParse.Matchfunctior("do $X = > $Y if $Z", syntax_xyz_direct),
            new MParse.Matchfunctior("do $X = > $Y ", syntax_xy_direct),
          


           // new MParse.Matchfunctior("do -  $X as $Y if $Z", syntax_xyz_low),
            new MParse.Matchfunctior("do -  $X as $Y ", syntax_xy_low),
            new MParse.Matchfunctior("do -  $X  ", syntax_x_low),

           // new MParse.Matchfunctior("do +  $X as $Y if $Z", syntax_xyz_high),
            new MParse.Matchfunctior("do +  $X as $Y ", syntax_xy_high),
            new MParse.Matchfunctior("do +  $X  ", syntax_x_high),

          //  new MParse.Matchfunctior("do  $X as $Y if $Z", syntax_xyz),
            new MParse.Matchfunctior("do  $X as $Y ", syntax_xy),
            new MParse.Matchfunctior("do  $X  ", syntax_x),

           // new MParse.Matchfunctior("do  $X as $Y if $Z", syntax_xyz),
            new MParse.Matchfunctior("do  $X as $Y ", syntax_xy),
            new MParse.Matchfunctior("do  $X  ", syntax_x),

          //  new MParse.Matchfunctior("unless  $X as $Y if $Z", unless_xyz),
            new MParse.Matchfunctior("unless  $X as $Y ", unless_xy),
            new MParse.Matchfunctior("unless  $X  ", unless_x), 

            new MParse.Matchfunctior("do  $X  ?.", syntax_x),


            new MParse.Matchfunctior("let  $X as $Y ", let_xy), 
            new MParse.Matchfunctior("understand   $X as $Y ", understand_xy), 

         //   new MParse.Matchfunctior("before  $X as  $Y if $Z", before_xyz),
            new MParse.Matchfunctior("before  $X as  $Y ", before_xy),
            new MParse.Matchfunctior("before  $X ", before_x),


            new MParse.Matchfunctior("const  $X as  $Y ", const_xy),
            new MParse.Matchfunctior("var   $X as  $Y ", var_xy)

 
        ]
        let xlines = linesSplit(xcode)
        for (var [i, iline] of xlines.entries()) {
 
            if (isEmptyLine(iline.line)) continue
            let sline = splitStringInput(iline.line)

            let has_code: boolean = false
            for (var vj of MParse.genPattens_i(sline, basePathens)) {
                has_code = vj[1](vj[0], resolutionFunc)
                if (has_code) break
            }
            if (has_code ==false )
            {
               console.log("Syntax Error at Line "+ iline.linenumber )    
               return 
            }
        }
    }

    export function MatchSyntaxGoal(xcode: string, resolutionFunc) {
        let xlines = linesSplit(xcode)
        for (var [i, iline] of xlines.entries()) {
            let sline = splitStringInput(iline.line)
            let hasE = false 
            for (var px of codebodyMatch(sline)) 
            {
                let s = resolutionFunc(px)
                hasE = true 
                break
            }
            if (hasE ==false ){
                console.log("Syntax Error at Line "+ iline.linenumber )    
                return 
            }
        }
    }

}

let ancode = `
do lit($r),Room($r) as true if contains($r,$d), lit($d)
do class(Thing).
do class(Room).
do Thing(  book).
do Localtion(  book) as limbo
do Room(limbo).

//condicao default de todas as salas
do lit(Room) as false.    
 
do lit(flashlight) as on(flashlight)
do on(flashlight) as state(flashlight, on)
do state(flashlight, on|off) 
do desc(flashlight) as "an flashligh,usefull for lit "

`


let rulecodes = ` 
do Thing($obj),concealed($obj) | visible($obj) as true

      do  concealed($obj) as false if discovered($obj)
      do  concealed($obj) as true if carried($obj,$person),wear($person,something),small($obj)
      do  concealed($obj) as false  
      do  look($obj) as {
          print("Message");
          score := score + 1
      }
//understand "flash" or "light" as flashlight. 
do alias("flash","flashlight").
do alias("light","flashlight") .

do alias("the flashlight",flashlight).
do state(flashlight,lit|unlit).

do state(flashlight) as unlit.

do action(finding).
do command("find [something]") as finding.

carry_out  finding(flashlight) as { 
    if location(player)==location(flashlight) {
       move( flashlight, player)
       now( flashlight, lit)
       say("You grope around in the darkness, find the flashlight and turn it back on.") 
       action_stop()
     }

before going(south,Lighted Area) as {
    say "you need to take the flashlight before traveling into the dark.";
    action_stop()
   }  if location(player)!=location(flashlight)  
`

let prices = `

    do price_contents($obj) as {  $contents = findall($x, inside($x ,$obj)) ,  maplist( price, $contents, $prices ) , sum($prices)   }  if container($obj)

    const price_teasure as 10
    const price_to_clean as 2

    do- price($obj) as 0
    do price($obj) as price_teasure if Teasure(obj)    
    do price($obj) as { price($obj) + price_contents($obj)  }  if Container($obj)
    do price($obj) as { price($obj) - price_to_clean }  if dirt($obj)
    do+ price($obj) as {  max( 0 , price($obj) )  } 
    
unless r($x,$y,$c) as r($x,$z,$c1),r($z,$y,$c2), $c = - 1
do r( a,b,1).
do r( b,c,1).
do r( c,d,2).
do r( d,f,1).
do r( a,e,5).
do r( e,f,5).

    `

let simple = `
 
 

 

`


function processScript(src:string):Interp.Context {

   let ctx = new Interp.Context()
   SyntaxParser.MatchSyntaxDecl(src, (x, y, z, prio) => { return ctx.addPredicateFunc(x, y, z, prio) })
   return ctx
}

var fs = require('fs');


let ctx :Interp.Context = undefined
let script_filename = 'script.txt'
if (fs.existsSync(script_filename) ) {
    var s = fs.readFileSync(script_filename,'utf8');
   ctx = processScript(s)
}
else{
    throw "Script " + script_filename+" File Not found"
}
ctx.init()



SyntaxParser.MatchSyntaxGoal(" main( ) ", (x) => { console.dir(ctx.all_query(x).map((s ) => { return s.toString() }), { depth: null }) })


console.log('end');