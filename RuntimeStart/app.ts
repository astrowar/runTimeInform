import { Runtime } from "inspector";

//runTime executor
/// <reference path="definitions.d.ts" />

import { Model } from './model'
import { isUndefined } from "util";

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


    export interface IRelation {
        getFromType(): string;
        getToType(): string
          isSimetric: boolean
    }

    export abstract class RelationDecl extends Model.Kind
    { 
        readonly   isSimetric: boolean;
        public fromKind: string
        public toKind: string
        abstract getRelations(): [any, any][];

        abstract remove(x, y, fn);
        abstract add(x, y, fn);
    }


    

    export class RelationOneOther<T extends Model.Kind> extends RelationDecl
    {
        remove(x: any, y: any, fn: any) {
            throw new Error("Method not implemented.");
        }
        add(x: any, y: any, fn: any) {
            throw new Error("Method not implemented.");
        }
        getRelations(): [T, T][] {
            return this.relations
        }
        isSimetric = true
        constructor( ) {
            super( ); 
        }          
        relations: [T, T][] = []
    }

    export class RelationOneOne<T extends Model.Kind, V extends Model.Kind> extends RelationDecl {
        remove(x: any, y: any, fn: any) {
            throw new Error("Method not implemented.");
        }
        add(x: any, y: any, fn: any) {
            throw new Error("Method not implemented.");
        }
        isSimetric = false
        constructor( ) {
            super( );
        }
        getRelations(): [T, V][] {
            return this.relations
        }
        relations: [T, V][] = []
    }

        
    export class RelationOneMany<T extends Model.Kind, V extends Model.Kind> extends RelationDecl {
        isSimetric = false
        constructor( ) {
            super( );
        }
        relations: [T, V[]][] = []
        getRelations(): [T, V[]][]{
            return this.relations
        }

        remove(x: T, y: V, fn: (a, b) => boolean) {
            let ret = false;
            for (var [i, ab] of this.relations.entries()) {
                if (fn(ab[0], x)) {
                    for (var [j, b] of ab[1].entries()) {
                        if (fn(b, y)) {
                            ret = true;
                            ab[1].splice(j, 1)
                        }
                    }
                    if (ab[1].length == 0) this.relations.splice(i, 1)
                }
            }
            return ret;
        }

        add(x: T, y: V, fn: (a, b) => boolean) {
            let ret = false;
            for (var [i, ab] of this.relations.entries()) {
                if (fn(ab[0], x)) {
                    for (var [j, b] of ab[1].entries()) {
                        if (fn(b, y)) {
                            return true;
                        }
                    }
                    ab[1].push(y)
                    return true;
                }
            }
            this.relations.push([x,[y]]) 
            return true;
        }



    }


    export class RelationManyOne<T extends Model.Kind, V extends Model.Kind> extends RelationDecl {
        isSimetric = false
        constructor( ) {
            super( );
        }
        relations: [T[], V][] = []
        getRelations(): [T[], V][] {
            return this.relations
        }


        remove(x: T, y: V, fn: (a, b) => boolean) {
            let ret = false;
            for (var [i, ab] of this.relations.entries()) {
                if (fn(ab[1], y)) {
                    for (var [j, a] of ab[0].entries()) {
                        if (fn(a, x)) {
                            ret = true;
                            ab[0].splice(j, 1)
                        }
                    }
                    if (ab[0].length == 0) this.relations.splice(i, 1)
                }
            }
            return ret;
        }

        add(x: T, y: V, fn: (a, b) => boolean) {
            let ret = false;
            for (var [i, ab] of this.relations.entries()) {
                if (fn(ab[1], y)) {
                    for (var [j, a] of ab[0].entries()) {
                        if (fn(a, x)) {
                            return true;
                        }
                    }
                    ab[0].push(x)
                    return true;
                }
            }
            this.relations.push([[x], y])
            return true;
        }


    }


    export class RelationManyMany<T extends Model.Kind, V extends Model.Kind> extends RelationDecl {
        remove(x: any, y: any, fn: any) {
            throw new Error("Method not implemented.");
        }
        add(x: any, y: any, fn: any) {
            throw new Error("Method not implemented.");
        }
        isSimetric = false
        constructor( ) {
            super( );
        }
        relations: [T[], V[]][] = []
        getRelations(): [T[], V[]][] {
            return this.relations
        }
    }



    function decomposeActionParse(x: VarAssigned[]) {
        let ret = {}
        x.forEach((j) => { ret[j.var_name] = j.value.join(" ") })
        return ret;
    }

    class AliasToObject {
        names: string[];
        obj: Model.Kind;

        constructor(name: string, target: Model.Kind) {
            this.names = [name]
            this.obj = target

        }

    }

    export class DefinitionHeader {
        public x: string;
        public v: string;
        public y: string;

        constructor(x: string, v: string, y: string) {
            this.x = x;
            this.y = y;
            this.v = v;
        }
    }

    export class DefinitionPool {

        defs: [DefinitionHeader, any][] = []

        add(d: DefinitionHeader, fn: any) {
            this.defs.push([d, fn])
        }
    }



   export  class RunTime {
        actions: ActionCmd[] = [];
        relations: RelationDecl[] = []
        verbToRelationId: object = {}
        player: Model.Person 

        defines: DefinitionPool = new DefinitionPool();

       registred: AliasToObject[] = [] //todas as coisas

        buffer: string = "";
        public write(x: string) {
            this.buffer = this.buffer + x;
        }

       public isMatchItem(a: string | Model.Kind, b: string | Model.Kind  ): string | Model.Kind
       {
           if (a == b) return a;

           if (typeof a == "string") {
               let ax = this.resolve(a)
               if (ax != null) return this.isMatchItem(ax,b)
           }

           if (typeof b == "string") {
               let bx = this.resolve(b)
               if (bx != null) return this.isMatchItem(a, bx)
           }
           
           if (a instanceof Model.Kind) {
               if (typeof b == "string") {
                   if (a.inheritance.indexOf(b) >= 0) return a;
               }
           }

           if (b instanceof Model.Kind) {
               if (typeof a == "string") {
                   if (b.inheritance.indexOf(a) >= 0) return a;
               }
           }
            
           return null;
       }

       public isMatch(h: DefinitionHeader, x, v, y) {
           let rx = (this.isMatchItem(x,h.x))
           if (rx === null) return null
           return [rx,v,y]
       }

       public checkDefinition(x, v, y)
       {
           for (var [i, def] of this.defines.defs.entries())
           {
               let rx = this.isMatch(def[0], x, v, y)
               if (rx == null) continue;
               return def[1](rx[0],v,y)               
           }

       }

       public resolve(name: string): Model.Kind
       {
           let rg = this.registred;
           for (var [i, r] of rg.entries() ) {
               if (r.names.indexOf(name) > -1) {
                   return r.obj
               }
           }
           return null
       }

       public register<T extends| Model.Kind> (obj: T  ): T {           
           
           let oNamed = <Model.Descripted><any>obj;
           if (oNamed.public_name !== undefined) {
               if (oNamed.public_name != "") {
                   this.registred.push(new AliasToObject(oNamed.public_name, obj))
               }
           }
           return obj
       }


       public error(err_msg: string) {
           console.log(err_msg)
           throw new Error(err_msg);
       }

       public is_k(arg0: Model.Kind, x: string): boolean
       {
           for (var [i, v] of arg0.enumProperies.entries()) {
               if (v.values.indexOf(x) > -1)
               {
                  return  v.actualValue === x                   
               }
               throw new Error(x + " not found .");
           }

           return false;
       }

       public is(arg0: any, obj_name: string): boolean
       {
           if (arg0 instanceof Model.Kind)
           {
               return this.is_k(arg0, obj_name)
           }
           let oo = this.resolve(arg0)
           if (oo === null) {
               rt.error(arg0.toString() + " is undefined")
               return false;
           }

           return this.is_k(oo, obj_name)

           return false;
       }

       public now_set_k(arg0: Model.Kind, x: string) {
           for (var [i, v] of arg0.enumProperies.entries()) {
               if (v.values.indexOf(x) > -1) {
                   return v.actualValue = x
               }
               throw new Error(x + " not found .");
           }


           return true
       }

       public now_set(arg0: string |Model.Kind, obj_name: string) {
           if(arg0 instanceof Model.Kind)
           {
               return this.now_set_k(arg0, obj_name)
           }

           let oo = this.resolve(arg0)
           if (oo === null) {
               rt.error(arg0.toString() + " is undefined")
               return false;
           }


           return this.now_set_k(oo, obj_name)
       }




       public resetRelation(r: RelationDecl, x: string | Model.Kind, y: string | Model.Kind) {
           r.remove(x, "any", (a, b) => { return a === "any" || b === "any" || this.is(a, b) })
           r.add(x, y,(a, b) => { return  this.is(a, b) })
       }
 
       public now(arg0: string | Model.Kind, verb: string, obj_name: string) {
           if (verb == "is")
               return this.now_set(arg0, obj_name)

           let relation: RelationDecl = this.verbToRelationId[verb] as RelationDecl
           if( isUndefined( relation) ==false  )   
           {
               let r = relation
               this.resetRelation(r,arg0, obj_name )
               return true
               //for (var [j, ri] of r.getRelations().entries())
               //{
               //    console.log(ri)
               //    return true
               //}
           }
           return false 
       }

       public _(arg0: Model.Kind, verb: string, obj_name: string): boolean {
           let obj = this.resolve(obj_name);
           if (obj == null) return false
           let relation : RelationDecl = this.verbToRelationId[verb] as RelationDecl
          // for (var [i, r] of this.relations.entries() )
           {
               let r = relation
               for (var [j, ri] of r.getRelations()) {
                   console.log(ri)
               }
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


 

rt.defines.add(new Interpreter.DefinitionHeader("Room", "contains", "light"), (room: Model.Room, v, a) => { return (room.is("lit")) }); 
rt.defines.add(new Interpreter.DefinitionHeader("Room", "contains", "light"), (room: Model.Room, v, a) => { return (room.is("external") && rt.is("daytime", "day"))   });
rt.defines.add(new Interpreter.DefinitionHeader("Thing", "emite", "light"), (t: Model.Thing, v, a) => {   return  t.is("on") });


Model.Kind.setRuntime(rt)
let _ = rt._
var __ = (x) => { return rt.resolve(x) }

let flashlight = new Model.Thing("flashlight") 
//console.log("flashlight:", __("flashlight"))
//console.log("flashlight:", flashlight)
flashlight.canBe("on", "off").ussually("off")


rt.verbToRelationId["contains"] = new Interpreter.RelationOneMany<Model.Thing, Model.Room>()


rt.player =  new Model.Person("self") ;
rt.player.location = rt.register(new Model.Room("limbo"));


let limbo = new Model.Room().called("limbo") 
limbo.canBe("external", "internal")


console.log( limbo.is("external") )

console.log("flashlight emite light : ", rt.checkDefinition("flashlight", "emit", "light"))
rt.now(flashlight ,"is" , "on" )
console.log("flashlight emite light : ", rt.checkDefinition("flashlight", "emit", "light"))
rt.now(flashlight, "is", "on")

rt.now("limbo", "contains", "flashlight")
console.log(rt._(__("limbo"), "contains", "flashlight"))


//let flashlight = new Model.Thing("flashlight") 

 


//console.log("limbo:", rt.resolve("limbo"))
//console.log("flashlight:", __("flashlight"))

rt.tryParseCmd("get a box")
//console.log(rt.buffer)
console.log("end")