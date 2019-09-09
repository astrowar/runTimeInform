import { Runtime } from "inspector";

//runTime executor


export  namespace Interpreter {


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

    function isMatch(x: SGroup, m: MatchTerm): MatchResult {
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

    function parseAction(x: string, mstr: string): MatchResult[] {
        let xs = x.split(" ");
        let m = mstr.split(" ")
        if (xs.length < m.length) return null;
        let ret: MatchResult[] = []

        var mterm = m.map(function (x) {
            return termParser(x)
        });


        for (let t of combinations(new MatchResult(true, []), xs, mterm)) {
            ret.push(t);
        }
        return ret

    }


   export enum ActionStatus { ContinueAction, SucessAction, FailAction, StopAction }

    class FPool {
        public pool: ((rt: RunTime, x) => ActionStatus)[];
        constructor() { this.pool = [] }

        add(rhs: (rt: RunTime, x) => ActionStatus) {
            this.pool.push(rhs)
        }

        //add_p(lhs: FPool, rhs: FPool)
        //{
        //    let q = new FPool()
        //    q.pool = lhs.pool.concat(rhs.pool)
        //    return q
        //}

        //add_f(lhs: FPool, rhs: (rt: RunTime, x) => ActionStatus) {
        //    let q = new FPool()
        //    q.pool = lhs.pool.concat([rhs])
        //    return q
        //}
    }

    export   class ActionCmd {
        public patten: string;
        public call(rt: RunTime, x): ActionStatus {

            for (var [i, v] of this.check.pool.entries()) {
                let r = v(rt, x)
                if (r != ActionStatus.ContinueAction) return r;
            }

            for (var [i, v] of this.report.pool.entries()) {
                let r = v(rt, x)
                if (r != ActionStatus.ContinueAction) return r;
            }

            return ActionStatus.ContinueAction
        }




        public instead: FPool = new FPool()
        public report: FPool = new FPool()
        public check: FPool = new FPool()
    }



    function decomposeActionParse(x: VarAssigned[]) {
        let ret = {}
        x.forEach((j) => { ret[j.var_name] = j.value.join(" ") })
        return ret;
    }

   export  class RunTime {
        actions: ActionCmd[] = [];

       player: Model.Person = new Model.Person("self");

        buffer: string = "";
        public write(x: string) {
            this.buffer = this.buffer + x;
        }

       verify(arg0: Model.Kind, verb: string, obj: string): boolean {
           for (var (i, q) of relations(arg0, verb) )
           {

           }

           return false;
       }

        tryParseCmd(cmd: string) {
            let saved_buffer: string = this.buffer + ""

            let status: ActionStatus = ActionStatus.ContinueAction;
            for (var [key, ac] of this.actions.entries()) {
                for (var [k, res] of parseAction(cmd, ac.patten).entries()) {
                    this.buffer = "";
                    let actionreturn = ac.call(this, decomposeActionParse(res.vars))
                    if (actionreturn === ActionStatus.FailAction) {
                        status = ActionStatus.FailAction
                        break;
                    }
                    if (actionreturn == ActionStatus.StopAction) { break; }
                }
                if (status == ActionStatus.FailAction) {
                    break;
                }
            }
            this.buffer = saved_buffer + this.buffer;
            return null
        }

        Command(cmd: string) {
            let result = this.tryParseCmd(cmd);
        }
    };




}


let rt = new Interpreter.RunTime()

let a_get = new Interpreter.ActionCmd()
a_get.patten = "get X"
 
function check_ligh(rt: Interpreter.RunTime, params): Interpreter.ActionStatus
{
    let obj = params["X"]
    if (rt.player.location._("contains","light") == false)
    {
        rt.write("is too dark to see anything")
        return Interpreter.ActionStatus.StopAction 
    }
    return Interpreter.ActionStatus.ContinueAction;
} 


function report_get(rt: Interpreter.RunTime, params): Interpreter.ActionStatus
{
    rt.write("Got " + params["X"])
    return Interpreter.ActionStatus.ContinueAction;
}  
a_get.check.add(check_ligh)
a_get.report.add(report_get)
rt.actions.push(a_get)


rt.toDecideIf("X has light") =>
{

}


rt.tryParseCmd("get a box")
console.log(rt.buffer)
console.log("end")