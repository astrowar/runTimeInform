"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("util");
var unify = require("./umain");
/// <reference path="./mterms.ts" />
//import * as mterms from "./mterms";
const mterms_1 = require("./mterms");
const atoms_1 = require("./atoms");
const interp_1 = require("./interp");
var parseString = mterms_1.UTerm.parseString;
var splitStringInput = mterms_1.UTerm.splitStringInput;
class Parser {
}
//class Pred {
//    public name: string
//    public args: string []
//    constructor(predname: string, ...arg1 )
//    {
//        this.name = predname;
//        this.args = arg1
//    }
//}
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
var SyntaxParser;
(function (SyntaxParser) {
    class Matchfunctior {
        constructor(mstr, func) {
            this.mstr = mstr;
            this.func = func;
        }
    }
    function* genPattens_ii(iline, matc) {
        {
            for (var vqxxxx of parseString(iline, matc)) {
                let vxxx = vqxxxx;
                let q = {};
                for (var sxxx of vxxx.entries()) {
                    q[sxxx[0]] = sxxx[1];
                    //yield sxxx
                }
                yield q;
            }
        }
        return;
    }
    class MFragmentKind {
        constructor(txt, optional) {
            this.txt = txt;
            this.optional = optional;
            if (this.optional) {
                if (this.txt[0] == '(') {
                    this.txt = this.txt.slice(1, this.txt.length - 1);
                }
            }
        }
    }
    function find_end_term(m, j) {
        let n = m.length;
        let p = 0;
        for (let i = j; i < n; ++i) {
            if ((m[i] == ' ') && (p == 0))
                return i;
            if (m[i] == '(')
                p = p + 1;
            if (m[i] == ')') {
                if (p == 1)
                    return i + 1;
                p = p - 1;
            }
        }
        return n;
    }
    function classifySegments(m) {
        let n = m.length;
        let terms = [];
        let i = 0;
        let pivot = 0;
        while (i < n) {
            if (m[i] == '?') {
                if (i - 1 > pivot)
                    terms.push(new MFragmentKind(m.slice(pivot, i - 1), false));
                let j = find_end_term(m, i + 1);
                terms.push(new MFragmentKind(m.slice(i + 1, j), true));
                pivot = j;
            }
            i++;
        }
        if (n > pivot)
            terms.push(new MFragmentKind(m.slice(pivot, n), false));
        return terms;
    }
    function* expand_rem(acc, rem) {
        if (rem.length == 0) {
            yield acc.join(" ");
        }
        else {
            let acc_nex = acc.concat([rem[0].txt]);
            for (var x of expand_rem(acc_nex, rem.slice(1))) {
                yield x;
            }
            if (rem[0].optional) {
                for (var x of expand_rem(acc, rem.slice(1))) {
                    yield x;
                }
            }
        }
    }
    function* expand_i(m) {
        //separa em fix segments e optional  
        let n = m.length;
        let terms = classifySegments(m);
        for (var mx of expand_rem([], terms)) {
            yield mx;
        }
        //yield m
    }
    function expand(matc) {
        let ret = [];
        for (var [i, m] of matc.entries()) {
            for (var mii of expand_i(m.mstr)) {
                ret.push(new Matchfunctior(mii, m.func));
            }
        }
        return ret;
    }
    function* genPattens_i(iline, matc) {
        let matc_ex = expand(matc);
        for (var [i, m] of matc_ex.entries()) {
            let anskitp = false;
            for (var rr of genPattens_ii(iline, m.mstr)) {
                yield ([rr, m.func]);
                anskitp = true;
            }
            //if (anskitp) break
        }
    }
    function resolve_as(args) {
        let q = args.map(function (t) { return t.getGeneralTerm(); });
        return q;
    }
    function resolve_args(args) {
        let arg_b = [];
        let acc = [];
        let n = args.length;
        for (var i = 0; i < n; i++) {
            if (args[i].isLiteral() == false && args[i].gettext() == ",") {
                if (acc.length > 0)
                    arg_b.push(resolve_as(acc));
                acc = [];
            }
            else {
                acc.push(args[i]);
            }
        }
        if (acc.length > 0)
            arg_b.push(resolve_as(acc));
        return arg_b;
    }
    function isValidAtomName(pname) {
        if (pname.length != 1)
            return false;
        let pstr = (pname.map(function (t) { return t.gettext(); })).join();
        for (var c of pstr) {
            if (";.,()[]|&".indexOf(c) >= 0) {
                return false;
            }
        }
        return true;
    }
    function funct_resolve(pname, args) {
        if (pname.length != 1)
            return undefined;
        let arg_a = resolve_args(args);
        if (util_1.isUndefined(arg_a))
            return undefined;
        if (isValidAtomName(pname) == false)
            return undefined;
        let patm = pname[0].getGeneralTerm();
        return new atoms_1.GTems.Functor(patm.toString(), ...arg_a);
    }
    function* funct_0(args_dict) {
        let pname = args_dict["$funct"];
        return pname[0].getGeneralTerm();
        if (isValidAtomName(pname)) {
            yield new atoms_1.GTems.Atom(pname[0].gettext());
        }
    }
    function* funct_1(args_dict) {
        yield funct_resolve(args_dict["$funct"], args_dict["$A"]);
    }
    function* funct_2(args_dict) {
        let pname = args_dict["$funct"];
        if (pname.length != 1)
            return undefined;
        //let arg_a = args_dict["$A"].map(function (t: ITerm) {      return t.gettext();       });
        //let arg_b = args_dict["$B"].map(function (t: ITerm) { return t.gettext(); });
        let p = funct_resolve(pname, [args_dict["$A"], args_dict["$B"]]);
        if (p != null)
            yield p;
        //yield new GTems.Functor(pname[0].gettext(), arg_a, arg_b)        
    }
    function* funct_and(args_dict) {
        let pname1 = args_dict["$funct1"];
        if (pname1.length != 1)
            return undefined;
        let pname2 = args_dict["$funct2"];
        if (pname2.length != 1)
            return undefined;
        let arg_1 = args_dict["$args1"];
        let arg_2 = args_dict["$args2"];
        let p1 = funct_resolve(pname1, arg_1);
        if (util_1.isUndefined(p1))
            return undefined;
        let p2 = funct_resolve(pname2, arg_2);
        if (util_1.isUndefined(p2))
            return undefined;
        yield new atoms_1.GTems.Functor("and", p1, p2);
    }
    function* funct_rem(args_dict) {
        let pname1 = args_dict["$funct1"];
        if (pname1.length != 1)
            return undefined;
        let arg_1 = args_dict["$args1"];
        let p1 = funct_resolve(pname1, arg_1);
        if (util_1.isUndefined(p1))
            return undefined;
        for (var pnext of predDecl(args_dict["$rem"])) {
            if (util_1.isUndefined(pnext))
                continue;
            yield new atoms_1.GTems.Functor("and", p1, pnext);
        }
        return;
    }
    function* funct_rem_or(args_dict) {
        let pname1 = args_dict["$funct1"];
        if (pname1.length != 1)
            return undefined;
        let arg_1 = args_dict["$args1"];
        let p1 = funct_resolve(pname1, arg_1);
        if (util_1.isUndefined(p1))
            return undefined;
        for (var pnext of predDecl(args_dict["$rem"])) {
            if (util_1.isUndefined(pnext))
                continue;
            yield new atoms_1.GTems.Functor("or", p1, pnext);
        }
        return;
    }
    function* predDecl(args) {
        let basePathens = [
            new Matchfunctior("$funct1 ( $args1 ) , $funct2 ( $args2 )", funct_and),
            new Matchfunctior("$funct1 ( $args1 ) , $rem", funct_rem),
            new Matchfunctior("$funct1 ( $args1 ) | $rem", funct_rem_or),
            //new Matchfunctior("$funct ( $A , $B )", funct_2),
            new Matchfunctior("$funct ( $A )", funct_1),
            new Matchfunctior("$funct", funct_0)
        ];
        for (var vj of genPattens_i(args, basePathens)) {
            //console.dir(vj, { depth: null })
            for (var vv of vj[1](vj[0])) {
                if (util_1.isUndefined(vv) == false)
                    yield vv;
            }
        }
    }
    function syntax_xyz(args_dict) {
        let x = args_dict["$X"];
        let y = args_dict["$Y"];
        let z = args_dict["$Z"];
        for (var px of predDecl(x)) {
            console.dir([px, y, z], { depth: null });
        }
    }
    function* codeBody(y) {
        yield y;
    }
    function syntax_xy(args_dict) {
        let x = args_dict["$X"];
        let y = args_dict["$Y"];
        for (var px of predDecl(x)) {
            for (var cy of codeBody(y)) {
                console.dir([px, cy, []], { depth: null });
            }
        }
    }
    function syntax_x(args_dict) {
        let x = args_dict["$X"];
        for (var px of predDecl(x)) {
            console.dir([px, [], []], { depth: null });
        }
    }
    function before_x(args_dict) {
        syntax_x(args_dict);
    }
    function before_xy(args_dict) {
        syntax_xy(args_dict);
    }
    function before_xyz(args_dict) {
        syntax_xyz(args_dict);
    }
    function linesSplit(xcode) {
        let n = xcode.length;
        let xc = "";
        let xcs = [];
        let p = 0;
        for (var i = 0; i < n; ++i) {
            if (xcode[i] == "{") {
                p = p + 1;
            }
            if (xcode[i] == "}") {
                p = p - 1;
            }
            if (p < 0)
                return undefined; //error
            if (xcode[i] == "\n") {
                if (p == 0) {
                    if (xc.length > 0)
                        xcs.push(xc);
                    xc = "";
                }
                else {
                    xc = xc + " \n ";
                }
            }
            else {
                xc = xc + xcode[i];
            }
        }
        if (xc.length > 0)
            xcs.push(xc);
        return xcs;
    }
    function MatchSyntax(xcode) {
        let basePathens = [
            new Matchfunctior("do  $X as $Y ?(if $Z)", syntax_xyz),
            new Matchfunctior("do  $X as $Y ", syntax_xy),
            new Matchfunctior("do  $X  ", syntax_x),
            new Matchfunctior("do  $X  ?.", syntax_x),
            new Matchfunctior("before  $X as  $Y if $Z", before_xyz),
            new Matchfunctior("before  $X as  $Y ", before_xy),
            new Matchfunctior("before  $X ", before_x)
        ];
        let xlines = linesSplit(xcode);
        for (var [i, iline] of xlines.entries()) {
            let sline = splitStringInput(iline);
            //console.log("code line ", splitStringInput(iline))
            for (var vj of genPattens_i(sline, basePathens)) {
                // console.dir(vj, { depth: null })
                vj[1](vj[0]);
            }
        }
    }
    SyntaxParser.MatchSyntax = MatchSyntax;
})(SyntaxParser || (SyntaxParser = {}));
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

`;
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
`;
let simple = `
    do mortal($X) as true
    do human(socrates) as true

`;
SyntaxParser.MatchSyntax(simple);
console.log("______________________________");
let _x = unify.variable("x");
let _y = unify.variable("y");
var a = [42], b = [42];
a == b; // false
a === b; // false
3;
var c = { luck: 7, beta: 5 }, d = unify.open({ luck: _x });
c == d; // false
c === d; // false
let ev = unify(c, d);
console.log(unify(a, b)); // truthy
console.log(unify(c, d)); // truthy
console.log(_x.get(ev)); // truthy
console.log('Hello world 4589');
let term_1 = new atoms_1.GTems.Functor('mortal', [new atoms_1.GTems.Variable('X')]);
let term_2 = new atoms_1.GTems.Functor('human', [new atoms_1.GTems.Atom('socrates')]);
let ctx = new interp_1.Interp.Context();
ctx.addPredicateFunc(term_1, []);
ctx.addPredicateFunc(term_2, []);
for (var sol of ctx.query_ar1("human", new atoms_1.GTems.Variable('Z'))) {
    console.dir(sol, { depth: null });
}
console.log('end log');
//# sourceMappingURL=mcompiler.js.map