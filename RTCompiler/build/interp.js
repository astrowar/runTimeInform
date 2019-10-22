"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const atoms_1 = require("./atoms");
const solution_1 = require("./solution");
const util_1 = require("util");
const parse_1 = require("./parse");
const querystack_1 = require("./querystack");
const buildin_1 = require("./buildin");
var QueryStack = querystack_1.QueryStack.QueryStack;
//import Atom = GTems.Atom;
//import GList = GTems.GList;
//import Variable = GTems.Variable;
var Interp;
(function (Interp) {
    function findEndAtom(x, i) {
        let n = x.length;
        while (i < n) {
            if (x[i] == " ")
                return i;
            if (";.,()[]|&\n\r".indexOf(x[i]) > -1) {
                return i;
            }
            if ("\\".indexOf(x[i]) > -1) {
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
        PredicateKind[PredicateKind["DYNAMIC"] = 5] = "DYNAMIC";
        PredicateKind[PredicateKind["STATIC"] = 6] = "STATIC";
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
            if (x == PredicateKind.STATIC)
                this.swap_attr(PredicateKind.DYNAMIC, PredicateKind.STATIC);
            if (x == PredicateKind.DYNAMIC)
                this.swap_attr(PredicateKind.STATIC, PredicateKind.DYNAMIC);
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
    ;
    class Context {
        constructor() {
            //predicades: GTems.Functor[] = []
            this.values = [];
            this.predicades = {};
            this.understands = [];
            this.cons_atoms = [];
            this.init_entries = [];
            this.predicades_id = 1;
            this.writebuffer = "";
            this.warringbuffer = [];
            //variaveis globais
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
        init_pred() {
            //let n = this.init_entries.length
            let sol = new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_true(), {});
            let stk = new QueryStack();
            for (var e of this.query_ar0(stk, sol, "init")) { }
        }
        init() {
            this.init_const();
            this.init_var();
            this.init_pred();
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
                if (opt == "lowP")
                    p_priority = p_priority - 10000;
                if (opt == "highP")
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
            pred_actual.set(PredicateKind.STATIC);
            if (pred_actual.entry.name == "init") {
                //this.init_entries.push(pred_actual )
                //this.init_entries = this.init_entries.sort((a, b) => { return predicateEntryOrder(a, b) })
                //return true;
            }
            if (util_1.isUndefined(this.predicades[pred_actual.entry.name]))
                this.predicades[pred_actual.entry.name] = [];
            this.predicades[pred_actual.entry.name].unshift(pred_actual);
            this.predicades[pred_actual.entry.name] = this.predicades[pred_actual.entry.name].sort((a, b) => { return predicateEntryOrder(a, b); });
            return true;
        }
        addUnderstandFunc(pmatch, code, condition, p_options) {
            this.predicades_id++;
            let p_priority = 0;
            for (var [i, opt] of p_options.entries()) {
                if (opt == "lowP")
                    p_priority = p_priority - 10000;
                if (opt == "highP")
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
            pred_actual.set(PredicateKind.STATIC);
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
            if (util_1.isUndefined(this.predicades[f_name]))
                return false;
            for (var [i, p] of this.predicades[f_name].entries()) {
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
            pred_actual.set(PredicateKind.DYNAMIC);
            pred_actual.set(PredicateKind.NONDIRECT);
            if (util_1.isUndefined(this.predicades[f_name]))
                this.predicades[f_name] = [];
            this.predicades[f_name].unshift(pred_actual);
            this.predicades[f_name] = this.predicades[f_name].sort((a, b) => { return predicateEntryOrder(a, b); });
        }
        unsetPredicate(stk, s, f_name, av) {
            let p_remove = [];
            if (util_1.isUndefined(this.predicades[f_name]))
                return;
            for (var [i, p] of this.predicades[f_name].entries()) {
                if (p.entry instanceof atoms_1.GTems.Functor) {
                    if (p.entry.name == f_name)
                        if (p.has(PredicateKind.STATIC))
                            continue; //nao apaga predicados estaticos
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
                this.predicades[f_name] = this.predicades[f_name].filter(el => { return el.unique_name !== u; });
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
        expandVar(stk, sol, varname) {
            let vx = sol.var_values[varname];
            if (util_1.isUndefined(vx)) {
                for (var [vi, ve] of this.var_atoms.entries()) {
                    if (ve.unique_name == varname) {
                        return ve.value;
                    }
                }
                return undefined;
            }
            return vx;
        }
        expandExpr(stk, sol, vcontetns, nlevel = 0) {
            if (vcontetns instanceof atoms_1.GTems.LiteralStr)
                return vcontetns.value;
            if (nlevel > 5)
                return vcontetns.toString();
            let buffer = "";
            if (vcontetns instanceof atoms_1.GTems.Variable) {
                let vv = this.expandVar(stk, sol, vcontetns.name);
                if (util_1.isUndefined(vv))
                    return "$" + vcontetns.name;
                return this.expandExpr(stk, sol, vv, nlevel + 1);
            }
            for (var qrep of this.query_ar1(stk, sol, "repr", vcontetns)) {
                if (qrep instanceof solution_1.Solution.Solution) {
                    if (solution_1.Solution.isValid(qrep)) {
                        return this.expandExpr(stk, sol, qrep.value, nlevel + 1);
                    }
                }
            }
            if (vcontetns instanceof atoms_1.GTems.GList) {
                let xrep = vcontetns.items.map((element) => {
                    return this.expandExpr(stk, sol, element, nlevel + 1);
                });
                return xrep.join(", ");
            }
            return vcontetns.toString();
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
                    let local_var = new atoms_1.GTems.Variable(varname);
                    let vx = this.expandExpr(stk, sol, local_var);
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
                    buffer += this.expandExpr(stk, sol, vcontetns);
                    // for (var qrep of this.query_ar1(stk, sol, "repr", vcontetns)) {
                    //     if (qrep instanceof Solution.Solution) {
                    //         if (Solution.isValid(qrep)) {
                    //             if (qrep.value instanceof GTems.GList){ 
                    //             }                                
                    //             else { 
                    //                  buffer += qrep.value.toString()
                    //             }
                    //             break
                    //         }
                    //     }
                    // }
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
                        if (qz.state == solution_1.Solution.SolutionState.QFail) {
                            yield qz;
                            return;
                        }
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
            this.warringbuffer = [];
            let mwriteP = this.writebuffer.replace(new RegExp("\\\\n", 'g'), "\r\n");
            //process.stdout.write(mwriteP)   
            console.log(mwriteP);
            this.writebuffer = "";
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
                if (q.expanded == false) {
                    let sxValue = this.expandString(stk, sol, q.value);
                    let r = new atoms_1.GTems.LiteralStr(sxValue, true);
                    yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, r, {});
                }
                else {
                    yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, q, {});
                }
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
                if (code.name == "discard") {
                    stk.discardStack.push(new querystack_1.QueryStack.DiscardItem(stk.callStack[stk.callStack.length - 1].unique_name));
                    yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, new atoms_1.GTems.LiteralBool(true), {});
                    return;
                }
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
                if (fsol.state == solution_1.Solution.SolutionState.QFail) {
                    yield fsol;
                    return;
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
            if (attribSelect == PredicateKind.NOMINAL) {
                if (f_name == "if_else") {
                    let has_query = false;
                    for (var sol_if of this.query(stk, sol, _arg1)) {
                        if (sol_if instanceof solution_1.Solution.Solution) {
                            has_query = true;
                            if (solution_1.Solution.isTrue(sol_if)) {
                                sol_if = solution_1.Solution.fuse(sol, sol_if); //nao tem muita diferenca entre a ordem
                                for (var sol_then of this.query(stk, sol_if, _arg2)) {
                                    yield sol_then;
                                }
                            }
                            else {
                                for (var sol_else of this.query(stk, sol, _arg3)) {
                                    yield sol_else;
                                }
                            }
                        }
                    }
                    if (has_query == false) {
                        for (var sol_else of this.query(stk, sol, _arg3)) {
                            yield sol_else;
                        }
                    }
                    return;
                }
            }
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
            if (f_name == "apply") {
                if (_arg1 instanceof atoms_1.GTems.Atom) {
                    let f = new atoms_1.GTems.Functor(_arg1.name, _arg2, _arg3);
                    for (var r of this.evaluate_query(stk, sol, f)) {
                        yield r;
                    }
                }
                return;
            }
            if (f_name == "append") {
                for (var ssk of buildin_1.BuildIns.buildIn_append(this, stk, sol, arg1, arg2, arg3))
                    yield ssk;
                return;
            }
            if (f_name == "HT") {
                for (var ssk of buildin_1.BuildIns.buildIn_ht(this, stk, sol, arg1, arg2, arg3))
                    yield ssk;
                return;
            }
            if (f_name == "nextto") {
                for (var ssn of buildin_1.BuildIns.buildIn_nextto(this, stk, sol, arg1, arg2, arg3))
                    yield ssn;
                return;
            }
            if (true) {
                for (var r of this.query_n_argv(stk, sol, attribSelect, f_name, [arg1, arg2, arg3])) {
                    yield r;
                }
            }
        }
        *query_n_argv(stk, sol, attribSelect, f_name, _arg) {
            let hasFound = false;
            let N = _arg.length;
            if (f_name in this.predicades) {
                let pnamed = this.predicades[f_name].filter(x => x.entry.name == f_name);
                for (var [i, p] of pnamed.entries()) {
                    // if (query_satisf)  continue
                    if (stk.contains_discard(p.unique_name))
                        continue;
                    if (p.entry.name != f_name)
                        continue;
                    let pp = p.entry;
                    if (pp instanceof atoms_1.GTems.Functor) {
                        if (p.has(attribSelect) == false)
                            continue; //UNLESS
                        hasFound = true;
                        if (pp.args.length != N)
                            continue;
                        let pa = [];
                        for (var k = 0; k < N; k++) {
                            if (util_1.isArray(pp.args[k]))
                                pa.push(pp.args[k][0]);
                            else {
                                pa.push(pp.args[k]);
                            }
                        }
                        //if (stk.contains(p.unique_name, ..._arg)) continue //nao tenta de novo se ja estiver tetando dar query no mesmo predicado e nos mesmo parametros
                        let stk_next = stk.pushCall(p.unique_name, ..._arg);
                        //arg1 nao rh uma variavel ..bind o argumento para o valor dela ..senao,bind na saida
                        let sol_next = new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_true(), {});
                        for (var k = 0; k < N; k++) {
                            if (this.isVar(_arg[k]) == false) {
                                sol_next = this.bind(sol_next, pa[k], _arg[k]);
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
                            if (sol_next_inner.state == solution_1.Solution.SolutionState.QFail) {
                                yield sol_next_inner;
                                return;
                            }
                            if (solution_1.Solution.isValid(sol_next_inner) == false)
                                continue;
                            sol_next_inner = solution_1.Solution.fuse(sol_next, sol_next_inner);
                            let sol_n = new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_true(), {});
                            sol_n = solution_1.Solution.fuse(sol, sol_n); //just a copy                         
                            for (var k = 0; k < N; k++) {
                                if (this.isVar(_arg[k])) //arg1 eh uma variavel ? bind para o resultado 
                                 {
                                    let v_ret = solution_1.Solution.getValue(sol_next_inner, pa[k]);
                                    if (util_1.isUndefined(v_ret) == false)
                                        sol_n = this.bind(sol_n, v_ret, _arg[k]);
                                    if (solution_1.Solution.isValid(sol_n) == false)
                                        continue;
                                }
                            }
                            if (solution_1.Solution.isValid(sol_n) == false)
                                continue;
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
            }
            if (attribSelect != PredicateKind.UNLESS)
                if (hasFound == false) {
                    if ((f_name == "write") || (f_name == "repr")) {
                    }
                    else {
                        this.warring("Predicate " + f_name + "/" + N.toString() + "  not found ");
                    }
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
            if (attribSelect == PredicateKind.NOMINAL) {
                if (f_name == "set") {
                    let _predName = undefined;
                    if (_arg1 instanceof atoms_1.GTems.Atom)
                        _predName = _arg1.name;
                    if (_arg1 instanceof atoms_1.GTems.Variable) {
                        for (var var1 of this.evaluate_query(stk, sol, _arg1)) {
                            if (solution_1.Solution.isValid(var1))
                                if (var1.value instanceof atoms_1.GTems.Atom) {
                                    _predName = var1.value.name;
                                    break;
                                }
                        }
                    }
                    if ((util_1.isUndefined(_predName) == false) && _arg2 instanceof atoms_1.GTems.GList) {
                        for (var av of this.eval_rec(stk, sol, [], _arg2.items)) {
                            let s = new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_true(), {});
                            this.setPredicate(stk, s, _predName, av);
                            yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_true(), {});
                        }
                        return;
                    }
                }
                if (f_name == "unset") {
                    let _predName = undefined;
                    if (_arg1 instanceof atoms_1.GTems.Atom)
                        _predName = _arg1.name;
                    if (_arg1 instanceof atoms_1.GTems.Variable) {
                        for (var var1 of this.evaluate_query(stk, sol, _arg1)) {
                            if (solution_1.Solution.isValid(var1))
                                if (var1.value instanceof atoms_1.GTems.Atom) {
                                    _predName = var1.value.name;
                                    break;
                                }
                        }
                    }
                    if ((util_1.isUndefined(_predName) == false) && _arg2 instanceof atoms_1.GTems.GList) {
                        for (var av of this.eval_rec(stk, sol, [], _arg2.items)) {
                            let s = new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_true(), {});
                            this.unsetPredicate(stk, s, _predName, av);
                            yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_true(), {});
                        }
                        return;
                    }
                }
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
            if (f_name == "apply") {
                if (_arg1 instanceof atoms_1.GTems.Atom) {
                    let f = new atoms_1.GTems.Functor(_arg1.name, _arg2);
                    for (var r of this.evaluate_query(stk, sol, f)) {
                        yield r;
                    }
                }
                return;
            }
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
                for (var qqm of buildin_1.BuildIns.buildIn_member(this, stk, sol, arg1, arg2)) {
                    yield qqm;
                }
                return;
            }
            if (f_name == "random_member") {
                for (var qqm of buildin_1.BuildIns.buildIn_random_member(this, stk, sol, arg1, arg2)) {
                    yield qqm;
                }
                return;
            }
            if (f_name == "atom_string") {
                for (var qqm of buildin_1.BuildIns.buildIn_atom_string(this, stk, sol, arg1, arg2)) {
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
                for (var ssk of buildin_1.BuildIns.buildIn_add(this, stk, sol, arg1, arg2))
                    yield ssk;
                //yield BuildIns.buildIn_add(stk,sol, arg1, arg2)
                return;
            }
            if (f_name == "minus") {
                for (var ss8 of buildin_1.BuildIns.buildIn_minus(this, stk, sol, arg1, arg2))
                    yield ss8;
                //yield BuildIns.buildIn_minus(stk,sol, arg1, arg2)
                return;
            }
            if (f_name == "div") {
                for (var ss81 of buildin_1.BuildIns.buildIn_div(this, stk, sol, arg1, arg2))
                    yield ss81;
                return;
            }
            if (f_name == "mod") {
                for (var ss82 of buildin_1.BuildIns.buildIn_mod(this, stk, sol, arg1, arg2))
                    yield ss82;
                return;
            }
            if (f_name == "GREATER") {
                //yield BuildIns.buildIn_gt(stk,sol, arg1, arg2)
                for (var ss7 of buildin_1.BuildIns.buildIn_gt(this, stk, sol, arg1, arg2))
                    yield ss7;
                return;
            }
            if (f_name == "LESS") {
                //yield BuildIns.buildIn_lt(stk,sol, arg1, arg2)
                for (var ss5 of buildin_1.BuildIns.buildIn_lt(this, stk, sol, arg1, arg2))
                    yield ss5;
                return;
            }
            if (f_name == "GREATEREQUAL") {
                //yield BuildIns.buildIn_gt(stk,sol, arg1, arg2)
                for (var ss71 of buildin_1.BuildIns.buildIn_gte(this, stk, sol, arg1, arg2))
                    yield ss71;
                return;
            }
            if (f_name == "LESSEQUAL") {
                //yield BuildIns.buildIn_lt(stk,sol, arg1, arg2)
                for (var ss22 of buildin_1.BuildIns.buildIn_lte(this, stk, sol, arg1, arg2))
                    yield ss22;
                return;
            }
            if (f_name == "*") {
                // yield BuildIns.buildIn_mul(stk,sol, arg1, arg2)
                for (var ss4 of buildin_1.BuildIns.buildIn_mul(this, stk, sol, arg1, arg2)) {
                    yield ss4;
                }
                return;
            }
            if (f_name == "head") {
                // yield BuildIns.buildIn_head(stk,sol, arg1, arg2)
                for (var ss2 of buildin_1.BuildIns.buildIn_head(this, stk, sol, arg1, arg2))
                    yield ss2;
                return;
            }
            if (f_name == "tail") {
                //yield BuildIns.buildIn_tail(stk,sol, arg1, arg2)
                for (var ss2 of buildin_1.BuildIns.buildIn_tail(this, stk, sol, arg1, arg2))
                    yield ss2;
                return;
            }
            if (f_name == "maplist") {
                //yield BuildIns.buildIn_tail(stk,sol, arg1, arg2)
                for (var ssm of buildin_1.BuildIns.buildIn_maplist(this, stk, sol, arg1, arg2))
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
            if (true) {
                for (var r of this.query_n_argv(stk, sol, attribSelect, f_name, [arg1, arg2])) {
                    yield r;
                }
            }
        }
        //AR 1 
        *query_ar1(stk, sol, f_name, _arg1) {
            let hasY = false;
            for (var s of this.query_ar1_inner(stk, sol, PredicateKind.NOMINAL, f_name, _arg1)) {
                yield s;
                hasY = true;
                //if (Solution.isValid(s))
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
                if (f_name == "once") {
                    for (var x1 of this.evaluate_query(stk, sol, _arg1)) {
                        if (solution_1.Solution.isTrue(x1)) {
                            yield solution_1.Solution.fuse(sol, x1);
                            break;
                        }
                    }
                    return;
                }
                if (f_name == "last") {
                    let last = undefined;
                    for (var x1 of this.evaluate_query(stk, sol, _arg1)) {
                        if (solution_1.Solution.isTrue(x1)) {
                            last = solution_1.Solution.fuse(sol, x1);
                        }
                    }
                    if (util_1.isUndefined(last) == false) {
                        yield last;
                    }
                    return;
                }
                if (f_name == "repeat") {
                    while (true) {
                        let hasQuery = false;
                        for (var x1 of this.evaluate_query(stk, sol, _arg1)) {
                            hasQuery = true;
                            if (solution_1.Solution.isTrue(x1)) {
                                yield solution_1.Solution.fuse(sol, x1);
                            }
                            else {
                                return;
                            }
                        }
                        if (hasQuery == false) {
                            //yield new Solution.Solution(Solution.SolutionState.QFalse, GTems.atom_false(), {})
                            return;
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
                    if (has_yielded == false) {
                        yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_true(), {});
                    }
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
            for (var r of this.query_n_argv(stk, sol, attribSelect, f_name, [arg1])) {
                yield r;
            }
            if (f_name == "write") {
                if (arg1 instanceof atoms_1.GTems.LiteralStr) {
                    this.write(stk, sol, arg1.value);
                }
                else {
                    this.write(stk, sol, arg1.toString());
                }
                yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_true(), {});
                return;
            }
            if (attribSelect != PredicateKind.UNLESS) {
                if (f_name === "repr") { }
                else {
                    this.warring("Predicate " + f_name + "/1  not found ");
                }
            }
        }
        write(stk, sol, arg0) {
            this.writebuffer = this.writebuffer + arg0;
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
            for (var r of this.query_n_argv(stk, sol, attribSelect, f_name, [])) {
                yield r;
            }
        }
    } //class
    Interp.Context = Context;
})(Interp = exports.Interp || (exports.Interp = {})); //namespace
//# sourceMappingURL=interp.js.map