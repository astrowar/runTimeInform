
 /// <reference path="./atoms.ts" />

import { GTems } from "./atoms";

export namespace UTerm {
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
        public value: ITerm[];
        constructor(_var_name: string, _value: ITerm[]) {
            this.var_name = _var_name;
            this.value = _value;
        }
        public toString(): string { return this.var_name + ":" + this.value }
    }
    type VarAssignedList = VarAssigned[];



    export class MatchResult {
        *entries() {

            for (var [i, s] of this.vars.entries()) {
                yield [s.var_name, s.value]
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

    function isMatch(x: ITerm[], m: MatchTerm): MatchResult {
         
        //return new MatchResult(true)



        if (m instanceof MatchStringLiteral) {
            if (x.length == 1)
            {
                return new MatchResult(x[0].gettext() === m.str)
            }
        }

        if (m instanceof MatchVar) {
            let mv: MatchVar = m as MatchVar
            if (isBalanced(x)) {
                return new MatchResult(true, [new VarAssigned(m.vname, x)])
            }
        }
        return new MatchResult(false)

    }

    function isBalanced(h: ITerm[]): boolean {

        let eq = 0;
        let bq = 0
        let cq = 0

        for (var [i, x] of h.entries()) {
            if (x.gettext() == "(") eq = eq + 1;
            if (x.gettext() == ")") eq = eq - 1;

            if (x.gettext() == "[") bq = bq + 1;
            if (x.gettext() == "]") bq = bq - 1;

            if (x.gettext() == "{") cq = cq + 1;
            if (x.gettext() == "}") cq = cq - 1;

            if (eq < 0) return false
            if (bq < 0) return false
            if (cq < 0) return false
        }

        

        return eq == 0
    }

    function* combinations(acc: MatchResult, xs: ITerm[], ms: MatchTerm[]) {

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
            let h: ITerm[] = xs.slice(0, i)

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



    //function termParser(x: string): MatchTerm {
    //if (x[0] === x.toUpperCase() && x.length < 3) {
    //    return new MatchVar(x)
    //}

    function termParser(x: string): MatchTerm {
        if (x[0] === "$") {
            return new MatchVar(x)
        }
        return new MatchStringLiteral(x)
        //return new MatchTerm()
    }


    enum CODEST { SCODE, SLITERAL }

    export class ITerm {
        readonly txt: string
        constructor(_txt: string) { this.txt = _txt }
        gettext(): string { return this.txt };
        getGeneralTerm(): GTems.GBase { return null; }
        isLiteral(): boolean { return false }
    }

    class TermCode extends ITerm {
        constructor(_txt: string) { super(_txt) }
        isLiteral(): boolean {return false}
        getGeneralTerm(): GTems.GBase
        { 
            if (this.txt == "true") {
                return new GTems.LiteralBool(true)
            }

            if (this.txt == "false") {
                return new GTems.LiteralBool(false)
            }

            if (this.txt[0] == "$") {
                return new GTems.Variable( (this.txt.slice(1)))
            }

            if (this.txt == "!") {
                return new GTems.Atom("cut")
            }

            {
            let n = Number(this.txt)
            if (isNaN(n) ==false )     return new GTems.LiteralNumber(n)
            }

            return new GTems.Atom(this.txt)
        }

    }
    class TermLiteral extends ITerm {
        constructor(_txt: string) { super(_txt) }
        getGeneralTerm(): GTems.GBase { return new GTems.LiteralStr(this.txt) }
        isLiteral(): boolean { return true }
    }

    export function splitStringInput(x: string): ITerm[] {
        let state: CODEST = CODEST.SCODE
        let terms: ITerm[] = []
        let acc = ""
        let n = x.length
        for (var i = 0; i < n; ++i) {
            let c = x[i]
            if (state == CODEST.SCODE) {
                if (c == '"') {
                    if (acc.length > 0) terms.push(new TermCode(acc))
                    acc = ""
                    state = CODEST.SLITERAL
                    continue
                }
                if (c == ' ') {
                    if (acc.length > 0) terms.push(new TermCode(acc))
                    acc = ""
                    continue
                }
                if ((",;(){}|\n[].+-").indexOf(c) >= 0) {
                    if (acc.length > 0) terms.push(new TermCode(acc))
                    terms.push(new TermCode(c))
                    acc = ""
                    continue
                }
                else {
                    acc = acc + c
                }
            }
            if (state == CODEST.SLITERAL) {
                if (c == '"') {
                    if (acc.length > 0) terms.push(new TermLiteral(acc))
                    acc = ""
                    state = CODEST.SCODE
                    continue
                }
                else {
                    acc = acc + c
                }
            }
        }
        if (state == CODEST.SCODE) if (acc.length > 0) terms.push(new TermCode(acc))
        if (state == CODEST.SLITERAL) if (acc.length > 0) terms.push(new TermLiteral(acc))
        return terms
    }


  export  function* parseString(xs: ITerm[], mstr: string) {
        //let xs = x.split(" ");
        //xs = xs.filter(Boolean);
        let m = mstr.split(" ")
        m = m.filter(Boolean);
        if (xs.length < m.length) return;
        let ret: MatchResult[] = []
        var mterm = m.map(function (x) {
            return termParser(x)
        });
        for (let t of combinations(new MatchResult(true, []), xs, mterm)) {
            yield t;
        }
        return
    }

}