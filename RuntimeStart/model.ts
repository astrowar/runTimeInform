//Word Model
 
/// <reference path="definitions.d.ts" />
import { Interpreter } from './app'

  export namespace Model {


      class enumProperty {
          values: string[] =[]
          actualValue: string = ""
      }

      export class Kind
      {
          enumProperies: enumProperty[] =[]
          inheritance:string[] =[]

        static setRuntime(rt: Interpreter.RunTime): any {
            Kind.rt = rt
        }
         kindName:string
          static rt: Interpreter.RunTime;
          _(verb: string, adjetive: string) { return Kind.rt._(this, verb, adjetive) }


          is(adjetive: string): boolean
          {
              return Kind.rt.is(this, adjetive)
          }

        constructor( )
        { 
          
            this.inheritance.push("Kind")
        }

          canBe(x: string, ...rest: string[]): this
          {
              let en = new enumProperty();
              en.values.push(x)
              en.values = en.values.concat(rest);
              en.actualValue =x
              this.enumProperies.push(en)
              return this;
          }
          ussually(x: string): this {
              for (var [i, v] of this.enumProperies.entries()) {
                  if (v.values.indexOf(x) > -1) {
                      v.actualValue = x
                      return this;
                  }
                  throw new Error(x + " not found .");
              }

              return this
          }

    }

    export interface Named {
        name: string
    }

    interface Container {

    }

    export interface Descripted {
        public_name: string
        article: string
        description: string
        describe(desc: string): this  
        called(uname: string): this;
    }

    type Location = Container | Person | Room;


    interface Located {
        location: Location;
        locatedIn(x:Location) 
    }



    export class Thing extends Kind implements Located, Descripted {
        static instance(arg0: string): any {
            throw new Error("Method not implemented.");
        }
        locatedIn(x: Location) {
            this.location = x;   return this     }
        description: string;
        public_name: string;
        article: string;         
        public location: Location;

        constructor(public name: string) {
            super();;
            this.public_name = name
            Kind.rt.register(this)
            this.inheritance.push("Thing")
        }

        describe(desc: string) { this.description = desc; return this; }
        called(uname: string) { this.public_name = uname; return this; }
 
        
    }



    export class Room extends Kind implements Descripted  {
        _(arg0: string, arg1: string): any {
            return Kind.rt._(this, arg0, arg1)
        }
        contains(arg0: string): any {
            return Kind.rt._(this, "contains", arg0)
        }

        prop_a : "internal"|"external" = "internal"

        public_name: string;
        article: string;
        description: string;
        describe(desc: string): this {
            this.description = desc;
            return this;
        }
        constructor(public name: string = "")
        {
            super();;
            this.public_name = name
            Kind.rt.register(this)
            this.inheritance.push("Room")
        }
        called(uname: string)
        {
            this.public_name = uname;
            Kind.rt.register(this)
            return this;
        }
        public location: Region

    }

    export class Region extends Kind implements Descripted {
        public_name: string;
        article: string = "";
        description: string;
        describe(desc: string): this {
            this.description = desc;
            return this;
        }
        called(uname: string) { this.public_name = uname; return this; }
        constructor(public name: string) {
            super();
            this.public_name = name
            Kind.rt.register(this)
            this.inheritance.push("Region")
        }

    }

    export class Person extends Thing implements Located, Descripted {
        constructor(public name: string)
        {
            super(name);;
            this.public_name = name
            Kind.rt.register(this)
            this.inheritance.push("Person")
        }
        public location: Room
    }

}