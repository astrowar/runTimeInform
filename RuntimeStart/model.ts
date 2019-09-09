//Word Model
 


namespace Model {

    export class Kind {
        rt: Interpreter.RunTime;
        _(verb: string, obj: string) {return this.rt.verify( this, verb,obj )}
    }

    interface Named {
        name: string
    }

    interface Container {

    }

    interface Descripted {
        public_name: string
        article: string
        description: string
        describe(desc: string): this  
    }

    type Location = Container | Person | Room;


    interface Located {
        location: Location;
        locatedIn(x:Location) 
    }



    export class Thing extends Kind implements Located, Descripted {
        locatedIn(x: Location) {
            this.location = x;   return this     }
        description: string;
        public_name: string;
        article: string;         
        public location: Location = new Room("limbo")

        describe(desc: string) { this.description = desc; return this; }
        
    }



    export class Room extends Kind implements Descripted  {
        _(arg0: string, arg1: string): any {
            throw new Error("Method not implemented.");
        }
        contains(arg0: string): any {
            throw new Error("Method not implemented.");
        }
        public_name: string;
        article: string;
        description: string;
        describe(desc: string): this {
            this.description = desc;
            return this;
        }
        constructor(public name: string) { super(); }
        public location: Region

    }

    export class Region extends Kind implements Descripted {
        public_name: string;
        article: string;
        description: string;
        describe(desc: string): this {
            this.description = desc;
            return this;
        }
        constructor(public name: string) { super(); }

    }

    export class Person extends Thing implements Located, Descripted {
        constructor(public name: string) { super(); }
        public location: Room
    }

}