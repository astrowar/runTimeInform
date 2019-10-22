"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const atoms_1 = require("./atoms");
const util_1 = require("util");
var QueryStack;
(function (QueryStack_1) {
    class CallItem {
        constructor(unique_name, arg) {
            this.unique_name = unique_name;
            this.arg = arg;
        }
    }
    class DiscardItem {
        constructor(unique_name) {
            this.unique_name = unique_name;
        }
    }
    QueryStack_1.DiscardItem = DiscardItem;
    class QueryStack {
        constructor() {
            this.callStack = [];
            this.discardStack = [];
        }
        contains(unique_name, arg0 = undefined, arg1 = undefined, arg2 = undefined, arg3 = undefined) {
            for (var [i, cv] of this.callStack.entries()) {
                if (cv.unique_name != unique_name)
                    continue;
                if (util_1.isUndefined(arg0) && cv.arg.length > 0)
                    continue; //arridade nao bate, cv eh menor que o requisitado
                if (util_1.isUndefined(arg1) && cv.arg.length > 1)
                    continue; //arridade nao bate
                if (util_1.isUndefined(arg2) && cv.arg.length > 2)
                    continue; //arridade nao bate
                if (util_1.isUndefined(arg3) && cv.arg.length > 3)
                    continue; //arridade nao bate
                if (util_1.isUndefined(arg0) == false && cv.arg.length < 1)
                    continue; // cv eh  maior do que o requisitado
                if (util_1.isUndefined(arg1) == false && cv.arg.length < 2)
                    continue;
                if (util_1.isUndefined(arg2) == false && cv.arg.length < 3)
                    continue;
                if (util_1.isUndefined(arg3) == false && cv.arg.length < 4)
                    continue;
                if (util_1.isUndefined(arg0) == false) {
                    if (((cv.arg[0] instanceof atoms_1.GTems.Variable) && (arg0 instanceof atoms_1.GTems.Variable)) == false)
                        if (atoms_1.GTems.isEqually(cv.arg[0], arg0) == false)
                            continue;
                }
                if (util_1.isUndefined(arg1) == false)
                    if (((cv.arg[1] instanceof atoms_1.GTems.Variable) && (arg1 instanceof atoms_1.GTems.Variable)) == false)
                        if (atoms_1.GTems.isEqually(cv.arg[1], arg1) == false)
                            continue;
                if (util_1.isUndefined(arg2) == false)
                    if (((cv.arg[2] instanceof atoms_1.GTems.Variable) && (arg2 instanceof atoms_1.GTems.Variable)) == false)
                        if (atoms_1.GTems.isEqually(cv.arg[2], arg2) == false)
                            continue;
                if (util_1.isUndefined(arg3) == false)
                    if (((cv.arg[3] instanceof atoms_1.GTems.Variable) && (arg3 instanceof atoms_1.GTems.Variable)) == false)
                        if (atoms_1.GTems.isEqually(cv.arg[3], arg3) == false)
                            continue;
                return true;
            }
            return false;
        }
        contains_discard(unique_name) {
            for (var [i, cv] of this.discardStack.entries()) {
                if (cv.unique_name === unique_name)
                    return true;
            }
            return false;
        }
        clone() {
            let s = new QueryStack();
            for (var [i, cv] of this.callStack.entries())
                s.callStack.push(cv);
            for (var [i, dv] of this.discardStack.entries())
                s.discardStack.push(dv);
            return s;
        }
        pushCall(unique_name, arg0 = undefined, arg1 = undefined, arg2 = undefined, arg3 = undefined) {
            let argv = [];
            if (util_1.isUndefined(arg0) == false)
                argv.push(arg0);
            if (util_1.isUndefined(arg1) == false)
                argv.push(arg1);
            if (util_1.isUndefined(arg2) == false)
                argv.push(arg2);
            if (util_1.isUndefined(arg3) == false)
                argv.push(arg3);
            if (util_1.isUndefined(arg1) == false && (util_1.isUndefined(arg0)))
                throw new Error("invalid call arguments");
            if (util_1.isUndefined(arg2) == false && (util_1.isUndefined(arg0)))
                throw new Error("invalid call arguments");
            if (util_1.isUndefined(arg2) == false && (util_1.isUndefined(arg1)))
                throw new Error("invalid call arguments");
            if (util_1.isUndefined(arg3) == false && (util_1.isUndefined(arg2)))
                throw new Error("invalid call arguments");
            let c = new CallItem(unique_name, argv);
            let s = this.clone();
            s.callStack.push(c);
            return s;
        }
        pushDiscard(unique_name) {
            let c = new DiscardItem(unique_name);
            let s = this.clone();
            s.discardStack.push(c);
            return s;
        }
    }
    QueryStack_1.QueryStack = QueryStack;
})(QueryStack = exports.QueryStack || (exports.QueryStack = {}));
//# sourceMappingURL=querystack.js.map