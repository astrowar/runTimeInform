"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const atoms_1 = require("./atoms");
const solution_1 = require("./solution");
const util_1 = require("util");
const parse_1 = require("./parse");
var Interp;
(function (Interp) {
    function findEndAtom(x, i) {
        let n = x.length;
        while (i < n) {
            if (x[i] == " " || (";.,()[]|&\n\r".indexOf(x[i]) > -1)) {
                return i;
            }
            i = i + 1;
        }
        return i;
    }
    function findEndBraket(x, i) {
        let n = x.length;
        let lv = 0;
        while (i < n) {
            if (x[i] == "[") {
                lv = lv + 1;
            }
            if (x[i] == "]") {
                lv = lv - 1;
            }
            if (lv == 0)
                return i;
            i = i + 1;
        }
        return i;
    }
    //normal ... sem flag de selecao
    //norminal <-> unless  senao eh um é outro 
    //direct <-> NONDIRECT   nao direto significa que cada resposta gera um novo node de respostas.. direct , se um tiver sucesso..encerra a query
    let PredicateKind;
    (function (PredicateKind) {
        PredicateKind[PredicateKind["NORMAL"] = 0] = "NORMAL";
        PredicateKind[PredicateKind["NOMINAL"] = 1] = "NOMINAL";
        PredicateKind[PredicateKind["UNLESS"] = 2] = "UNLESS";
        PredicateKind[PredicateKind["NONDIRECT"] = 3] = "NONDIRECT";
        PredicateKind[PredicateKind["DIRECT"] = 4] = "DIRECT";
    })(PredicateKind || (PredicateKind = {}));
    class BaseEntry {
        constructor(unique_name, value, condition, prior) {
            this.unique_name = unique_name;
            this.value = value;
            this.condition = condition;
            this.prior = prior;
            this.attributes = [PredicateKind.NOMINAL, PredicateKind.NONDIRECT];
        }
        swap_attr(a_old, a_new) {
            let index = this.attributes.indexOf(a_old);
            if (index > -1) {
                this.attributes.splice(index, 1);
            }
            this.attributes.push(a_new);
        }
        has(x) {
            if (this.attributes.indexOf(x) == -1)
                return false;
            return true;
        }
        set(x) {
            if (x == PredicateKind.NOMINAL)
                this.swap_attr(PredicateKind.NOMINAL, PredicateKind.UNLESS);
            if (x == PredicateKind.UNLESS)
                this.swap_attr(PredicateKind.NOMINAL, PredicateKind.UNLESS);
            if (x == PredicateKind.NONDIRECT)
                this.swap_attr(PredicateKind.DIRECT, PredicateKind.NONDIRECT);
            if (x == PredicateKind.DIRECT)
                this.swap_attr(PredicateKind.NONDIRECT, PredicateKind.DIRECT);
        }
    }
    class UnderstandEntry extends BaseEntry {
        constructor(unique_name, patternMatching, value, condition, prior) {
            super(unique_name, value, condition, prior);
            this.unique_name = unique_name;
            this.patternMatching = patternMatching;
            this.value = value;
            this.condition = condition;
            this.prior = prior;
            if ((patternMatching instanceof atoms_1.GTems.LiteralStr) == false)
                throw new Error("entry type is invalid");
        }
    }
    class ConstEntry extends BaseEntry {
        constructor(unique_name, value) {
            super(unique_name, value, undefined, 0);
            this.unique_name = unique_name;
            this.value = value;
        }
    }
    class VarEntry extends BaseEntry {
        constructor(unique_name, value) {
            super(unique_name, value, undefined, 0);
            this.unique_name = unique_name;
            this.value = value;
        }
    }
    class PredicateEntry extends BaseEntry {
        constructor(unique_name, entry, value, condition, prior) {
            super(unique_name, value, condition, prior);
            this.unique_name = unique_name;
            this.entry = entry;
            this.value = value;
            this.condition = condition;
            this.prior = prior;
            if ((entry instanceof atoms_1.GTems.Functor) == false && (entry instanceof atoms_1.GTems.Atom) == false)
                throw new Error("entry type is invalid");
        }
    }
    class CallItem {
        constructor(unique_name, arg) {
            this.unique_name = unique_name;
            this.arg = arg;
        }
    }
    class QueryStack {
        constructor() {
            this.callStack = [];
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
        clone() {
            let s = new QueryStack();
            for (var [i, cv] of this.callStack.entries())
                s.callStack.push(cv);
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
    }
    function getComplexityTerm(p) {
        if (p instanceof atoms_1.GTems.Atom)
            return 10;
        if (p instanceof atoms_1.GTems.Variable)
            return 0;
        if (p instanceof atoms_1.GTems.GList)
            return 40;
        if (p instanceof atoms_1.GTems.GValue)
            return 10;
        if (p instanceof atoms_1.GTems.Functor)
            return 10 + getComplexity(p);
        return 5;
    }
    function getComplexity(p) {
        if (p instanceof atoms_1.GTems.Atom) {
            return 10;
        }
        if (p instanceof atoms_1.GTems.Functor) {
            let prs = p.args.map(getComplexityTerm);
            var total = prs.reduce(function (a, b) { return a * b; }, 1);
            return total;
        }
        return 0;
    }
    // 1 -> a < b 
    function predicateEntryOrder(a, b) {
        let prior_A = -1;
        let prior_B = 1;
        if (a.entry.name > b.entry.name)
            return prior_A;
        if (a.entry.name < b.entry.name)
            return prior_B;
        if (a.prior > b.prior)
            return prior_A;
        if (a.prior < b.prior)
            return prior_B;
        if (util_1.isUndefined(a.condition) == false && util_1.isUndefined(b.condition))
            return prior_A;
        if (util_1.isUndefined(b.condition) == false && util_1.isUndefined(a.condition))
            return prior_B;
        if (a.complexity < 0)
            a.complexity = getComplexity(a.entry);
        if (b.complexity < 0)
            b.complexity = getComplexity(a.entry);
        let cp_a = (a.complexity);
        let cp_b = (b.complexity);
        if (cp_a > cp_b)
            return prior_A;
        if (cp_b > cp_a)
            return prior_B;
        if (util_1.isUndefined(a.condition) == false && util_1.isUndefined(b.condition) == false) {
            let cd_a = getComplexityTerm(a.condition);
            let cd_b = getComplexityTerm(b.condition);
            if (cd_a > cd_b)
                return prior_A;
            if (cd_b > cd_a)
                return prior_B;
        }
        return 0;
    }
    function understandEntryOrder(a, b) {
        let prior_A = -1;
        let prior_B = 1;
        if (a.prior > b.prior)
            return prior_A;
        if (a.prior < b.prior)
            return prior_B;
        if (util_1.isUndefined(a.condition) == false && util_1.isUndefined(b.condition))
            return prior_A;
        if (util_1.isUndefined(b.condition) == false && util_1.isUndefined(a.condition))
            return prior_B;
        let cp_a = (a.patternMatching).value.length;
        let cp_b = (b.patternMatching).value.length;
        if (cp_a > cp_b)
            return prior_A;
        if (cp_b > cp_a)
            return prior_B;
        if (util_1.isUndefined(a.condition) == false && util_1.isUndefined(b.condition) == false) {
            let cd_a = getComplexityTerm(a.condition);
            let cd_b = getComplexityTerm(b.condition);
            if (cd_a > cd_b)
                return prior_A;
            if (cd_b > cd_a)
                return prior_B;
        }
        return 0;
    }
    class Context {
        constructor() {
            //predicades: GTems.Functor[] = []
            this.values = [];
            this.predicades = [];
            this.understands = [];
            this.cons_atoms = [];
            this.predicades_id = 1;
            this.writebuffer = "";
            this.warringbuffer = [];
            this.var_atoms = [];
        }
        init_const() {
            let n = this.cons_atoms.length;
            for (var i = 0; i < n; i++) {
                let sol = new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_true(), {});
                let stk = new QueryStack();
                let computed = this.cons_atoms[i].value;
                for (var e of this.evaluate_query(stk, sol, this.cons_atoms[i].value)) {
                    if (solution_1.Solution.isValid(e)) {
                        computed = e.value;
                        break;
                    }
                }
                this.cons_atoms[i].value = computed;
            }
        }
        init_var() {
            let n = this.var_atoms.length;
            for (var i = 0; i < n; i++) {
                let sol = new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_true(), {});
                let stk = new QueryStack();
                let computed = this.var_atoms[i].value;
                for (var e of this.evaluate_query(stk, sol, this.var_atoms[i].value)) {
                    if (solution_1.Solution.isValid(e)) {
                        computed = e.value;
                        break;
                    }
                }
                this.var_atoms[i].value = computed;
            }
        }
        init() {
            this.init_const();
            this.init_var();
        }
        addPredicateFunc(p, code, condition, p_options) {
            if (p instanceof atoms_1.GTems.LiteralStr)
                return this.addUnderstandFunc(p, code, condition, p_options);
            if (p instanceof atoms_1.GTems.Variable)
                return this.addVarFunc(p, code, condition, p_options);
            this.predicades_id++;
            let p_priority = 0;
            for (var [i, opt] of p_options.entries()) {
                if (opt == "const")
                    return this.addConstFunc(p, code, condition, p_options);
                //if (opt == "var")   return this.addVarFunc( p,code ,condition, p_options)
            }
            for (var [i, opt] of p_options.entries()) {
                if (opt == "lowp")
                    p_priority = p_priority - 10000;
                if (opt == "highp")
                    p_priority = p_priority + 10000;
            }
            let unique_name = p.name + this.predicades_id.toString();
            let pred_actual = new PredicateEntry(unique_name, p, code, condition, p_priority + this.predicades_id);
            for (var [i, opt] of p_options.entries()) {
                if (opt == "unless")
                    pred_actual.set(PredicateKind.UNLESS);
                if (opt == "direct")
                    pred_actual.set(PredicateKind.DIRECT);
            }
            this.predicades.unshift(pred_actual);
            this.predicades = this.predicades.sort((a, b) => { return predicateEntryOrder(a, b); });
            return true;
        }
        addUnderstandFunc(pmatch, code, condition, p_options) {
            this.predicades_id++;
            let p_priority = 0;
            for (var [i, opt] of p_options.entries()) {
                if (opt == "lowp")
                    p_priority = p_priority - 10000;
                if (opt == "highp")
                    p_priority = p_priority + 10000;
            }
            let unique_name = "understand" + this.predicades_id.toString();
            let pred_actual = new UnderstandEntry(unique_name, pmatch, code, condition, p_priority + this.predicades_id);
            for (var [i, opt] of p_options.entries()) {
                if (opt == "unless")
                    pred_actual.set(PredicateKind.UNLESS);
                if (opt == "direct")
                    pred_actual.set(PredicateKind.DIRECT);
            }
            this.understands.unshift(pred_actual);
            this.understands = this.understands.sort((a, b) => { return understandEntryOrder(a, b); });
            return true;
        }
        addVarFunc(cname, code, condition, p_options) {
            let var_entry = new VarEntry(cname.name, code);
            this.var_atoms.unshift(var_entry);
            return true;
        }
        addConstFunc(cname, code, condition, p_options) {
            let const_entry = new ConstEntry(cname.name, code);
            this.cons_atoms.unshift(const_entry);
            return true;
        }
        existPredicate(stk, s, f_name, av) {
            for (var [i, p] of this.predicades.entries()) {
                if (p.entry instanceof atoms_1.GTems.Functor) {
                    if (p.entry.name == f_name)
                        if (av.length != p.entry.args.length)
                            continue;
                    let n = av.length;
                    let allBind = true;
                    for (var j = 0; j < n; j++) {
                        if (p.entry.args[j] instanceof atoms_1.GTems.Variable) {
                            allBind = false;
                            break;
                        }
                        let b = solution_1.Solution.bind(s, p.entry.args[j], av[j]);
                        if (solution_1.Solution.isValid(b) == false) {
                            allBind = false;
                            break;
                        }
                    }
                    if (allBind) {
                        return true;
                    }
                }
            }
            return false;
        }
        setPredicate(stk, s, f_name, av) {
            if (this.existPredicate(stk, s, f_name, av))
                return;
            this.predicades_id++;
            let unique_name = f_name + this.predicades_id.toString();
            let p = new atoms_1.GTems.Functor(f_name, ...av);
            let pred_actual = new PredicateEntry(unique_name, p, atoms_1.GTems.atom_true(), undefined, 0 + this.predicades_id);
            pred_actual.set(PredicateKind.NONDIRECT);
            this.predicades.unshift(pred_actual);
            this.predicades = this.predicades.sort((a, b) => { return predicateEntryOrder(a, b); });
        }
        unsetPredicate(stk, s, f_name, av) {
            let p_remove = [];
            for (var [i, p] of this.predicades.entries()) {
                if (p.entry instanceof atoms_1.GTems.Functor) {
                    if (p.entry.name == f_name)
                        if (av.length != p.entry.args.length)
                            continue;
                    let n = av.length;
                    let allBind = true;
                    for (var j = 0; j < n; j++) {
                        if (p.entry.args[j] instanceof atoms_1.GTems.Variable) {
                            allBind = false;
                            break;
                        }
                        let b = solution_1.Solution.bind(s, p.entry.args[j], av[j]);
                        if (solution_1.Solution.isValid(b) == false) {
                            allBind = false;
                            break;
                        }
                    }
                    if (allBind) {
                        p_remove.push(p.unique_name);
                    }
                }
            }
            for (var [i, u] of p_remove.entries()) {
                this.predicades = this.predicades.filter(el => { return el.unique_name !== u; });
            }
        }
        isList(v) {
            if (v instanceof atoms_1.GTems.GList) {
                return true;
            }
            return false;
        }
        isVar(v) {
            if (v instanceof atoms_1.GTems.Variable) {
                return true;
            }
            return false;
        }
        addPredicateAtom(v) {
            this.values.push(v);
        }
        getGlobalVariableValue(v1) {
            for (var [i, v] of this.var_atoms.entries()) {
                if (v.unique_name == v1.name)
                    return v.value;
            }
            return undefined;
        }
        setGlobalVariableValue(v_name, x1) {
            for (var [i, v] of this.var_atoms.entries()) {
                if (v.unique_name == v_name) {
                    v.value = x1;
                    return true;
                }
            }
            return false;
        }
        bind(sol, v1, v2) {
            let sol2 = sol;
            if (v1 instanceof atoms_1.GTems.Variable) {
                let x1 = this.getGlobalVariableValue(v1);
                if (util_1.isUndefined(x1) == false) {
                    sol2 = solution_1.Solution.bind(sol, v1, x1);
                }
            }
            let sol3 = sol2;
            if (v2 instanceof atoms_1.GTems.Variable) {
                let x2 = this.getGlobalVariableValue(v2);
                if (util_1.isUndefined(x2) == false) {
                    sol3 = solution_1.Solution.bind(sol2, v2, x2);
                }
            }
            let sol4 = solution_1.Solution.bind(sol2, v1, v2);
            let new_vars = {};
            for (var k in sol4.var_values) {
                if (this.setGlobalVariableValue(k, sol4.var_values[k]) == false) {
                    new_vars[k] = sol4.var_values[k];
                }
            }
            sol4.var_values = new_vars;
            return sol4;
        }
        expandString(stk, sol, x) {
            let buffer = "";
            let i = -1;
            let n = x.length;
            while (i < n - 1) {
                i = i + 1;
                if (x[i] == "$") {
                    let j = findEndAtom(x, i);
                    let varname = x.substr(i + 1, j - i - 1);
                    let vx = sol.var_values[varname];
                    buffer += (util_1.isUndefined(vx) ? "$" + varname : vx.toString());
                    i = j - 1;
                    continue;
                }
                if (x[i] == "[") {
                    let j = findEndBraket(x, i);
                    let inner = x.substr(i + 1, j - i - 1);
                    i = j;
                    let contents = inner.trim();
                    let vcontetns = undefined;
                    if (contents[0] == "$")
                        vcontetns = new atoms_1.GTems.Variable(contents.substr(1));
                    else
                        vcontetns = new atoms_1.GTems.Atom(contents);
                    for (var qrep of this.query_ar1(stk, sol, "repr", vcontetns)) {
                        if (qrep instanceof solution_1.Solution.Solution) {
                            if (solution_1.Solution.isValid(qrep)) {
                                // let next_exp = this.expandString( stk, qrep,qrep.value.toString()  )
                                // buffer +=  next_exp
                                buffer += qrep.value.toString();
                                break;
                            }
                        }
                    }
                    continue;
                }
                buffer += x[i];
            }
            return buffer;
        }
        *query_append(sol, q1, q2) {
            if (q1 instanceof atoms_1.GTems.GList) {
                let qcopy = q1.clone();
                qcopy.items.push(q2);
                let r = solution_1.Solution.fuse(sol, new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, qcopy, {}));
                yield r;
                return;
            }
            return;
        }
        *query_and(stk, sol, q1, q2) {
            for (var qq of this.evaluate_query(stk, sol, q1)) {
                let qsol = qq;
                if (solution_1.Solution.isValid(qsol)) {
                    let v = qsol.value;
                    if (v instanceof atoms_1.GTems.LiteralBool) {
                        if (v.value == false) {
                            yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QFalse, atoms_1.GTems.atom_false(), {});
                            continue; //nem tenta o segundo termo
                        }
                    }
                    for (var qz of this.evaluate_query(stk, solution_1.Solution.fuse(sol, qsol), q2)) {
                        if (solution_1.Solution.isValid(qz)) {
                            let fz = solution_1.Solution.fuse(qq, qz);
                            yield fz;
                        }
                    }
                }
            }
        }
        *query_or(stk, sol, q1, q2) {
            for (var qq of this.evaluate_query(stk, sol, q1)) {
                if (solution_1.Solution.isValid(qq)) {
                    let v = qq.value;
                    if (v instanceof atoms_1.GTems.LiteralBool) {
                        if (v.value == false) {
                            yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QFalse, atoms_1.GTems.atom_false(), {});
                            continue;
                        }
                    }
                    yield qq;
                }
            }
            //another term
            for (var qq of this.evaluate_query(stk, sol, q2)) {
                if (solution_1.Solution.isValid(qq)) {
                    let v = qq.value;
                    if (v instanceof atoms_1.GTems.LiteralBool) {
                        if (v.value == false) {
                            yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QFalse, atoms_1.GTems.atom_false(), {});
                            continue;
                        }
                    }
                    yield qq;
                }
            }
        }
        all_query(q) {
            this.warringbuffer = [];
            this.writebuffer = "";
            let sol = new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_true(), {});
            let stk = new QueryStack();
            let r = [];
            for (var qz of this.query(stk, sol, q)) {
                if (solution_1.Solution.isValid(qz)) {
                    r.push(qz);
                }
            }
            for (var [i, wm] of this.warringbuffer.entries()) {
                //process.stderr.write("Warring:" + wm) 
                console.log("Warring:" + wm);
            }
            let mwriteP = this.writebuffer.replace(new RegExp("\\\\n", 'g'), "\r\n");
            //process.stdout.write(mwriteP)   
            console.log(mwriteP);
            return r;
        }
        *query(stk, sol, q) {
            if (q instanceof atoms_1.GTems.Functor) {
                if (q.name == "and") {
                    for (var qq of this.query_and(stk, sol, q.args[0], q.args[1]))
                        yield qq;
                    return;
                }
                if (q.name == "or") {
                    for (var qq of this.query_or(stk, sol, q.args[0], q.args[1]))
                        yield qq;
                    return;
                }
                if (q.args.length == 0) {
                    for (var qx0 of this.query_ar0(stk, sol, q.name)) {
                        yield qx0;
                    }
                    return;
                }
                if (q.args.length == 1) {
                    for (var qx of this.query_ar1(stk, sol, q.name, q.args[0])) {
                        yield qx;
                    }
                    return;
                }
                if (q.args.length == 2) {
                    for (var qy of this.query_ar2(stk, sol, q.name, q.args[0], q.args[1])) {
                        yield qy;
                    }
                    return;
                }
                if (q.args.length == 3) {
                    for (var qz of this.query_ar3(stk, sol, q.name, q.args[0], q.args[1], q.args[2])) {
                        yield qz;
                    }
                    return;
                }
            }
            if (q instanceof atoms_1.GTems.LiteralBool) {
                if (q.value == false)
                    yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QFalse, q, {});
                if (q.value == true)
                    yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, q, {});
                return;
            }
            if (q instanceof atoms_1.GTems.Atom) {
                if (q.name == "true") {
                    yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, q, {});
                    return;
                }
                if (q.name == "false") {
                    yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QFalse, q, {});
                    return;
                }
                if (q.name == "fail") {
                    yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QFail, q, {});
                    return;
                }
                if (q.name == "cut") {
                    yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QCut, q, {});
                    return;
                }
                yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, q, {}); //fail
                return;
            }
            if (q instanceof atoms_1.GTems.Variable) {
                for (var [vi, ve] of this.var_atoms.entries()) {
                    if (ve.unique_name == q.name) {
                        yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, ve.value, {});
                        return;
                    }
                }
                if (this.isVar(q)) {
                    let qval = solution_1.Solution.getValue(sol, q);
                    if (util_1.isUndefined(qval)) {
                        yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QFalse, qval, {}); //fail                        
                    }
                    else {
                        yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, qval, {});
                    }
                    return;
                }
            }
            if (q instanceof atoms_1.GTems.LiteralNumber) {
                yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, q, {});
                return;
            }
            if (q instanceof atoms_1.GTems.LiteralStr) {
                yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, q, {});
                return;
            }
            if (q instanceof atoms_1.GTems.GList) {
                yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, q, {});
                return;
            }
            throw new Error('Unassigned Term Evaluator ' + q.toString());
        }
        *evaluate_query(stk, sol, code) {
            if (code instanceof atoms_1.GTems.Atom) {
                if (code.name == "true") {
                    yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, new atoms_1.GTems.LiteralBool(true), {});
                    return;
                }
                if (code.name == "false") {
                    yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QFalse, new atoms_1.GTems.LiteralBool(false), {});
                    return;
                }
                if (code.name == "fail") {
                    yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QFail, code, {});
                    return;
                }
                if (code.name == "cut") {
                    yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QCut, code, {});
                    return;
                }
                for (var [i, cc] of this.cons_atoms.entries()) {
                    if (cc.unique_name == code.name) {
                        yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, cc.value, {});
                        return;
                    }
                }
            }
            if (code instanceof atoms_1.GTems.Variable) {
                if (code.name == "_") {
                    yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, code, {});
                    return;
                }
                for (var [vi, ve] of this.var_atoms.entries()) {
                    if (ve.unique_name == code.name) {
                        yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, ve.value, {});
                        return;
                    }
                }
                let code_value = solution_1.Solution.getValue(sol, code);
                if (util_1.isUndefined(code_value)) {
                    yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, code, {});
                    return;
                }
                yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, code_value, {});
                return;
            }
            if (code instanceof atoms_1.GTems.LiteralNumber) {
                yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, code, {});
                return;
            }
            if (code instanceof atoms_1.GTems.LiteralBool) {
                yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, code, {});
                return;
            }
            if (code instanceof atoms_1.GTems.GList) {
                for (var ecc of this.eval_rec(stk, sol, [], code.items)) {
                    yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, new atoms_1.GTems.GList(ecc), {});
                }
                return;
            }
            for (var qin of this.query(stk, sol, code)) {
                let fsol = solution_1.Solution.fuse(sol, qin);
                if (solution_1.Solution.isValid(fsol)) {
                    yield fsol;
                }
            }
        }
        //Parse 
        *string_match(stk, arg1, patternMatching) {
            for (var variables of parse_1.MParse.uparseString(arg1.value, patternMatching.value)) {
                {
                    let sol = new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_true(), {});
                    for (var k in variables) {
                        let x = variables[k];
                        let val = undefined;
                        {
                            if (x.length == 1) {
                                val = new atoms_1.GTems.LiteralStr(x[0].gettext());
                            }
                            else {
                                let all_str = [];
                                for (var [i, xx] of x.entries()) {
                                    all_str.push(xx.gettext());
                                }
                                val = new atoms_1.GTems.LiteralStr(all_str.join(" "));
                            }
                        }
                        while (k[0] == "$")
                            k = k.substr(1);
                        sol = sol.add(k, val);
                    }
                    yield sol;
                }
            }
        }
        *string_parse(stk, arg1) {
            for (var [i, umm] of this.understands.entries()) {
                for (var variables_sol of this.string_match(stk, arg1, umm.patternMatching)) {
                    for (var r of this.evaluate_query(stk, variables_sol, umm.value)) {
                        yield r;
                    }
                }
            }
        }
        //buildIn Predicates
        *buildIn_arith_op(stk, sol, arg1, arg2, f) {
            //arg1 nao rh uma variavel ..bind o argumento para o valor dela ..senao,bind na saida
            let sol_next = new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_true(), {});
            if (this.isVar(arg1))
                new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QFalse, atoms_1.GTems.atom_false(), {});
            if (this.isVar(arg2))
                new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QFalse, atoms_1.GTems.atom_false(), {});
            for (var v1 of this.evaluate_query(stk, sol, arg1)) {
                if (solution_1.Solution.isValid(v1) == false)
                    continue;
                for (var v2 of this.evaluate_query(stk, sol, arg2)) {
                    if (solution_1.Solution.isValid(v2) == false)
                        continue;
                    if (v1.value instanceof atoms_1.GTems.LiteralNumber) {
                        if (v2.value instanceof atoms_1.GTems.LiteralNumber) {
                            let z = f(v1.value.value, v2.value.value);
                            {
                                yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, new atoms_1.GTems.LiteralNumber(z), {});
                            }
                        }
                    }
                }
            }
        }
        *buildIn_binary_op(stk, sol, arg1, arg2, f) {
            //arg1 nao rh uma variavel ..bind o argumento para o valor dela ..senao,bind na saida
            let sol_next = new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_true(), {});
            if (this.isVar(arg1))
                new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QFalse, atoms_1.GTems.atom_false(), {});
            if (this.isVar(arg2))
                new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QFalse, atoms_1.GTems.atom_false(), {});
            for (var v1 of this.evaluate_query(stk, sol, arg1)) {
                if (solution_1.Solution.isValid(v1) == false)
                    continue;
                for (var v2 of this.evaluate_query(stk, sol, arg2)) {
                    if (solution_1.Solution.isValid(v2) == false)
                        continue;
                    let z = f(v1.value, v2.value);
                    {
                        if (util_1.isUndefined(z) == false)
                            yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, z, {});
                    }
                }
            }
        }
        *buildIn_cmp_op(stk, sol, arg1, arg2, f) {
            //arg1 nao rh uma variavel ..bind o argumento para o valor dela ..senao,bind na saida
            let sol_next = new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_true(), {});
            if (this.isVar(arg1))
                new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QFalse, atoms_1.GTems.atom_false(), {});
            if (this.isVar(arg2))
                new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QFalse, atoms_1.GTems.atom_false(), {});
            for (var v1 of this.evaluate_query(stk, sol, arg1)) {
                for (var v2 of this.evaluate_query(stk, sol, arg2)) {
                    if (v1.value instanceof atoms_1.GTems.LiteralNumber) {
                        if (v2.value instanceof atoms_1.GTems.LiteralNumber) {
                            if (f(v1.value.value, v2.value.value)) {
                                yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, new atoms_1.GTems.LiteralBool(true), {});
                            }
                            else {
                                yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, new atoms_1.GTems.LiteralBool(false), {});
                            }
                        }
                    }
                }
            }
            return new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QFalse, atoms_1.GTems.atom_false(), {});
        }
        *buildIn_gte(stk, sol, arg1, arg2) {
            for (var vv of this.buildIn_cmp_op(stk, sol, arg1, arg2, (x1, x2) => { return x1 >= x2; }))
                yield vv;
        }
        *buildIn_lte(stk, sol, arg1, arg2) {
            for (var vv of this.buildIn_cmp_op(stk, sol, arg1, arg2, (x1, x2) => { return x1 <= x2; }))
                yield vv;
        }
        *buildIn_lt(stk, sol, arg1, arg2) {
            for (var vv of this.buildIn_cmp_op(stk, sol, arg1, arg2, (x1, x2) => { return x1 < x2; }))
                yield vv;
        }
        *buildIn_gt(stk, sol, arg1, arg2) {
            for (var vv of this.buildIn_cmp_op(stk, sol, arg1, arg2, (x1, x2) => { return x1 > x2; }))
                yield vv;
        }
        *buildIn_mul(stk, sol, arg1, arg2) {
            for (var vv of this.buildIn_arith_op(stk, sol, arg1, arg2, (x1, x2) => { return x1 * x2; }))
                yield vv;
        }
        *buildIn_add(stk, sol, arg1, arg2) {
            //for (var vv of this.buildIn_arith_op(stk, sol, arg1,arg2 ,  (x1,x2)=>{return x1+x2}  )) yield vv
            for (var vv of this.buildIn_binary_op(stk, sol, arg1, arg2, (x1, x2) => {
                if (x1 instanceof atoms_1.GTems.LiteralStr)
                    if (x2 instanceof atoms_1.GTems.LiteralStr) {
                        return new atoms_1.GTems.LiteralStr(x1.value + x2.value);
                    }
                if (x1 instanceof atoms_1.GTems.LiteralNumber)
                    if (x2 instanceof atoms_1.GTems.LiteralNumber) {
                        return new atoms_1.GTems.LiteralNumber(x1.value + x2.value);
                    }
                return undefined;
            }))
                yield vv;
        }
        *buildIn_minus(stk, sol, arg1, arg2) {
            for (var vv of this.buildIn_arith_op(stk, sol, arg1, arg2, (x1, x2) => { return x1 - x2; }))
                yield vv;
        }
        *buildIn_div(stk, sol, arg1, arg2) {
            for (var vv of this.buildIn_arith_op(stk, sol, arg1, arg2, (x1, x2) => { return x1 / x2; }))
                yield vv;
        }
        *buildIn_mod(stk, sol, arg1, arg2) {
            for (var vv of this.buildIn_arith_op(stk, sol, arg1, arg2, (x1, x2) => { return x1 % x2; }))
                yield vv;
        }
        *buildIn_head(stk, sol, arg1, arg2) {
            //arg1 nao rh uma variavel ..bind o argumento para o valor dela ..senao,bind na saida
            let sol_next = new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_true(), {});
            // if (this.isVar(arg1)) new Solution.Solution(Solution.SolutionState.QFalse, GTems.atom_false(), {})
            if (this.isVar(arg2)) {
                this.warring("head of a unbound variable is not possible");
                // yield new Solution.Solution(Solution.SolutionState.QFalse, GTems.atom_false(), {})
            }
            if (arg2 instanceof atoms_1.GTems.GList) {
                if (arg2.items.length > 0) {
                    let head = arg2.items[0];
                    let ss2 = this.bind(sol, head, arg1);
                    yield ss2;
                }
            }
            // return new Solution.Solution(Solution.SolutionState.QFalse, GTems.atom_false(), {})
        }
        *buildIn_tail(stk, sol, arg1, arg2) {
            //arg1 nao rh uma variavel ..bind o argumento para o valor dela ..senao,bind na saida
            let sol_next = new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_true(), {});
            // if (this.isVar(arg1)) new Solution.Solution(Solution.SolutionState.QFalse, GTems.atom_false(), {})
            if (this.isVar(arg2)) {
                this.warring("tail of a unbound variable is not possible");
                //yield new Solution.Solution(Solution.SolutionState.QFalse, GTems.atom_false(), {})
            }
            if (arg2 instanceof atoms_1.GTems.GList) {
                if (arg2.items.length > 0) {
                    let tail = arg2.clone();
                    tail.items.shift();
                    let s = this.bind(sol, tail, arg1);
                    yield s;
                }
            }
            //return new Solution.Solution(Solution.SolutionState.QFalse, GTems.atom_false(), {})
        }
        *buildIn_atom_string(stk, sol, arg1, arg2) {
            let sol_next = new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_true(), {});
            if ((arg1 instanceof atoms_1.GTems.Atom) && (arg2 instanceof atoms_1.GTems.Variable)) {
                let s1 = new atoms_1.GTems.LiteralStr(arg1.name);
                yield this.bind(sol_next, arg2, s1);
                return;
            }
            if ((arg1 instanceof atoms_1.GTems.Variable) && (arg2 instanceof atoms_1.GTems.LiteralStr)) {
                let s2 = new atoms_1.GTems.Atom(arg2.value);
                yield this.bind(sol_next, arg1, s2);
                return;
            }
            if ((arg1 instanceof atoms_1.GTems.Atom) && (arg2 instanceof atoms_1.GTems.LiteralStr)) {
                if (arg1.name == arg2.value) {
                    yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_true(), {});
                }
                else {
                    yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QFalse, atoms_1.GTems.atom_false(), {});
                }
                return;
            }
            throw new Error("invalid argument for atom_string");
        }
        *buildIn_member(stk, sol, arg1, arg2) {
            let sol_next = new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_true(), {});
            if (arg2 instanceof atoms_1.GTems.GList) {
                for (var i = 0; i < arg2.items.length; i++) {
                    let r = this.bind(sol_next, arg2.items[i], arg1);
                    if (solution_1.Solution.isValid(r)) {
                        yield r;
                    }
                }
                return;
            }
            throw new Error("invalid argument for member, segond arg must be a list");
        }
        *buildIn_nextto(stk, sol, arg1, arg2, arg3) {
            let sol_next = new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_true(), {});
            if (arg3 instanceof atoms_1.GTems.GList) {
                for (var i = 0; i <= arg3.items.length - 1; i++) {
                    let x1 = arg3.items[i];
                    let r = this.bind(sol_next, x1, arg1);
                    if (solution_1.Solution.isValid(r)) {
                        let r2 = this.bind(r, arg3.items[i + 1], arg2);
                        if (solution_1.Solution.isValid(r2)) {
                            yield r2;
                        }
                    }
                }
            }
        }
        *buildIn_append(stk, sol, arg1, arg2, arg3) {
            let sol_next = new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_true(), {});
            if (arg1 instanceof atoms_1.GTems.GList) {
                if (arg2 instanceof atoms_1.GTems.GList) {
                    let qs = arg1.items.concat(arg2.items);
                    let ql = new atoms_1.GTems.GList(qs);
                    let r = this.bind(sol_next, ql, arg3);
                    yield r;
                    return;
                }
            }
            if (arg3 instanceof atoms_1.GTems.GList) {
                if ((arg1 instanceof atoms_1.GTems.Variable) && (arg2 instanceof atoms_1.GTems.GList)) {
                    if (arg2.items.length > arg3.items.length)
                        return;
                    let nlast = arg2.items.length;
                    let q2 = new atoms_1.GTems.GList(arg3.items.slice(nlast));
                    let r = this.bind(sol_next, q2, arg2);
                    if (solution_1.Solution.isValid(r)) {
                        let q1 = new atoms_1.GTems.GList(arg3.items.slice(0, nlast));
                        yield this.bind(r, q1, arg1);
                    }
                }
                if ((arg1 instanceof atoms_1.GTems.GList) && (arg2 instanceof atoms_1.GTems.Variable)) {
                    if (arg1.items.length > arg3.items.length)
                        return;
                    let nlast = arg3.items.length - arg1.items.length;
                    let q1 = new atoms_1.GTems.GList(arg3.items.slice(0, arg1.items.length));
                    let q2 = new atoms_1.GTems.GList(arg3.items.slice(nlast));
                    let r = this.bind(sol_next, q1, arg1);
                    if (solution_1.Solution.isValid(r)) {
                        yield this.bind(r, q2, arg2);
                    }
                }
                if ((arg1 instanceof atoms_1.GTems.Variable) && (arg2 instanceof atoms_1.GTems.Variable)) {
                    for (var i = 0; i <= arg3.items.length; i++) {
                        let q1 = new atoms_1.GTems.GList(arg3.items.slice(0, i));
                        let q2 = new atoms_1.GTems.GList(arg3.items.slice(i));
                        let r = this.bind(sol_next, q1, arg1);
                        if (solution_1.Solution.isValid(r)) {
                            let r2 = this.bind(r, q2, arg2);
                            yield r2;
                        }
                    }
                }
                return;
            }
            throw new Error("invalid arguments");
        }
        *buildIn_ht(stk, sol, arg1, arg2, arg3) {
            let sol_next = new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_true(), {});
            if (arg3 instanceof atoms_1.GTems.GList) {
                if (arg3.items.length > 0) {
                    let t = arg3.clone();
                    let h = t.items[0];
                    t.items.shift();
                    let s = this.bind(sol, t, arg2);
                    s = this.bind(s, h, arg1);
                    yield s;
                }
                return;
            }
            if (arg3 instanceof atoms_1.GTems.Variable)
                if (arg2 instanceof atoms_1.GTems.GList) {
                    let nlist1 = new atoms_1.GTems.GList([arg1]);
                    for (var v of this.buildIn_append(stk, sol, nlist1, arg2, arg3))
                        yield v;
                    return;
                }
            return;
            throw new Error("invalid arguments");
        }
        *eval_rec(stk, sol, acc, args) {
            if (args.length == 0) {
                yield acc;
                return;
            }
            let args_c = Object.assign([], args);
            let arg = args_c.shift();
            for (var v of this.evaluate_query(stk, sol, arg)) {
                if (solution_1.Solution.isValid(v)) {
                    let acc2 = Object.assign([], acc);
                    acc2.push(v.value);
                    for (var rval of this.eval_rec(stk, sol, acc2, args_c))
                        yield rval;
                }
            }
        }
        *apply_rec(stk, sol, acc, args, func) {
            if (args.length == 0) {
                yield acc;
                return;
            }
            let args_c = Object.assign([], args);
            let arg = args_c.shift();
            for (var v of this.evaluate_query(stk, sol, arg)) {
                if (solution_1.Solution.isValid(v)) {
                    for (var qs of this.query_ar1(stk, sol, func, v.value)) {
                        if (qs instanceof solution_1.Solution.Solution) {
                            let acc2 = Object.assign([], acc);
                            acc2.push(qs.value);
                            for (var rval of this.apply_rec(stk, sol, acc2, args_c, func))
                                yield rval;
                        }
                    }
                }
            }
        }
        *buildIn_maplist(stk, sol, arg1, arg2) {
            let sol_next = new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_true(), {});
            if (this.isVar(arg1)) {
                this.warring("maplist of a unbound predicate is not possible");
                yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QFalse, atoms_1.GTems.atom_false(), {});
            }
            if (this.isVar(arg2)) {
                this.warring(" maplist of a unbound input list is not possible");
                yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QFalse, atoms_1.GTems.atom_false(), {});
            }
            if (arg1 instanceof atoms_1.GTems.Atom) {
                if (arg2 instanceof atoms_1.GTems.GList) {
                    for (var qs of this.apply_rec(stk, sol, [], arg2.items, arg1.name))
                        yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, new atoms_1.GTems.GList(qs), {});
                }
            }
        }
        //general call
        *query_ar3(stk, sol, f_name, _arg1, _arg2, _arg3) {
            let hasY = false;
            for (var s of this.query_ar3_inner(stk, sol, PredicateKind.NOMINAL, f_name, _arg1, _arg2, _arg3)) {
                yield s;
                if (solution_1.Solution.isValid(s))
                    hasY = true;
            }
            //nao achou uma solução..entao tenta o unless
            if (hasY == false) {
                for (var sq of this.query_ar3_inner(stk, sol, PredicateKind.UNLESS, f_name, _arg1, _arg2, _arg3)) {
                    yield sq;
                }
            }
            return;
        }
        *query_ar3_inner(stk, sol, attribSelect, f_name, _arg1, _arg2, _arg3) {
            for (var x1 of this.evaluate_query(stk, sol, _arg1)) {
                if (solution_1.Solution.isValid(x1)) {
                    let nsol = solution_1.Solution.fuse(sol, x1);
                    for (var x2 of this.evaluate_query(stk, nsol, _arg2)) {
                        if (solution_1.Solution.isValid(x2)) {
                            let nsol2 = solution_1.Solution.fuse(nsol, x2);
                            for (var x3 of this.evaluate_query(stk, nsol2, _arg3)) {
                                if (solution_1.Solution.isValid(x3)) {
                                    let nsol3 = solution_1.Solution.fuse(nsol2, x3);
                                    for (var z of this.query_ar3_inner_argv(stk, nsol3, attribSelect, f_name, x1.value, x2.value, x3.value)) {
                                        yield z;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        *query_ar3_inner_argv(stk, sol, attribSelect, f_name, _arg1, _arg2, _arg3) {
            if (util_1.isArray(_arg1))
                _arg1 = _arg1[0];
            if (util_1.isArray(_arg2))
                _arg2 = _arg2[0];
            if (util_1.isArray(_arg3))
                _arg3 = _arg3[0];
            let arg1 = _arg1;
            let arg2 = _arg2;
            let arg3 = _arg3;
            if (f_name == "append") {
                for (var ssk of this.buildIn_append(stk, sol, arg1, arg2, arg3))
                    yield ssk;
                return;
            }
            if (f_name == "HT") {
                for (var ssk of this.buildIn_ht(stk, sol, arg1, arg2, arg3))
                    yield ssk;
                return;
            }
            if (f_name == "nextto") {
                for (var ssn of this.buildIn_nextto(stk, sol, arg1, arg2, arg3))
                    yield ssn;
                return;
            }
            let hasFound = false;
            let query_satisf = false;
            let pnamed = this.predicades.filter(x => { return x.entry.name === f_name; });
            for (var [i, p] of pnamed.entries()) {
                // if (query_satisf)  continue
                if (p.entry.name != f_name)
                    continue;
                let pp = p.entry;
                if (pp instanceof atoms_1.GTems.Functor) {
                    if (p.has(attribSelect) == false)
                        continue; //UNLESS
                    hasFound = true;
                    if (pp.args.length != 3)
                        continue;
                    let pa0 = pp.args[0];
                    if (util_1.isArray(pa0))
                        pa0 = pa0[0];
                    let pa1 = pp.args[1];
                    if (util_1.isArray(pa1))
                        pa1 = pa1[0];
                    let pa2 = pp.args[2];
                    if (util_1.isArray(pa2))
                        pa2 = pa2[0];
                    if (stk.contains(p.unique_name, arg1, arg2, arg3))
                        continue; //nao tenta de novo se ja estiver tetando dar query no mesmo predicado e nos mesmo parametros
                    let stk_next = stk.pushCall(p.unique_name, arg1, arg2, arg3);
                    //arg1 nao rh uma variavel ..bind o argumento para o valor dela ..senao,bind na saida
                    let sol_next = new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_true(), {});
                    if (this.isVar(arg1) == false) {
                        sol_next = this.bind(sol_next, pa0, arg1);
                    }
                    if (this.isVar(arg2) == false) {
                        sol_next = this.bind(sol_next, pa1, arg2);
                    }
                    if (this.isVar(arg3) == false) {
                        sol_next = this.bind(sol_next, pa2, arg3);
                    }
                    //same parameter 
                    if (this.isVar(pa1) && this.isVar(pa2)) {
                        if (pa1 instanceof atoms_1.GTems.Variable)
                            if (pa2 instanceof atoms_1.GTems.Variable) {
                                if (pa1.name == pa2.name) {
                                }
                            }
                    }
                    // testa a condicao de ativacao do predicado
                    let cond_satisf = true;
                    if (util_1.isUndefined(p.condition) == false) {
                        cond_satisf = false;
                        //testa a condicao
                        for (var sol_cond of this.evaluate_query(stk_next, sol_next, p.condition)) {
                            if (solution_1.Solution.isValid(sol_cond)) {
                                cond_satisf = true;
                                sol_next = solution_1.Solution.fuse(sol_next, sol_cond);
                                break; //apenas a primeira true ja serve
                            }
                        }
                    }
                    if (cond_satisf == false)
                        continue; // nem testa o corpo .. proximo termo
                    if (solution_1.Solution.isValid(sol_next) == false)
                        continue;
                    for (var sol_next_inner of this.evaluate_query(stk_next, sol_next, p.value)) {
                        if (solution_1.Solution.isValid(sol_next_inner) == false)
                            continue;
                        sol_next_inner = solution_1.Solution.fuse(sol_next_inner, sol_next);
                        let sol_n = new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_true(), {});
                        sol_n = solution_1.Solution.fuse(sol, sol_n); //just a copy 
                        if (this.isVar(arg1)) //arg1 eh uma variavel ? bind para o resultado 
                         {
                            let v_ret = solution_1.Solution.getValue(sol_next_inner, pa0);
                            if (util_1.isUndefined(v_ret) == false)
                                sol_n = this.bind(sol_n, v_ret, arg1);
                        }
                        if (solution_1.Solution.isValid(sol_n) == false)
                            continue;
                        if (this.isVar(arg2)) //arg1 eh uma variavel ? bind para o resultado 
                         {
                            let v_ret = solution_1.Solution.getValue(sol_next_inner, pa1);
                            if (util_1.isUndefined(v_ret) == false)
                                sol_n = this.bind(sol_n, v_ret, arg2);
                        }
                        if (solution_1.Solution.isValid(sol_n) == false)
                            continue;
                        if (this.isVar(arg3)) //arg1 eh uma variavel ? bind para o resultado 
                         {
                            let v_ret = solution_1.Solution.getValue(sol_next_inner, pa2);
                            if (util_1.isUndefined(v_ret) == false)
                                sol_n = this.bind(sol_n, v_ret, arg3);
                        }
                        if (solution_1.Solution.isValid(sol_n) == false)
                            continue;
                        query_satisf = true;
                        let ret = sol_n.add_value(sol_next_inner);
                        if (ret.state == solution_1.Solution.SolutionState.QCut || p.has(PredicateKind.DIRECT)) {
                            ret.state = solution_1.Solution.SolutionState.QTrue;
                            yield ret;
                            return;
                        }
                        else {
                            yield ret;
                        }
                    }
                }
            }
            if (attribSelect != PredicateKind.UNLESS)
                if (hasFound == false) {
                    this.warring("Predicate " + f_name + "/3  not found ");
                }
        }
        *query_ar2(stk, sol, f_name, _arg1, _arg2) {
            let hasY = false;
            for (var s of this.query_ar2_inner(stk, sol, PredicateKind.NOMINAL, f_name, _arg1, _arg2)) {
                yield s;
                if (solution_1.Solution.isValid(s))
                    hasY = true;
            }
            if (hasY == false) {
                for (var sq of this.query_ar2_inner(stk, sol, PredicateKind.UNLESS, f_name, _arg1, _arg2)) {
                    yield sq;
                }
            }
            return;
        }
        *query_ar2_inner(stk, sol, attribSelect, f_name, _arg1, _arg2) {
            if (f_name == "findall") {
                let results = [];
                if (_arg1 instanceof atoms_1.GTems.Variable) {
                    for (var x2 of this.evaluate_query(stk, sol, _arg2)) {
                        if (solution_1.Solution.isValid(x2)) {
                            results.push(x2.var_values[_arg1.name]);
                        }
                    }
                }
                var cpy = new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, new atoms_1.GTems.GList(results), {});
                yield cpy;
                return;
            }
            if (f_name == "assign") {
                if (_arg1 instanceof atoms_1.GTems.Variable) {
                    for (var x2 of this.evaluate_query(stk, sol, _arg2)) {
                        if (solution_1.Solution.isValid(x2)) {
                            if (this.setGlobalVariableValue(_arg1.name, x2.value)) {
                                yield sol;
                            }
                            else {
                                var cpy = solution_1.Solution.fuse(new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_true(), {}), sol);
                                cpy.var_values[_arg1.name] = x2.value;
                                yield cpy;
                            }
                        }
                    }
                }
                return;
            }
            for (var x1 of this.evaluate_query(stk, sol, _arg1)) {
                if (solution_1.Solution.isValid(x1)) {
                    let nsol = solution_1.Solution.fuse(sol, x1);
                    for (var x2 of this.evaluate_query(stk, nsol, _arg2)) {
                        if (solution_1.Solution.isValid(x2)) {
                            let nsol2 = solution_1.Solution.fuse(nsol, x2);
                            for (var z of this.query_ar2_inner_argv(stk, nsol2, attribSelect, f_name, x1.value, x2.value)) {
                                yield z;
                            }
                        }
                    }
                }
            }
        }
        *query_ar2_inner_argv(stk, sol, attribSelect, f_name, _arg1, _arg2) {
            if (util_1.isArray(_arg1))
                _arg1 = _arg1[0];
            if (util_1.isArray(_arg2))
                _arg2 = _arg2[0];
            let arg1 = _arg1;
            let arg2 = _arg2;
            if (f_name == "unify") {
                var bvar = this.bind(sol, arg1, arg2);
                yield bvar;
                return;
            }
            if (f_name == "equal") {
                var bvar_e = this.bind(sol, arg1, arg2);
                if (solution_1.Solution.isValid(bvar_e))
                    yield new solution_1.Solution.Solution(bvar_e.state, atoms_1.GTems.atom_true(), {});
                else
                    yield new solution_1.Solution.Solution(bvar_e.state, atoms_1.GTems.atom_false(), {});
                return;
            }
            if (f_name == "not_equal") {
                var bvar_e = this.bind(sol, arg1, arg2);
                if (solution_1.Solution.isValid(bvar_e)) {
                    yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_false(), {});
                }
                else {
                    yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_true(), {});
                }
                return;
            }
            // if (f_name == "append") {
            //     for (var qq of this.query_append(sol, arg1, arg2)) {
            //         yield qq
            //     }
            //     return
            // }
            if (f_name == "member") {
                for (var qqm of this.buildIn_member(stk, sol, arg1, arg2)) {
                    yield qqm;
                }
                return;
            }
            if (f_name == "atom_string") {
                for (var qqm of this.buildIn_atom_string(stk, sol, arg1, arg2)) {
                    yield qqm;
                }
                return;
            }
            if (f_name == "and") {
                for (var qq of this.query_and(stk, sol, arg1, arg2)) {
                    yield qq;
                }
                return;
            }
            if (f_name == "plus") {
                for (var ssk of this.buildIn_add(stk, sol, arg1, arg2))
                    yield ssk;
                //yield this.buildIn_add(stk,sol, arg1, arg2)
                return;
            }
            if (f_name == "minus") {
                for (var ss8 of this.buildIn_minus(stk, sol, arg1, arg2))
                    yield ss8;
                //yield this.buildIn_minus(stk,sol, arg1, arg2)
                return;
            }
            if (f_name == "div") {
                for (var ss81 of this.buildIn_div(stk, sol, arg1, arg2))
                    yield ss81;
                return;
            }
            if (f_name == "mod") {
                for (var ss82 of this.buildIn_mod(stk, sol, arg1, arg2))
                    yield ss82;
                return;
            }
            if (f_name == ">") {
                //yield this.buildIn_gt(stk,sol, arg1, arg2)
                for (var ss7 of this.buildIn_gt(stk, sol, arg1, arg2))
                    yield ss7;
                return;
            }
            if (f_name == "<") {
                //yield this.buildIn_lt(stk,sol, arg1, arg2)
                for (var ss5 of this.buildIn_lt(stk, sol, arg1, arg2))
                    yield ss5;
                return;
            }
            if (f_name == ">=") {
                //yield this.buildIn_gt(stk,sol, arg1, arg2)
                for (var ss7 of this.buildIn_gte(stk, sol, arg1, arg2))
                    yield ss7;
                return;
            }
            if (f_name == "<=") {
                //yield this.buildIn_lt(stk,sol, arg1, arg2)
                for (var ss5 of this.buildIn_lte(stk, sol, arg1, arg2))
                    yield ss5;
                return;
            }
            if (f_name == "*") {
                // yield this.buildIn_mul(stk,sol, arg1, arg2)
                for (var ss4 of this.buildIn_mul(stk, sol, arg1, arg2)) {
                    yield ss4;
                }
                return;
            }
            if (f_name == "head") {
                // yield this.buildIn_head(stk,sol, arg1, arg2)
                for (var ss2 of this.buildIn_head(stk, sol, arg1, arg2))
                    yield ss2;
                return;
            }
            if (f_name == "tail") {
                //yield this.buildIn_tail(stk,sol, arg1, arg2)
                for (var ss2 of this.buildIn_tail(stk, sol, arg1, arg2))
                    yield ss2;
                return;
            }
            if (f_name == "maplist") {
                //yield this.buildIn_tail(stk,sol, arg1, arg2)
                for (var ssm of this.buildIn_maplist(stk, sol, arg1, arg2))
                    yield ssm;
                return;
            }
            if (f_name == "match") {
                if (arg1 instanceof atoms_1.GTems.LiteralStr) {
                    if (arg2 instanceof atoms_1.GTems.LiteralStr) {
                        for (var msol of this.string_match(stk, arg1, arg2)) {
                            yield msol;
                        }
                    }
                }
                return;
            }
            let hasFound = false;
            let query_satisf = false;
            let pnamed = this.predicades.filter(x => { return x.entry.name === f_name; });
            for (var [i, p] of pnamed.entries()) {
                // if (query_satisf)  continue
                if (p.entry.name != f_name)
                    continue;
                let pp = p.entry;
                if (pp instanceof atoms_1.GTems.Functor) {
                    if (p.has(attribSelect) == false)
                        continue; //UNLESS
                    hasFound = true;
                    if (pp.args.length != 2)
                        continue;
                    let pa0 = pp.args[0];
                    if (util_1.isArray(pa0))
                        pa0 = pa0[0];
                    let pa1 = pp.args[1];
                    if (util_1.isArray(pa1))
                        pa1 = pa1[0];
                    if (stk.contains(p.unique_name, arg1, arg2))
                        continue; //nao tenta de novo se ja estiver tetando dar query no mesmo predicado e nos mesmo parametros
                    let stk_next = stk.pushCall(p.unique_name, arg1, arg2);
                    //arg1 nao rh uma variavel ..bind o argumento para o valor dela ..senao,bind na saida
                    let sol_next = new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_true(), {});
                    if (this.isVar(arg1) == false) {
                        sol_next = this.bind(sol_next, pa0, arg1);
                    }
                    if (this.isVar(arg2) == false) {
                        sol_next = this.bind(sol_next, pa1, arg2);
                    }
                    // testa a condicao de ativacao do predicado
                    let cond_satisf = true;
                    if (util_1.isUndefined(p.condition) == false) {
                        cond_satisf = false;
                        //testa a condicao
                        for (var sol_cond of this.evaluate_query(stk_next, sol_next, p.condition)) {
                            if (solution_1.Solution.isValid(sol_cond)) {
                                cond_satisf = true;
                                sol_next = solution_1.Solution.fuse(sol_next, sol_cond);
                                break; //apenas a primeira true ja serve
                            }
                        }
                    }
                    if (cond_satisf == false)
                        continue; // nem testa o corpo .. proximo termo
                    if (solution_1.Solution.isValid(sol_next) == false)
                        continue;
                    for (var sol_next_inner of this.evaluate_query(stk_next, sol_next, p.value)) {
                        if (solution_1.Solution.isValid(sol_next_inner) == false)
                            continue;
                        let sol_n = new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_true(), {});
                        sol_n = solution_1.Solution.fuse(sol, sol_n); //just a copy 
                        if (this.isVar(arg1)) //arg1 eh uma variavel ? bind para o resultado 
                         {
                            let v_ret = solution_1.Solution.getValue(sol_next_inner, pa0);
                            if (util_1.isUndefined(v_ret) == false)
                                sol_n = this.bind(sol_n, v_ret, arg1);
                        }
                        if (solution_1.Solution.isValid(sol_n) == false)
                            continue;
                        if (this.isVar(arg2)) //arg1 eh uma variavel ? bind para o resultado 
                         {
                            let v_ret = solution_1.Solution.getValue(sol_next_inner, pa1);
                            if (util_1.isUndefined(v_ret) == false)
                                sol_n = this.bind(sol_n, v_ret, arg2);
                        }
                        if (solution_1.Solution.isValid(sol_n) == false)
                            continue;
                        query_satisf = true;
                        let ret = sol_n.add_value(sol_next_inner);
                        if (ret.state == solution_1.Solution.SolutionState.QCut || p.has(PredicateKind.DIRECT)) {
                            ret.state = solution_1.Solution.SolutionState.QTrue;
                            yield ret;
                            return;
                        }
                        else {
                            yield ret;
                        }
                    }
                }
            }
            if (attribSelect != PredicateKind.UNLESS)
                if (hasFound == false) {
                    this.warring("Predicate " + f_name + "/2  not found ");
                }
        }
        //AR 1 
        *query_ar1(stk, sol, f_name, _arg1) {
            let hasY = false;
            for (var s of this.query_ar1_inner(stk, sol, PredicateKind.NOMINAL, f_name, _arg1)) {
                yield s;
                if (solution_1.Solution.isValid(s))
                    hasY = true;
            }
            if (hasY == false) {
                for (var sq of this.query_ar1_inner(stk, sol, PredicateKind.UNLESS, f_name, _arg1)) {
                    yield sq;
                }
            }
            return;
        }
        *query_ar1_inner(stk, sol, attribSelect, f_name, _arg1) {
            if (attribSelect != PredicateKind.UNLESS) {
                if (f_name == "set") {
                    //let s = new Solution.Solution(Solution.SolutionState.QTrue, GTems.atom_true(), {})
                    if (_arg1 instanceof atoms_1.GTems.Functor) {
                        for (var av of this.eval_rec(stk, sol, [], _arg1.args)) {
                            let s = new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_true(), {});
                            this.setPredicate(stk, s, _arg1.name, av);
                            yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_true(), {});
                        }
                        return;
                    }
                }
                if (f_name == "set") {
                    //let s = new Solution.Solution(Solution.SolutionState.QTrue, GTems.atom_true(), {})
                    if (_arg1 instanceof atoms_1.GTems.Functor) {
                        for (var av of this.eval_rec(stk, sol, [], _arg1.args)) {
                            let s = new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_true(), {});
                            this.setPredicate(stk, s, _arg1.name, av);
                            yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_true(), {});
                        }
                        return;
                    }
                }
                if (f_name == "unset") {
                    if (_arg1 instanceof atoms_1.GTems.Functor) {
                        for (var av of this.eval_rec(stk, sol, [], _arg1.args)) {
                            let s = new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_true(), {});
                            this.unsetPredicate(stk, s, _arg1.name, av);
                            yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_true(), {});
                        }
                        return;
                    }
                }
                if (f_name == "repeat") {
                    while (true) {
                        for (var x1 of this.evaluate_query(stk, sol, _arg1)) {
                            if (solution_1.Solution.isValid(x1)) {
                                yield solution_1.Solution.fuse(sol, x1);
                            }
                            else {
                                return;
                            }
                        }
                    }
                }
                if (f_name == "not") {
                    let has_yielded = false;
                    for (var x1 of this.evaluate_query(stk, sol, _arg1)) {
                        if (solution_1.Solution.isValid(x1)) {
                            has_yielded = true;
                            if (x1.value instanceof atoms_1.GTems.LiteralBool) {
                                if (x1.value.value)
                                    yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_false(), {});
                                else
                                    yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_true(), {});
                            }
                            else {
                                yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_false(), {});
                            }
                        }
                        else {
                            has_yielded = true;
                            yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_true(), {});
                        }
                    }
                    if (has_yielded == false)
                        yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_true(), {});
                    return;
                }
            }
            for (var x1 of this.evaluate_query(stk, sol, _arg1)) {
                if (solution_1.Solution.isValid(x1)) {
                    let nsol = solution_1.Solution.fuse(sol, x1);
                    for (var z of this.query_ar1_inner_argv(stk, nsol, attribSelect, f_name, x1.value)) {
                        yield z;
                    }
                }
            }
        }
        *query_ar1_inner_argv(stk, sol, attribSelect, f_name, _arg1) {
            if (util_1.isArray(_arg1))
                _arg1 = _arg1[0];
            let arg1 = _arg1;
            let value_1 = Array.from(this.evaluate_query(stk, sol, _arg1)).filter((x) => solution_1.Solution.isValid(x)).map((c) => c.value);
            if (value_1.length > 1) {
                for (var [i, q_arg1] of value_1.entries()) {
                    for (var r_arg1 of this.query_ar1_inner(stk, sol, attribSelect, f_name, q_arg1))
                        yield r_arg1;
                }
                return;
            }
            if (value_1.length > 0)
                arg1 = value_1[0];
            else
                arg1 = atoms_1.GTems.atom_false();
            let query_satisf = false;
            if (f_name == "is_atom") {
                if (arg1 instanceof atoms_1.GTems.Atom) {
                    yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_true(), {});
                }
                else {
                    yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_false(), {});
                }
                return;
            }
            if (f_name == "is_list") {
                if (arg1 instanceof atoms_1.GTems.GList) {
                    yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_true(), {});
                }
                else {
                    yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_false(), {});
                }
                return;
            }
            if (f_name == "is_string") {
                if (arg1 instanceof atoms_1.GTems.LiteralStr) {
                    yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_true(), {});
                }
                else {
                    yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_false(), {});
                }
                return;
            }
            if (f_name == "expand") {
                if (arg1 instanceof atoms_1.GTems.LiteralStr) {
                    let rexp = this.expandString(stk, sol, arg1.value);
                    yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, new atoms_1.GTems.LiteralStr(rexp), {});
                }
                else {
                    yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_false(), {});
                }
                return;
            }
            if (f_name == "parse") {
                if (arg1 instanceof atoms_1.GTems.LiteralStr) {
                    for (var msol of this.string_parse(stk, arg1)) {
                        yield msol;
                    }
                }
                return;
            }
            if (f_name == "write") {
                if (arg1 instanceof atoms_1.GTems.LiteralStr) {
                    this.write(stk, sol, arg1.value);
                }
                else
                    this.write(stk, sol, arg1.toString());
                yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_true(), {});
                return;
            }
            let hasFound = false;
            let pnamed = this.predicades.filter(x => { return x.entry.name === f_name; }); //evita a alteracao da lista de predicados durante o set afete o loop de busca de predicados
            for (var [i, p] of pnamed.entries()) {
                // if (query_satisf) continue
                if (p.entry.name != f_name)
                    continue;
                let pp = p.entry;
                if (pp instanceof atoms_1.GTems.Functor) {
                    if (p.has(attribSelect) == false)
                        continue; //UNLESS
                    if (pp.args.length != 1)
                        continue;
                    let pa0 = pp.args[0];
                    if (util_1.isArray(pa0))
                        pa0 = pa0[0];
                    hasFound = true;
                    if (stk.contains(p.unique_name, arg1)) {
                        continue; //nao tenta de novo se ja estiver tetando dar query no mesmo predicado e nos mesmo parametros
                    }
                    let stk_next = stk.pushCall(p.unique_name, arg1);
                    //arg1 nao rh uma variavel ..bind o argumento para o valor dela ..senao,bind na saida
                    let sol_next = new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_true(), {});
                    if (this.isVar(arg1) == false) {
                        sol_next = this.bind(sol_next, pa0, arg1);
                    }
                    if (solution_1.Solution.isValid(sol_next) == false)
                        continue;
                    // testa a condicao de ativacao do predicado
                    let cond_satisf = true;
                    if (util_1.isUndefined(p.condition) == false) {
                        cond_satisf = false;
                        //testa a condicao
                        for (var sol_cond of this.evaluate_query(stk_next, sol_next, p.condition)) {
                            if (solution_1.Solution.isValid(sol_cond)) {
                                cond_satisf = true;
                                sol_next = solution_1.Solution.fuse(sol_next, sol_cond);
                                break; //apenas a primeira true ja serve
                            }
                        }
                    }
                    if (cond_satisf == false)
                        continue; // nem testa o corpo .. proximo termo
                    for (var sol_next_inner of this.evaluate_query(stk_next, sol_next, p.value)) {
                        if (solution_1.Solution.isValid(sol_next_inner) == false)
                            continue;
                        if (this.isVar(arg1) || util_1.isUndefined(arg1)) //arg1 eh uma variavel ? bind para o resultado 
                         {
                            let v_ret = solution_1.Solution.getValue(sol_next_inner, pa0);
                            if (util_1.isUndefined(v_ret) == false) {
                                let sol_n = this.bind(sol, v_ret, arg1);
                                if (solution_1.Solution.isValid(sol_n)) {
                                    sol_n.value = sol_next_inner.value;
                                    query_satisf = true;
                                    //yield sol_n
                                    let ret = sol_n;
                                    if (ret.state == solution_1.Solution.SolutionState.QCut) {
                                        ret.state = solution_1.Solution.SolutionState.QTrue;
                                        yield ret;
                                        return;
                                    }
                                    else {
                                        yield ret;
                                    }
                                }
                            }
                            else {
                                //valor do argumento continua sem binding .... mas a saida eh valida
                                query_satisf = true;
                                let ret = sol.add_value(sol_next_inner);
                                if (ret.state == solution_1.Solution.SolutionState.QCut) {
                                    ret.state = solution_1.Solution.SolutionState.QTrue;
                                    yield ret;
                                    return;
                                }
                                else {
                                    yield ret;
                                }
                                //yield sol.add_value(sol_next_inner.value)
                            }
                        }
                        else {
                            query_satisf = true;
                            let ret = sol.add_value(sol_next_inner);
                            if (ret.state == solution_1.Solution.SolutionState.QCut || p.has(PredicateKind.DIRECT)) {
                                ret.state = solution_1.Solution.SolutionState.QTrue;
                                yield ret;
                                return;
                            }
                            else {
                                yield ret;
                            }
                            //yield sol.add_value(sol_next_inner.value)
                        }
                    }
                }
            }
            //yield new Solution.Solution(Solution.SolutionState.QFalse, GTems.atom_false(), {})
            if (attribSelect != PredicateKind.UNLESS)
                if (hasFound == false) {
                    this.warring("Predicate " + f_name + "/1  not found ");
                }
        }
        write(stk, sol, arg0) {
            let msg = this.expandString(stk, sol, arg0);
            this.writebuffer = this.writebuffer + msg;
        }
        warring(arg0) {
            this.warringbuffer.push(arg0);
        }
        *query_ar0(stk, sol, f_name) {
            let hasY = false;
            for (var s of this.query_ar0_inner(stk, sol, PredicateKind.NOMINAL, f_name)) {
                yield s;
                if (solution_1.Solution.isValid(s))
                    hasY = true;
            }
            if (hasY == false) {
                for (var sq of this.query_ar0_inner(stk, sol, PredicateKind.UNLESS, f_name)) {
                    yield sq;
                }
            }
            return;
        }
        *query_ar0_inner(stk, sol, attribSelect, f_name) {
            for (var z of this.query_ar0_inner_argv(stk, sol, attribSelect, f_name))
                yield z;
        }
        *query_ar0_inner_argv(stk, sol, attribSelect, f_name) {
            let query_satisf = false;
            if (f_name == "write") {
                this.write(stk, sol, ".");
                yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_true(), {});
                return;
            }
            let hasFound = false;
            let pnamed = this.predicades.filter(x => { return x.entry.name === f_name; }); //evita a alteracao da lista de predicados durante o set afete o loop de busca de predicados
            for (var [i, p] of pnamed.entries()) {
                // if (query_satisf) continue
                if (p.entry.name != f_name)
                    continue;
                let pp = p.entry;
                if (pp instanceof atoms_1.GTems.Functor) {
                    if (p.has(attribSelect) == false)
                        continue; //UNLESS
                    if (pp.args.length != 0)
                        continue;
                    let pa0 = pp.args[0];
                    if (util_1.isArray(pa0))
                        pa0 = pa0[0];
                    hasFound = true;
                    if (stk.contains(p.unique_name)) {
                        continue; //nao tenta de novo se ja estiver tetando dar query no mesmo predicado e nos mesmo parametros
                    }
                    let stk_next = stk.pushCall(p.unique_name);
                    let sol_next = sol;
                    // testa a condicao de ativacao do predicado
                    let cond_satisf = true;
                    if (util_1.isUndefined(p.condition) == false) {
                        cond_satisf = false;
                        //testa a condicao
                        for (var sol_cond of this.evaluate_query(stk_next, sol_next, p.condition)) {
                            if (solution_1.Solution.isValid(sol_cond)) {
                                cond_satisf = true;
                                sol_next = solution_1.Solution.fuse(sol_next, sol_cond);
                                break; //apenas a primeira true ja serve
                            }
                        }
                    }
                    if (cond_satisf == false)
                        continue; // nem testa o corpo .. proximo termo
                    for (var sol_next_inner of this.evaluate_query(stk_next, sol_next, p.value)) {
                        if (solution_1.Solution.isValid(sol_next_inner) == false)
                            continue;
                        query_satisf = true;
                        let ret = sol.add_value(sol_next_inner);
                        if (ret.state == solution_1.Solution.SolutionState.QCut || p.has(PredicateKind.DIRECT)) {
                            ret.state = solution_1.Solution.SolutionState.QTrue;
                            yield ret;
                            return;
                        }
                        else {
                            yield ret;
                        }
                    }
                }
            }
            //yield new Solution.Solution(Solution.SolutionState.QFalse, GTems.atom_false(), {})
            if (attribSelect != PredicateKind.UNLESS)
                if (hasFound == false) {
                    this.warring("Predicate " + f_name + "/1  not found ");
                }
        }
    } //class
    Interp.Context = Context;
})(Interp = exports.Interp || (exports.Interp = {})); //namespace
//# sourceMappingURL=interp.js.map