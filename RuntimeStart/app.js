"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//runTime executor
var Interpreter;
(function (Interpreter) {
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
    function parseAction(x, mstr) {
        let xs = x.split(" ");
        let m = mstr.split(" ");
        if (xs.length < m.length)
            return null;
        let ret = [];
        var mterm = m.map(function (x) {
            return termParser(x);
        });
        for (let t of combinations(new MatchResult(true, []), xs, mterm)) {
            ret.push(t);
        }
        return ret;
    }
    let ActionStatus;
    (function (ActionStatus) {
        ActionStatus[ActionStatus["ContinueAction"] = 0] = "ContinueAction";
        ActionStatus[ActionStatus["SucessAction"] = 1] = "SucessAction";
        ActionStatus[ActionStatus["FailAction"] = 2] = "FailAction";
        ActionStatus[ActionStatus["StopAction"] = 3] = "StopAction";
    })(ActionStatus = Interpreter.ActionStatus || (Interpreter.ActionStatus = {}));
    class FPool {
        constructor() { this.pool = []; }
        add(rhs) {
            this.pool.push(rhs);
        }
    }
    class ActionCmd {
        constructor() {
            this.instead = new FPool();
            this.report = new FPool();
            this.check = new FPool();
        }
        call(rt, x) {
            for (var [i, v] of this.check.pool.entries()) {
                let r = v(rt, x);
                if (r != ActionStatus.ContinueAction)
                    return r;
            }
            for (var [i, v] of this.report.pool.entries()) {
                let r = v(rt, x);
                if (r != ActionStatus.ContinueAction)
                    return r;
            }
            return ActionStatus.ContinueAction;
        }
    }
    Interpreter.ActionCmd = ActionCmd;
    function decomposeActionParse(x) {
        let ret = {};
        x.forEach((j) => { ret[j.var_name] = j.value.join(" "); });
        return ret;
    }
    class RunTime {
        constructor() {
            this.actions = [];
            this.player = new Model.Person("self");
            this.buffer = "";
        }
        write(x) {
            this.buffer = this.buffer + x;
        }
        tryParseCmd(cmd) {
            let saved_buffer = this.buffer + "";
            let status = ActionStatus.ContinueAction;
            for (var [key, ac] of this.actions.entries()) {
                for (var [k, res] of parseAction(cmd, ac.patten).entries()) {
                    this.buffer = "";
                    let actionreturn = ac.call(this, decomposeActionParse(res.vars));
                    if (actionreturn === ActionStatus.FailAction) {
                        status = ActionStatus.FailAction;
                        break;
                    }
                    if (actionreturn == ActionStatus.StopAction) {
                        break;
                    }
                }
                if (status == ActionStatus.FailAction) {
                    break;
                }
            }
            this.buffer = saved_buffer + this.buffer;
            return null;
        }
        Command(cmd) {
            let result = this.tryParseCmd(cmd);
        }
    }
    Interpreter.RunTime = RunTime;
    ;
})(Interpreter = exports.Interpreter || (exports.Interpreter = {}));
let rt = new Interpreter.RunTime();
let a_get = new Interpreter.ActionCmd();
a_get.patten = "get X";
function check_ligh(rt, params) {
    let obj = params["X"];
    if (rt.player.location.contains("light") == false) {
        rt.write("is too dark to see anything");
        return Interpreter.ActionStatus.StopAction;
    }
    return Interpreter.ActionStatus.ContinueAction;
}
function report_get(rt, params) {
    rt.write("Got " + params["X"]);
    return Interpreter.ActionStatus.ContinueAction;
}
a_get.check.add(check_ligh);
a_get.report.add(report_get);
rt.actions.push(a_get);
rt.tryParseCmd("get a box");
console.log(rt.buffer);
console.log("end");
//# sourceMappingURL=app.js.map