var unify = require("./umain");
class MatchTerm {
}
class MatchVar extends MatchTerm {
    constructor(_vname) {
        super();
        this.vname = _vname;
    }
}
;
class MatchLiteral extends MatchTerm {
}
;
class MatchStringLiteral extends MatchLiteral {
    constructor(_str) {
        super();
        this.str = _str;
    }
}
class VarAssigned {
    constructor(_var_name, _value) {
        this.var_name = _var_name;
        this.value = _value;
    }
    toString() { return this.var_name + ":" + this.value; }
}
class MatchResult {
    // public result: boolean
    //public vars: VarAssignedList
    constructor(result, vars = []) {
        this.result = result;
        this.vars = vars;
        // this.result = result;
        // this.vars = vars;
    }
    *entries() {
        for (var [i, s] of this.vars.entries()) {
            yield [s.var_name, s.value];
        }
        return;
    }
    add(other) {
        if ((this.result == false) || (other.result == false)) {
            return new MatchResult(false, []);
        }
        return new MatchResult(true, this.vars.concat(other.vars));
    }
}
function isMatch(x, m) {
    //console.log(x," ",m)
    //return new MatchResult(true)
    if (m instanceof MatchStringLiteral) {
        if (x.length == 1)
            return new MatchResult(x[0] === m.str);
    }
    if (m instanceof MatchVar) {
        let mv = m;
        return new MatchResult(true, [new VarAssigned(m.vname, x)]);
    }
    return new MatchResult(false);
}
function* combinations(acc, xs, ms) {
    let n = ms.length;
    if (n == 1) {
        let r = isMatch(xs, ms[0]);
        if (r.result) {
            yield acc.add(r);
        }
        return;
    }
    let m = xs.length;
    if (m < n)
        return;
    for (let i = 1; i < m; ++i) {
        let h = xs.slice(0, i);
        let hm = ms.slice(0, i);
        let rx = isMatch(h, ms[0]);
        if (rx.result) {
            // let accNext = acc.concat([h])
            let accNext = acc.add(rx);
            let t = xs.slice(i, m);
            var mstail = ms.slice(1);
            for (let tt of combinations(accNext, t, mstail)) {
                yield tt;
            }
        }
    }
    return;
}
function termParser(x) {
    if (x[0] === x.toUpperCase() && x.length < 3) {
        return new MatchVar(x);
    }
    return new MatchStringLiteral(x);
    //return new MatchTerm()
}
function* parseString(x, mstr) {
    let xs = x.split(" ");
    xs = xs.filter(Boolean);
    let m = mstr.split(" ");
    m = m.filter(Boolean);
    if (xs.length < m.length)
        return;
    let ret = [];
    var mterm = m.map(function (x) {
        return termParser(x);
    });
    for (let t of combinations(new MatchResult(true, []), xs, mterm)) {
        yield t;
    }
    return;
}
class Parser {
}
let line = "do book as red thing";
for (var vq of parseString(line, "do  X as  Y ")) {
    let v = vq;
    for (var s of v.entries()) {
        console.log(s);
    }
}
line = "do Device(obj),on(obj) as false if not(contains(obj,bateries)) ";
for (var vq of parseString(line, "do  X as  Y if Z")) {
    let v = vq;
    for (var s of v.entries())
        console.log(s);
}
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
console.log('Hello world');
//# sourceMappingURL=mcompiler.js.map