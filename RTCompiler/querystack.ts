import { GTems } from "./atoms";
import { isUndefined, isArray, isObject } from "util";

export namespace QueryStack {
    class CallItem {
        constructor(public unique_name: string, public arg: GTems.GBase[]) { }
    }

    export class DiscardItem {
        constructor(public unique_name: string ) { }
    }

    export class QueryStack {
        public callStack: CallItem[] = []
        public discardStack: DiscardItem[] = []
        constructor() { }
        contains(unique_name: string, arg0: GTems.GBase = undefined, arg1: GTems.GBase = undefined, arg2: GTems.GBase = undefined, arg3: GTems.GBase = undefined): boolean {
            for (var [i, cv] of this.callStack.entries()) {
                if (cv.unique_name != unique_name) continue

                if (isUndefined(arg0) && cv.arg.length > 0) continue; //arridade nao bate, cv eh menor que o requisitado
                if (isUndefined(arg1) && cv.arg.length > 1) continue; //arridade nao bate
                if (isUndefined(arg2) && cv.arg.length > 2) continue; //arridade nao bate
                if (isUndefined(arg3) && cv.arg.length > 3) continue; //arridade nao bate

                if (isUndefined(arg0) == false && cv.arg.length < 1) continue // cv eh  maior do que o requisitado
                if (isUndefined(arg1) == false && cv.arg.length < 2) continue
                if (isUndefined(arg2) == false && cv.arg.length < 3) continue
                if (isUndefined(arg3) == false && cv.arg.length < 4) continue


                if (isUndefined(arg0) == false) {
                    if (((cv.arg[0] instanceof GTems.Variable) && (arg0 instanceof GTems.Variable)) == false)
                        if (GTems.isEqually(cv.arg[0], arg0) == false) continue
                }
                if (isUndefined(arg1) == false)
                    if (((cv.arg[1] instanceof GTems.Variable) && (arg1 instanceof GTems.Variable)) == false)
                        if (GTems.isEqually(cv.arg[1], arg1) == false) continue
                if (isUndefined(arg2) == false)
                    if (((cv.arg[2] instanceof GTems.Variable) && (arg2 instanceof GTems.Variable)) == false)
                        if (GTems.isEqually(cv.arg[2], arg2) == false) continue
                if (isUndefined(arg3) == false)
                    if (((cv.arg[3] instanceof GTems.Variable) && (arg3 instanceof GTems.Variable)) == false)
                        if (GTems.isEqually(cv.arg[3], arg3) == false) continue

                return true
            }
            return false
        }

        contains_discard(unique_name: string): boolean {
            for (var [i, cv] of this.discardStack.entries()) {
                if (cv.unique_name === unique_name) return true
            }
            return false
        }


        clone(): QueryStack {
            let s = new QueryStack()
            for (var [i, cv] of this.callStack.entries()) s.callStack.push(cv)
            for (var [i, dv] of this.discardStack.entries()) s.discardStack.push(dv)
            return s;
        }


        pushCall(unique_name: string, arg0: GTems.GBase = undefined, arg1: GTems.GBase = undefined, arg2: GTems.GBase = undefined, arg3: GTems.GBase = undefined): QueryStack {
            let argv = []
            if (isUndefined(arg0) == false) argv.push(arg0)
            if (isUndefined(arg1) == false) argv.push(arg1)
            if (isUndefined(arg2) == false) argv.push(arg2)
            if (isUndefined(arg3) == false) argv.push(arg3)

            if (isUndefined(arg1) == false && (isUndefined(arg0))) throw new Error("invalid call arguments")
            if (isUndefined(arg2) == false && (isUndefined(arg0))) throw new Error("invalid call arguments")
            if (isUndefined(arg2) == false && (isUndefined(arg1))) throw new Error("invalid call arguments")
            if (isUndefined(arg3) == false && (isUndefined(arg2))) throw new Error("invalid call arguments")

            let c = new CallItem(unique_name, argv)
            let s = this.clone()
            s.callStack.push(c)
            return s
        }

        pushDiscard(unique_name: string): QueryStack {
            let c = new DiscardItem(unique_name)
            let s = this.clone()
            s.discardStack.push(c)
            return s
        }


    }
}
