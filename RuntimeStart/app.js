"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//runTime executor
/// <reference path="definitions.d.ts" />
const model_1 = require("./model");
const util_1 = require("util");
var Interpreter;
(function (Interpreter) {
    let AssertReturn;
    (function (AssertReturn) {
        AssertReturn[AssertReturn["Equals"] = 0] = "Equals";
        AssertReturn[AssertReturn["NotEquals"] = 1] = "NotEquals";
        AssertReturn[AssertReturn["Undefined"] = 2] = "Undefined";
    })(AssertReturn || (AssertReturn = {}));
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
    class RelationDecl extends model_1.Model.Kind {
    }
    Interpreter.RelationDecl = RelationDecl;
    class RelationOneOther extends RelationDecl {
        constructor() {
            super();
            this.isSimetric = true;
            this.relations = [];
        }
        query(x, y, fn) {
            throw new Error("Method not implemented.");
        }
        remove(x, y, fn) {
            throw new Error("Method not implemented.");
        }
        add(x, y, fn) {
            throw new Error("Method not implemented.");
        }
        getRelations() {
            return this.relations;
        }
    }
    Interpreter.RelationOneOther = RelationOneOther;
    class RelationOneOne extends RelationDecl {
        constructor() {
            super();
            this.isSimetric = false;
            this.relations = [];
        }
        query(x, y, fn) {
            throw new Error("Method not implemented.");
        }
        remove(x, y, fn) {
            throw new Error("Method not implemented.");
        }
        add(x, y, fn) {
            throw new Error("Method not implemented.");
        }
        getRelations() {
            return this.relations;
        }
    }
    Interpreter.RelationOneOne = RelationOneOne;
    class RelationOneMany extends RelationDecl {
        constructor() {
            super();
            this.isSimetric = false;
            this.relations = [];
        }
        getRelations() {
            return this.relations;
        }
        remove(x, y, fn) {
            let ret = false;
            for (var [i, ab] of this.relations.entries()) {
                if (fn(ab[0], x)) {
                    for (var [j, b] of ab[1].entries()) {
                        if (fn(b, y)) {
                            ret = true;
                            ab[1].splice(j, 1);
                        }
                    }
                    if (ab[1].length == 0)
                        this.relations.splice(i, 1);
                }
            }
            return ret;
        }
        query(x, y, fn) {
            let ret = false;
            for (var [i, ab] of this.relations.entries()) {
                if (fn(ab[0], x)) {
                    for (var [j, b] of ab[1].entries()) {
                        if (fn(b, y)) {
                            return true;
                        }
                    }
                }
            }
            return false;
        }
        add(x, y, fn) {
            let ret = false;
            for (var [i, ab] of this.relations.entries()) {
                if (fn(ab[0], x)) {
                    for (var [j, b] of ab[1].entries()) {
                        if (fn(b, y)) {
                            return true;
                        }
                    }
                    ab[1].push(y);
                    return true;
                }
            }
            this.relations.push([x, [y]]);
            return true;
        }
    }
    Interpreter.RelationOneMany = RelationOneMany;
    class RelationManyOne extends RelationDecl {
        constructor() {
            super();
            this.isSimetric = false;
            this.relations = [];
        }
        getRelations() {
            return this.relations;
        }
        remove(x, y, fn) {
            let ret = false;
            for (var [i, ab] of this.relations.entries()) {
                if (fn(ab[1], y)) {
                    for (var [j, a] of ab[0].entries()) {
                        if (fn(a, x)) {
                            ret = true;
                            ab[0].splice(j, 1);
                        }
                    }
                    if (ab[0].length == 0)
                        this.relations.splice(i, 1);
                }
            }
            return ret;
        }
        add(x, y, fn) {
            let ret = false;
            for (var [i, ab] of this.relations.entries()) {
                if (fn(ab[1], y)) {
                    for (var [j, a] of ab[0].entries()) {
                        if (fn(a, x)) {
                            return true;
                        }
                    }
                    ab[0].push(x);
                    return true;
                }
            }
            this.relations.push([[x], y]);
            return true;
        }
        query(x, y, fn) {
            let ret = false;
            for (var [i, ab] of this.relations.entries()) {
                if (fn(ab[1], y)) {
                    for (var [j, a] of ab[0].entries()) {
                        if (fn(a, x)) {
                            return true;
                        }
                    }
                }
            }
            return false;
        }
    }
    Interpreter.RelationManyOne = RelationManyOne;
    class RelationManyMany extends RelationDecl {
        constructor() {
            super();
            this.isSimetric = false;
            this.relations = [];
        }
        query(x, y, fn) {
            throw new Error("Method not implemented.");
        }
        remove(x, y, fn) {
            throw new Error("Method not implemented.");
        }
        add(x, y, fn) {
            throw new Error("Method not implemented.");
        }
        getRelations() {
            return this.relations;
        }
    }
    Interpreter.RelationManyMany = RelationManyMany;
    function decomposeActionParse(x) {
        let ret = {};
        x.forEach((j) => { ret[j.var_name] = j.value.join(" "); });
        return ret;
    }
    class AliasToObject {
        constructor(name, target) {
            this.names = [name];
            this.obj = target;
        }
    }
    class DefinitionHeader {
        constructor(x, v, y) {
            this.x = x;
            this.y = y;
            this.v = v;
        }
    }
    Interpreter.DefinitionHeader = DefinitionHeader;
    class DefinitionPool {
        constructor() {
            this.defs = [];
        }
        add(d, fn) {
            this.defs.push([d, fn]);
        }
    }
    Interpreter.DefinitionPool = DefinitionPool;
    class RunTime {
        constructor() {
            this.actions = [];
            this.relations = [];
            this.verbToRelationId = {};
            this.defines = new DefinitionPool();
            this.registred = []; //todas as coisas
            this.buffer = "";
        }
        write(x) {
            this.buffer = this.buffer + x;
        }
        isMatchItem(a, b) {
            if (a == b)
                return AssertReturn.Equals;
            if (typeof a == "string") {
                let ax = this.resolve(a);
                if (ax != null)
                    return this.isMatchItem(ax, b);
            }
            if (typeof b == "string") {
                let bx = this.resolve(b);
                if (bx != null)
                    return this.isMatchItem(a, bx);
            }
            if (a instanceof model_1.Model.Kind) {
                if (typeof b == "string") {
                    if (a.inheritance.indexOf(b) >= 0)
                        return a;
                }
            }
            if (b instanceof model_1.Model.Kind) {
                if (typeof a == "string") {
                    if (b.inheritance.indexOf(a) >= 0)
                        return b;
                }
            }
            return AssertReturn.Undefined;
            ;
        }
        isMatch(h, x, v, y) {
            let rx = (this.isMatchItem(x, h.x));
            if (rx === AssertReturn.Undefined)
                return null;
            return [rx, v, y];
        }
        checkDefinition(x, v, y) {
            for (var [i, def] of this.defines.defs.entries()) {
                let rx = this.isMatch(def[0], x, v, y);
                if (rx == null)
                    continue;
                return def[1](rx[0], v, y);
            }
        }
        resolve(name) {
            let rg = this.registred;
            for (var [i, r] of rg.entries()) {
                if (r.names.indexOf(name) > -1) {
                    return r.obj;
                }
            }
            return null;
        }
        register(obj) {
            let oNamed = obj;
            if (oNamed.public_name !== undefined) {
                if (oNamed.public_name != "") {
                    this.registred.push(new AliasToObject(oNamed.public_name, obj));
                }
            }
            return obj;
        }
        error(err_msg) {
            console.log(err_msg);
            throw new Error(err_msg);
        }
        is_enum(arg0, x) {
            for (var [i, v] of arg0.enumProperies.entries()) {
                if (v.values.indexOf(x) > -1) {
                    if (v.actualValue === x)
                        return AssertReturn.Equals;
                    return AssertReturn.NotEquals;
                }
                // throw new Error(x + " not found .");
            }
            return AssertReturn.Undefined;
        }
        is_k(arg0, x) {
            let rmm = this.isMatchItem(arg0, x);
            if (rmm == AssertReturn.Equals)
                return true;
            if (rmm == AssertReturn.NotEquals)
                return false;
            if ((arg0 instanceof model_1.Model.Kind) && (typeof x == "string")) {
                let rr = this.is_enum(arg0, x);
                if (rr == AssertReturn.Equals)
                    return true;
                if (rr == AssertReturn.NotEquals)
                    return false;
            }
            return false;
        }
        is(arg0, obj_name) {
            let ax = arg0;
            let ox = obj_name;
            if (typeof arg0 == "string") {
                ax = this.resolve(arg0);
                if (ax === null)
                    ax = arg0;
            }
            if (typeof obj_name == "string") {
                ox = this.resolve(obj_name);
                if (ox === null)
                    ox = obj_name;
            }
            if (typeof ax == "string")
                return this.is_k(ox, ax);
            return this.is_k(ax, ox);
            //if (arg0 instanceof Model.Kind)
            //{
            //    return this.is_k(arg0, obj_name)
            //} 
            //if (typeof obj_name == "string") {
            //    let ox = this.resolve(obj_name)
            //    if (ox == null) return this.is_k(arg0, obj_name)
            //    return this.is_k(arg0, ox)
            //} 
            //if (typeof arg0 == "string") {
            //    ox = this.resolve(arg0)
            //    if (oo === null)
            //    {
            //        //rt.error(arg0.toString() + " is undefined")
            //        return false;
            //    }
            //} 
            //return this.is_k(oo, obj_name) 
            //return false;
        }
        now_set_k(arg0, x) {
            for (var [i, v] of arg0.enumProperies.entries()) {
                if (v.values.indexOf(x) > -1) {
                    return v.actualValue = x;
                }
                throw new Error(x + " not found .");
            }
            return true;
        }
        now_set(arg0, obj_name) {
            if (arg0 instanceof model_1.Model.Kind) {
                return this.now_set_k(arg0, obj_name);
            }
            let oo = this.resolve(arg0);
            if (oo === null) {
                rt.error(arg0.toString() + " is undefined");
                return false;
            }
            return this.now_set_k(oo, obj_name);
        }
        resetRelation(r, x, y) {
            r.remove(x, "any", (a, b) => { return a === "any" || b === "any" || this.is(a, b); });
            r.add(x, y, (a, b) => { return this.is(a, b); });
        }
        now(arg0, verb, obj_name) {
            if (verb == "is")
                return this.now_set(arg0, obj_name);
            let relation = this.verbToRelationId[verb];
            if (util_1.isUndefined(relation) == false) {
                let r = relation;
                this.resetRelation(r, arg0, obj_name);
                return true;
                //for (var [j, ri] of r.getRelations().entries())
                //{
                //    console.log(ri)
                //    return true
                //}
            }
            return false;
        }
        _(arg0, verb, obj_name) {
            let obj = this.resolve(obj_name);
            if (obj == null)
                return false;
            let relation = this.verbToRelationId[verb];
            // for (var [i, r] of this.relations.entries() )
            {
                let r = relation;
                for (var [j, ri] of r.getRelations()) {
                    return r.query(arg0, obj_name, (a, b) => { return this.is(a, b); });
                }
            }
            return false;
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
    if (rt.player.location._("contains", "light") == false) {
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
rt.defines.add(new Interpreter.DefinitionHeader("Room", "contains", "light"), (room, v, a) => { return (room.is("lit")); });
rt.defines.add(new Interpreter.DefinitionHeader("Room", "contains", "light"), (room, v, a) => { return (room.is("external") && rt.is("daytime", "day")); });
rt.defines.add(new Interpreter.DefinitionHeader("Thing", "emite", "light"), (t, v, a) => { return t.is("on"); });
model_1.Model.Kind.setRuntime(rt);
let _ = rt._;
var __ = (x) => { return rt.resolve(x); };
let flashlight = new model_1.Model.Thing("flashlight");
//console.log("flashlight:", __("flashlight"))
//console.log("flashlight:", flashlight)
flashlight.canBe("on", "off").ussually("off");
rt.verbToRelationId["contains"] = new Interpreter.RelationOneMany();
rt.player = new model_1.Model.Person("self");
rt.player.location = rt.register(new model_1.Model.Room("limbo"));
let limbo = new model_1.Model.Room().called("limbo");
limbo.canBe("external", "internal");
console.log(limbo.is("external"));
console.log("has flashligh in limbo ? ", rt._(__("limbo"), "contains", "flashlight"));
console.log("flashlight emite light : ", rt.checkDefinition("flashlight", "emit", "light"));
rt.now(flashlight, "is", "on");
console.log("flashlight emite light : ", rt.checkDefinition("flashlight", "emit", "light"));
rt.now(flashlight, "is", "on");
rt.now("limbo", "contains", "flashlight");
console.log("has flashligh in limbo ? ", rt._(__("limbo"), "contains", "flashlight"));
//let flashlight = new Model.Thing("flashlight") 
//console.log("limbo:", rt.resolve("limbo"))
//console.log("flashlight:", __("flashlight"))
rt.tryParseCmd("get a box");
//console.log(rt.buffer)
console.log("end");
//# sourceMappingURL=app.js.map