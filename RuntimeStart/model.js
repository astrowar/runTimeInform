"use strict";
//Word Model
Object.defineProperty(exports, "__esModule", { value: true });
var Model;
(function (Model) {
    class enumProperty {
        constructor() {
            this.values = [];
            this.actualValue = "";
        }
    }
    class Kind {
        constructor() {
            this.enumProperies = [];
            this.inheritance = [];
            this.inheritance.push("Kind");
        }
        static setRuntime(rt) {
            Kind.rt = rt;
        }
        _(verb, adjetive) { return Kind.rt._(this, verb, adjetive); }
        is(adjetive) {
            return Kind.rt.is(this, adjetive);
        }
        canBe(x, ...rest) {
            let en = new enumProperty();
            en.values.push(x);
            en.values = en.values.concat(rest);
            en.actualValue = x;
            this.enumProperies.push(en);
            return this;
        }
        ussually(x) {
            for (var [i, v] of this.enumProperies.entries()) {
                if (v.values.indexOf(x) > -1) {
                    v.actualValue = x;
                    return this;
                }
                throw new Error(x + " not found .");
            }
            return this;
        }
    }
    Model.Kind = Kind;
    class Thing extends Kind {
        constructor(name) {
            super();
            this.name = name;
            ;
            this.public_name = name;
            Kind.rt.register(this);
            this.inheritance.push("Thing");
        }
        static instance(arg0) {
            throw new Error("Method not implemented.");
        }
        locatedIn(x) {
            this.location = x;
            return this;
        }
        describe(desc) { this.description = desc; return this; }
        called(uname) { this.public_name = uname; return this; }
    }
    Model.Thing = Thing;
    class Room extends Kind {
        constructor(name = "") {
            super();
            this.name = name;
            this.prop_a = "internal";
            ;
            this.public_name = name;
            Kind.rt.register(this);
            this.inheritance.push("Room");
        }
        _(arg0, arg1) {
            return Kind.rt._(this, arg0, arg1);
        }
        contains(arg0) {
            return Kind.rt._(this, "contains", arg0);
        }
        describe(desc) {
            this.description = desc;
            return this;
        }
        called(uname) {
            this.public_name = uname;
            Kind.rt.register(this);
            return this;
        }
    }
    Model.Room = Room;
    class Region extends Kind {
        constructor(name) {
            super();
            this.name = name;
            this.article = "";
            this.public_name = name;
            Kind.rt.register(this);
            this.inheritance.push("Region");
        }
        describe(desc) {
            this.description = desc;
            return this;
        }
        called(uname) { this.public_name = uname; return this; }
    }
    Model.Region = Region;
    class Person extends Thing {
        constructor(name) {
            super(name);
            this.name = name;
            ;
            this.public_name = name;
            Kind.rt.register(this);
            this.inheritance.push("Person");
        }
    }
    Model.Person = Person;
})(Model = exports.Model || (exports.Model = {}));
//# sourceMappingURL=model.js.map