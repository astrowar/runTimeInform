var unify = require("./umain");

  type SGroup = string[];

class MatchTerm {

}

class MatchVar extends MatchTerm {
    public vname: string;
    constructor(_vname: string) {
        super();
        this.vname = _vname;
    }
};

class MatchLiteral extends MatchTerm { };


class MatchStringLiteral extends MatchLiteral {
    public str: string;
    constructor(_str: string) {
        super();
        this.str = _str;
    }
}

class VarAssigned {
    public var_name: string;
    public value: SGroup;
    constructor(_var_name: string, _value: SGroup) {
        this.var_name = _var_name;
        this.value = _value;
    }
    public toString(): string { return this.var_name + ":" + this.value }
}
type VarAssignedList = VarAssigned[];



class MatchResult {
   *entries() {
       
        for (var [i, s] of this.vars.entries()) {
            yield [ s.var_name , s.value]
        }
        return 
    }
    // public result: boolean
    //public vars: VarAssignedList
    public constructor(public result: boolean, public vars: VarAssignedList = []) {
        // this.result = result;
        // this.vars = vars;
    }
    public add(other: MatchResult): MatchResult {
        if ((this.result == false) || (other.result == false)) {
            return new MatchResult(false, [])
        }
        return new MatchResult(true, this.vars.concat(other.vars))
    }
}

      function   isMatch(x: SGroup, m: MatchTerm): MatchResult {
    //console.log(x," ",m)
    //return new MatchResult(true)
    if (m instanceof MatchStringLiteral) {
        if (x.length == 1)
            return new MatchResult(x[0] === m.str)
    }

    if (m instanceof MatchVar) {
        let mv: MatchVar = m as MatchVar

        return new MatchResult(true, [new VarAssigned(m.vname, x)])
    }
    return new MatchResult(false)

}

function* combinations(acc: MatchResult, xs: string[], ms: MatchTerm[]) {

    let n: number = ms.length
    if (n == 1) {
        let r = isMatch(xs, ms[0]);
        if (r.result) {
            yield acc.add(r)
        }

        return
    }

    let m = xs.length;

    if (m < n) return
    for (let i = 1; i < m; ++i) {
        let h = xs.slice(0, i)
        let hm = ms.slice(0, i)
        let rx = isMatch(h, ms[0])
        if (rx.result) {
            // let accNext = acc.concat([h])
            let accNext = acc.add(rx)
            let t = xs.slice(i, m)
            var mstail = ms.slice(1)
            for (let tt of combinations(accNext, t, mstail)) {
                yield tt;
            }
        }
    }
    return
}



    function termParser(x: string): MatchTerm {
    if (x[0] === x.toUpperCase() && x.length < 3) {
        return new MatchVar(x)
    }
    return new MatchStringLiteral(x)
    //return new MatchTerm()
}

function*  parseString(x: string, mstr: string)  {
    let xs = x.split(" ");
    xs = xs.filter(Boolean);
    let m = mstr.split(" ")
    m = m.filter(Boolean);
    if (xs.length < m.length) return  ;
    let ret: MatchResult[] = []
    var mterm = m.map(function (x) {
        return termParser(x)
    });
    for (let t of combinations(new MatchResult(true, []), xs, mterm)) {
         yield t;
    }
    return 
}


class Parser {




}


let line = "do book as red thing"

for (var vq of parseString(line, "do  X as  Y ")) {
    let v: MatchResult = <MatchResult>vq 
    for (var s of v.entries()) {
        console.log( s )
        
    }
}


line = "do Device(obj),on(obj) as false if not(contains(obj,bateries)) "
for (var vq of parseString(line, "do  X as  Y if Z"))
{
    let v: MatchResult = <MatchResult>vq
    for (var s of v.entries())
        console.log(s)
}


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