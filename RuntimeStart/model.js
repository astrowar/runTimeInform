//Word Model
var Model;
(function (Model) {
    class Kind {
    }
    Model.Kind = Kind;
    class Thing extends Kind {
        constructor() {
            super(...arguments);
            this.location = new Room("limbo");
        }
        locatedIn(x) {
            this.location = x;
            return this;
        }
        describe(desc) { this.description = desc; return this; }
    }
    Model.Thing = Thing;
    class Room extends Kind {
        constructor(name) {
            super();
            this.name = name;
        }
        describe(desc) {
            this.description = desc;
            return this;
        }
    }
    Model.Room = Room;
    class Region extends Kind {
        constructor(name) {
            super();
            this.name = name;
        }
        describe(desc) {
            this.description = desc;
            return this;
        }
    }
    Model.Region = Region;
    class Person extends Thing {
        constructor(name) {
            super();
            this.name = name;
        }
    }
    Model.Person = Person;
})(Model || (Model = {}));
//# sourceMappingURL=model.js.map