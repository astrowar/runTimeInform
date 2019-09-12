import { start } from "repl";
import { isUndefined } from "util";

var unify = require("./umain");
 /// <reference path="./mterms.ts" />
import * as mterms from "./mterms";


  type SGroup = string[];


type ITerm = mterms.UTerm.ITerm
var parseString = mterms.UTerm.parseString
type MatchResult = mterms.UTerm.MatchResult
var splitStringInput = mterms.UTerm.splitStringInput


class Parser {




}

class Pred {
    public name: string
    public args: string []
    constructor(predname: string, ...arg1 )
    {
        this.name = predname;
        this.args = arg1
    }
}

 
class Atom {
    public name: string 
    constructor(atm_name: string ) {
        this.name = atm_name; 
    }
}

//let line = "do book as red thing"

//for (var vq of parseString(line, "do  X as  Y ")) {
//    let v: MatchResult = <MatchResult>vq 
//    for (var s of v.entries()) {
//        console.log( s )
        
//    }
//}


//line = "do Device(obj),on(obj) as false if not(contains(obj,bateries)) "
//for (var vq of parseString(line, "do  X as  Y if Z"))
//{
//    let v: MatchResult = <MatchResult>vq
//    for (var s of v.entries())
//        console.log(s)
//}


 

namespace SyntaxParser {

    class Matchfunctior {
        constructor(public mstr: string, public func: any) { }
    }
    function* genPattens_ii(iline: ITerm[], matc: string) {

        {
            for (var vqxxxx of parseString(iline, matc)) {
                let vxxx: MatchResult = <MatchResult>vqxxxx
                let q = {}
                for (var sxxx of vxxx.entries())
                {
                    q[<string>sxxx[0]] = sxxx[1]
                    //yield sxxx
                }
                yield q
            }
        }
        return
    }

    function* genPattens_i(iline: ITerm[], matc: Matchfunctior[]) 
    {

        for (var [i, m] of matc.entries()) {
            let anskitp = false
            for (var rr of genPattens_ii(iline, m.mstr)) {
                yield ([rr, m.func])
                anskitp = true
            }
            //if (anskitp) break
        }
    }

    function resolve_args(args: ITerm[]) {
        let arg_b = []
        let acc: ITerm[] = []
        let n = args.length
        for (var i = 0; i < n; i++)
        {
            if (args[i].gettext() == ",") {
                if (acc.length > 0) arg_b.push(acc.map(function (t: ITerm) { return t.gettext(); }))
                acc = []
            }
            else {
                acc.push(args[i])
            }
        }
        if (acc.length > 0) arg_b.push(acc.map(function (t: ITerm) { return t.gettext(); }))
        return arg_b 
    }

    function isValidAtomName(pname: ITerm[]): boolean {
        if (pname.length != 1) return false
        let pstr = (pname.map(function (t: ITerm) { return t.gettext(); })).join()
        for (var c of pstr) {
            if (";.,()[]|&".indexOf(c) >= 0) {
                return false
            }
        }   
        return true
    }

    function pred_resolve(pname: ITerm[], args: ITerm[]) {
        if (pname.length != 1) return undefined
        let arg_a = resolve_args(args)

        if (isUndefined(arg_a)) return undefined
        if (isValidAtomName(pname)==false ) return undefined         
        

        return new Pred(pname[0].gettext(), ...arg_a)
    }

    function* pred_0(args_dict)
    {
        let pname: ITerm[] = args_dict["$pred"]
        if (isValidAtomName(pname)) {
            yield new Atom(pname[0].gettext())
        }
    }
    function* pred_1(args_dict)
    { 
        yield pred_resolve(args_dict["$pred"], args_dict["$A"])
    }

    function* pred_2(args_dict)
    {
        let pname: ITerm[] = args_dict["$pred"]
        if (pname.length != 1) return undefined
        let arg_a = args_dict["$A"].map(function (t: ITerm) {      return t.gettext();       });
        let arg_b = args_dict["$B"].map(function (t: ITerm) {      return t.gettext();        });
        yield new Pred(pname[0].gettext(), arg_a, arg_b)        
    }


    function* pred_and(args_dict) {
        let pname1: ITerm[] = args_dict["$pred1"]
        if (pname1.length != 1) return undefined
        let pname2: ITerm[] = args_dict["$pred2"]
        if (pname2.length != 1) return undefined
        let arg_1 = args_dict["$args1"]
        let arg_2 = args_dict["$args2"]
        let p1 = pred_resolve(pname1, arg_1)
        if (isUndefined(p1)) return undefined
        let p2 = pred_resolve(pname2, arg_2)
        if (isUndefined(p2)) return undefined        
        yield new Pred("and", p1,p2)
    }


    function* pred_rem(args_dict) {
        let pname1: ITerm[] = args_dict["$pred1"]
        if (pname1.length != 1) return undefined 
        let arg_1 = args_dict["$args1"] 
        let p1 = pred_resolve(pname1, arg_1)
        if (isUndefined(p1)) return undefined
        for (var pnext of predDecl(args_dict["$rem"]))
        {            
            if (isUndefined(pnext)) continue
            yield new Pred("and", p1, pnext)
        }
        return 
    }

    function* pred_rem_or(args_dict) {
        let pname1: ITerm[] = args_dict["$pred1"]
        if (pname1.length != 1) return undefined
        let arg_1 = args_dict["$args1"]
        let p1 = pred_resolve(pname1, arg_1)
        if (isUndefined(p1)) return undefined
        for (var pnext of predDecl(args_dict["$rem"])) {
            if (isUndefined(pnext)) continue
            yield new Pred("or", p1, pnext)
        }
        return
    }


    function* predDecl(args) {
        let basePathens = [
            new Matchfunctior("$pred1 ( $args1 ) , $pred2 ( $args2 )", pred_and),
            new Matchfunctior("$pred1 ( $args1 ) , $rem", pred_rem),
            new Matchfunctior("$pred1 ( $args1 ) | $rem", pred_rem_or),
            new Matchfunctior("$pred ( $A , $B )", pred_2),
            new Matchfunctior("$pred ( $A )", pred_1),            
            new Matchfunctior("$pred", pred_0)
        ]
        for (var vj of genPattens_i(args, basePathens)) {
            //console.dir(vj, { depth: null })
            for (var vv of vj[1](vj[0])) {
                if (isUndefined(vv) == false) yield vv
            }
        }
    }

    function syntax_xyz(args_dict)
    {
        let x = args_dict["$X"]
        let y = args_dict["$Y"]
        let z = args_dict["$Z"]
        for (var px of predDecl(x))
        {
            
             console.dir([px,y,z], { depth: null })
        }
    }

    function* codeBody(y) {
        yield y
    }

    function syntax_xy(args_dict)
    {
        let x = args_dict["$X"]
        let y = args_dict["$Y"]
        for (var px of predDecl(x))
        {
            for (var cy of codeBody(y))        {

                console.dir([px, cy, []], { depth: null })
            }

        }
    }
    function syntax_x(args_dict)
    {
        let x = args_dict["$X"]
        for (var px of predDecl(x))
        {
            console.dir([px, [], []], { depth: null })
        }
        
    }

    function linesSplit(xcode: string) {
        let n = xcode.length
        let xc = ""
        let xcs: string[] = []
        let p = 0;
        for (var i = 0; i < n; ++i) {
            if (xcode[i] == "{") {
                p = p + 1
            }
            if (xcode[i] == "}") {
                p = p - 1
            }
            if (p < 0) return undefined //error

            if (xcode[i] == "\n") {
                if (p == 0) {
                    if (xc.length > 0) xcs.push(xc)
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
        if (xc.length > 0) xcs.push(xc)
        return xcs
    }
    

    export function MatchSyntax(xcode: string) {

        let basePathens = [
            new Matchfunctior(   "do  $X as  $Y if $Z", syntax_xyz),
                new Matchfunctior(  "do  $X as  $Y ", syntax_xy),
                    new Matchfunctior(  "do  $X ", syntax_x)
        ]
        let xlines = linesSplit(xcode)
        for (var [i, iline] of xlines.entries()) {
            let sline = splitStringInput(iline)
            //console.log("code line ", splitStringInput(iline))
            for (var vj of genPattens_i(sline, basePathens)) {
                // console.dir(vj, { depth: null })
                vj[1](vj[0])
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

     
`

SyntaxParser.MatchSyntax(rulecodes)

console.log("______________________________")

let _x = unify.variable("x")
let _y = unify.variable("y")

var a = [42], b = [42];
a == b;  // false
a === b; // false


3
var c = { luck: 7, beta: 5 }, d = unify.open( { luck: _x   });
c == d;  // false
c === d; // false


let ev = unify(c, d)

console.log(unify(a, b)); // truthy
console.log(unify(c, d)); // truthy
console.log( _x.get(ev)); // truthy
console.log('Hello world');