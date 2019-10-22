


import { GTems } from "./atoms";
import { Solution } from "./solution";
import { isUndefined, isArray, isObject } from "util";
import { MParse } from "./parse";
import { QueryStack as QS } from "./querystack";
import { BuildIns } from "./buildin";
import { ContextBase } from "./contextBase";

import QueryStack = QS.QueryStack;

//import Atom = GTems.Atom;
//import GList = GTems.GList;
//import Variable = GTems.Variable;


export namespace Interp {
    function findEndAtom(x: string, i: number) {
        let n = x.length
        while (i < n) {
            if (x[i] == " ") return i
            if (";.,()[]|&\n\r".indexOf(x[i]) > -1) { return i }
            if ("\\".indexOf(x[i]) > -1) { return i }
            i = i + 1
        }
        return i;
    }

    function findEndBraket(x: string, i: number) {
        let n = x.length
        let lv = 0
        while (i < n) {
            if (x[i] == "[") { lv = lv + 1 }
            if (x[i] == "]") { lv = lv - 1 }
            if (lv == 0) return i
            i = i + 1
        }
        return i;
    }



    //normal ... sem flag de selecao
    //norminal <-> unless  senao eh um é outro 
    //direct <-> NONDIRECT   nao direto significa que cada resposta gera um novo node de respostas.. direct , se um tiver sucesso..encerra a query

    enum PredicateKind {
        NORMAL = 0,
        NOMINAL,
        UNLESS,

        NONDIRECT,
        DIRECT,

        DYNAMIC, STATIC
    }

    class BaseEntry {

        private swap_attr(a_old: PredicateKind, a_new: PredicateKind) {

            let index = this.attributes.indexOf(a_old); if (index > -1) { this.attributes.splice(index, 1); }
            this.attributes.push(a_new)

        }

        public has(x: PredicateKind): boolean {
            if (this.attributes.indexOf(x) == -1) return false;
            return true
        }

        public set(x: PredicateKind) {
            if (x == PredicateKind.NOMINAL) this.swap_attr(PredicateKind.NOMINAL, PredicateKind.UNLESS);
            if (x == PredicateKind.UNLESS) this.swap_attr(PredicateKind.NOMINAL, PredicateKind.UNLESS);

            if (x == PredicateKind.NONDIRECT) this.swap_attr(PredicateKind.DIRECT, PredicateKind.NONDIRECT);
            if (x == PredicateKind.DIRECT) this.swap_attr(PredicateKind.NONDIRECT, PredicateKind.DIRECT);

            if (x == PredicateKind.STATIC) this.swap_attr(PredicateKind.DYNAMIC, PredicateKind.STATIC);
            if (x == PredicateKind.DYNAMIC) this.swap_attr(PredicateKind.STATIC, PredicateKind.DYNAMIC);

        }


        private attributes: PredicateKind[] = [PredicateKind.NOMINAL, PredicateKind.NONDIRECT]
        constructor(public unique_name: string, public value: GTems.GBase, public condition: GTems.GBase, public prior: number) {
        }
    }


    class UnderstandEntry extends BaseEntry {
        constructor(public unique_name: string, public patternMatching: GTems.LiteralStr, public value: GTems.GBase, public condition: GTems.GBase, public prior: number) {
            super(unique_name, value, condition, prior)
            if ((patternMatching instanceof GTems.LiteralStr) == false) throw new Error("entry type is invalid")
        }
    }
    class ConstEntry extends BaseEntry {
        constructor(public unique_name: string, public value: GTems.GBase) {
            super(unique_name, value, undefined, 0)
        }
    }

    class VarEntry extends BaseEntry {
        constructor(public unique_name: string, public value: GTems.GBase) {
            super(unique_name, value, undefined, 0)
        }
    }



    class PredicateEntry extends BaseEntry {
        public complexity: number;
        constructor(public unique_name: string, public entry: GTems.Functor | GTems.Atom, public value: GTems.GBase, public condition: GTems.GBase, public prior: number) {
            super(unique_name, value, condition, prior)
            if ((entry instanceof GTems.Functor) == false && (entry instanceof GTems.Atom) == false) throw new Error("entry type is invalid")

        }
    }



    function getComplexityTerm(p: GTems.GBase): number {


        if (p instanceof GTems.Atom) return 10
        if (p instanceof GTems.Variable) return 0
        if (p instanceof GTems.GList) return 40
        if (p instanceof GTems.GValue) return 10
        if (p instanceof GTems.Functor) return 10 + getComplexity(p)
        return 5
    }

    function getComplexity(p: GTems.Functor | GTems.Atom): number {

        if (p instanceof GTems.Atom) {
            return 10
        }
        if (p instanceof GTems.Functor) {
            let prs = p.args.map(getComplexityTerm)
            var total = prs.reduce(function (a, b) { return a * b; }, 1);
            return total

        }
        return 0
    }

    // 1 -> a < b 
    function predicateEntryOrder(a: PredicateEntry, b: PredicateEntry): number {
        let prior_A = -1
        let prior_B = 1

        if (a.entry.name > b.entry.name) return prior_A
        if (a.entry.name < b.entry.name) return prior_B

        if (a.prior > b.prior) return prior_A
        if (a.prior < b.prior) return prior_B


        if (isUndefined(a.condition) == false && isUndefined(b.condition)) return prior_A
        if (isUndefined(b.condition) == false && isUndefined(a.condition)) return prior_B

        if (a.complexity < 0) a.complexity = getComplexity(a.entry)
        if (b.complexity < 0) b.complexity = getComplexity(a.entry)

        let cp_a = (a.complexity)
        let cp_b = (b.complexity)

        if (cp_a > cp_b) return prior_A
        if (cp_b > cp_a) return prior_B

        if (isUndefined(a.condition) == false && isUndefined(b.condition) == false) {
            let cd_a = getComplexityTerm(a.condition)
            let cd_b = getComplexityTerm(b.condition)
            if (cd_a > cd_b) return prior_A
            if (cd_b > cd_a) return prior_B
        }

        return 0
    }


    function understandEntryOrder(a: UnderstandEntry, b: UnderstandEntry): number {
        let prior_A = -1
        let prior_B = 1
        if (a.prior > b.prior) return prior_A
        if (a.prior < b.prior) return prior_B

        if (isUndefined(a.condition) == false && isUndefined(b.condition)) return prior_A
        if (isUndefined(b.condition) == false && isUndefined(a.condition)) return prior_B
        let cp_a = (a.patternMatching).value.length
        let cp_b = (b.patternMatching).value.length
        if (cp_a > cp_b) return prior_A
        if (cp_b > cp_a) return prior_B

        if (isUndefined(a.condition) == false && isUndefined(b.condition) == false) {


            let cd_a = getComplexityTerm(a.condition)
            let cd_b = getComplexityTerm(b.condition)
            if (cd_a > cd_b) return prior_A
            if (cd_b > cd_a) return prior_B
        }

        return 0
    }



    interface IHashPred {
        [name: string]: PredicateEntry[]
    };

    export class Context implements ContextBase {


        init_const() {
            let n = this.cons_atoms.length
            for (var i = 0; i < n; i++) {
                let sol = new Solution.Solution(Solution.SolutionState.QTrue, GTems.atom_true(), {})
                let stk: QueryStack = new QueryStack()
                let computed = this.cons_atoms[i].value
                for (var e of this.evaluate_query(stk, sol, this.cons_atoms[i].value)) {
                    if (Solution.isValid(e)) {
                        computed = e.value;
                        break
                    }
                }
                this.cons_atoms[i].value = computed
            }
        }

        init_var() {
            let n = this.var_atoms.length
            for (var i = 0; i < n; i++) {
                let sol = new Solution.Solution(Solution.SolutionState.QTrue, GTems.atom_true(), {})
                let stk: QueryStack = new QueryStack()
                let computed = this.var_atoms[i].value
                for (var e of this.evaluate_query(stk, sol, this.var_atoms[i].value)) {
                    if (Solution.isValid(e)) {
                        computed = e.value;
                        break
                    }
                }
                this.var_atoms[i].value = computed
            }
        }

        init_pred() {
            //let n = this.init_entries.length
            let sol = new Solution.Solution(Solution.SolutionState.QTrue, GTems.atom_true(), {})
            let stk: QueryStack = new QueryStack()
            for (var e of this.query_ar0(stk, sol, "init")) { }


        }

        init() {
            this.init_const()
            this.init_var()
            this.init_pred()

        }
        //predicades: GTems.Functor[] = []
        values: GTems.Atom[] = []

        predicades: IHashPred = {}
        understands: UnderstandEntry[] = []
        cons_atoms: ConstEntry[] = []
        init_entries: PredicateEntry[] = [];
        predicades_id: number = 1
        writebuffer: string = "";
        warringbuffer: string[] = [];

        //variaveis globais
        var_atoms: VarEntry[] = []


        public addPredicateFunc(p: GTems.Functor | GTems.LiteralStr | GTems.Variable, code: any, condition: any, p_options: [any]): boolean {



            if (p instanceof GTems.LiteralStr) return this.addUnderstandFunc(p, code, condition, p_options)
            if (p instanceof GTems.Variable) return this.addVarFunc(p, code, condition, p_options)

            this.predicades_id++;
            let p_priority: number = 0;

            for (var [i, opt] of p_options.entries()) {


                if (opt == "const") return this.addConstFunc(p, code, condition, p_options)
                //if (opt == "var")   return this.addVarFunc( p,code ,condition, p_options)
            }


            for (var [i, opt] of p_options.entries()) {
                if (opt == "lowP") p_priority = p_priority - 10000;
                if (opt == "highP") p_priority = p_priority + 10000;
            }

            let unique_name = p.name + this.predicades_id.toString()
            let pred_actual = new PredicateEntry(unique_name, p, code, condition, p_priority + this.predicades_id)

            for (var [i, opt] of p_options.entries()) {
                if (opt == "unless") pred_actual.set(PredicateKind.UNLESS);
                if (opt == "direct") pred_actual.set(PredicateKind.DIRECT);
            }

            pred_actual.set(PredicateKind.STATIC);

            if (pred_actual.entry.name == "init") {
                //this.init_entries.push(pred_actual )
                //this.init_entries = this.init_entries.sort((a, b) => { return predicateEntryOrder(a, b) })
                //return true;
            }
            if (isUndefined(this.predicades[pred_actual.entry.name])) this.predicades[pred_actual.entry.name] = []
            this.predicades[pred_actual.entry.name].unshift(pred_actual)
            this.predicades[pred_actual.entry.name] = this.predicades[pred_actual.entry.name].sort((a, b) => { return predicateEntryOrder(a, b) })
            return true
        }

        public addUnderstandFunc(pmatch: GTems.LiteralStr, code: any, condition: any, p_options: [any]): boolean {

            this.predicades_id++;
            let p_priority: number = 0;

            for (var [i, opt] of p_options.entries()) {
                if (opt == "lowP") p_priority = p_priority - 10000;
                if (opt == "highP") p_priority = p_priority + 10000;
            }

            let unique_name = "understand" + this.predicades_id.toString()
            let pred_actual = new UnderstandEntry(unique_name, pmatch, code, condition, p_priority + this.predicades_id)

            for (var [i, opt] of p_options.entries()) {
                if (opt == "unless") pred_actual.set(PredicateKind.UNLESS);
                if (opt == "direct") pred_actual.set(PredicateKind.DIRECT);
            }

            pred_actual.set(PredicateKind.STATIC);

            this.understands.unshift(pred_actual)
            this.understands = this.understands.sort((a, b) => { return understandEntryOrder(a, b) })
            return true
        }



        public addVarFunc(cname: GTems.Variable, code: any, condition: any, p_options: [any]): boolean {
            let var_entry = new VarEntry(cname.name, code)
            this.var_atoms.unshift(var_entry)
            return true
        }

        public addConstFunc(cname: GTems.Functor, code: any, condition: any, p_options: [any]): boolean {
            let const_entry = new ConstEntry(cname.name, code)
            this.cons_atoms.unshift(const_entry)
            return true
        }


        existPredicate(stk: QueryStack, s: Solution.Solution, f_name: string, av: GTems.GBase[]) {
            if (isUndefined(this.predicades[f_name])) return false
            for (var [i, p] of this.predicades[f_name].entries()) {
                if (p.entry instanceof GTems.Functor) {
                    if (p.entry.name == f_name)
                        if (av.length != p.entry.args.length) continue
                    let n = av.length
                    let allBind = true
                    for (var j = 0; j < n; j++) {
                        if (p.entry.args[j] instanceof GTems.Variable) { allBind = false; break }
                        let b = Solution.bind(s, p.entry.args[j], av[j]);
                        if (Solution.isValid(b) == false) { allBind = false; break }
                    }
                    if (allBind) {
                        return true
                    }
                }
            }
            return false

        }

        setPredicate(stk: QueryStack, s: Solution.Solution, f_name: string, av: GTems.GBase[]) {
            if (this.existPredicate(stk, s, f_name, av)) return

            this.predicades_id++;
            let unique_name = f_name + this.predicades_id.toString()
            let p = new GTems.Functor(f_name, ...av)
            let pred_actual = new PredicateEntry(unique_name, p, GTems.atom_true(), undefined, 0 + this.predicades_id)

            pred_actual.set(PredicateKind.DYNAMIC);
            pred_actual.set(PredicateKind.NONDIRECT);
            if (isUndefined(this.predicades[f_name])) this.predicades[f_name] = []
            this.predicades[f_name].unshift(pred_actual)
            this.predicades[f_name] = this.predicades[f_name].sort((a, b) => { return predicateEntryOrder(a, b) })
        }

        unsetPredicate(stk: QueryStack, s: Solution.Solution, f_name: string, av: GTems.GBase[]) {
            let p_remove = []
            if (isUndefined(this.predicades[f_name])) return
            for (var [i, p] of this.predicades[f_name].entries()) {
                if (p.entry instanceof GTems.Functor) {
                    if (p.entry.name == f_name)
                        if (p.has(PredicateKind.STATIC)) continue //nao apaga predicados estaticos
                    if (av.length != p.entry.args.length) continue
                    let n = av.length
                    let allBind = true
                    for (var j = 0; j < n; j++) {
                        if (p.entry.args[j] instanceof GTems.Variable) { allBind = false; break }
                        let b = Solution.bind(s, p.entry.args[j], av[j]);
                        if (Solution.isValid(b) == false) { allBind = false; break }
                    }
                    if (allBind) {
                        p_remove.push(p.unique_name)
                    }
                }
            }

            for (var [i, u] of p_remove.entries()) {
                this.predicades[f_name] = this.predicades[f_name].filter(el => { return el.unique_name !== u; })
            }


        }

        isList(v: GTems.GBase): boolean {
            if (v instanceof GTems.GList) {
                return true
            }
            return false
        }


        isVar(v: GTems.GBase): boolean {
            if (v instanceof GTems.Variable) {
                return true
            }
            return false
        }

        addPredicateAtom(v: GTems.Atom) {
            this.values.push(v)
        }


        getGlobalVariableValue(v1: GTems.Variable): GTems.GBase {
            for (var [i, v] of this.var_atoms.entries()) {
                if (v.unique_name == v1.name) return v.value
            }
            return undefined
        }

        setGlobalVariableValue(v_name: string, x1: GTems.GBase) {
            for (var [i, v] of this.var_atoms.entries()) {
                if (v.unique_name == v_name) {
                    v.value = x1
                    return true
                }
            }
            return false
        }


        bind(sol: Solution.Solution, v1: GTems.GBase, v2: GTems.GBase): Solution.Solution {
            let sol2 = sol
            if (v1 instanceof GTems.Variable) {
                let x1 = this.getGlobalVariableValue(v1)
                if (isUndefined(x1) == false) { sol2 = Solution.bind(sol, v1, x1) }
            }

            let sol3 = sol2
            if (v2 instanceof GTems.Variable) {
                let x2 = this.getGlobalVariableValue(v2)
                if (isUndefined(x2) == false) { sol3 = Solution.bind(sol2, v2, x2) }
            }

            let sol4: Solution.Solution = Solution.bind(sol2, v1, v2)

            let new_vars = {}
            for (var k in sol4.var_values) {
                if (this.setGlobalVariableValue(k, sol4.var_values[k]) == false) {
                    new_vars[k] = sol4.var_values[k]
                }
            }
            sol4.var_values = new_vars
            return sol4
        }


        expandVar(stk: QueryStack, sol: Solution.Solution, varname: string): GTems.GBase {
            let vx = sol.var_values[varname]
            if (isUndefined(vx)) {
                for (var [vi, ve] of this.var_atoms.entries()) {
                    if (ve.unique_name == varname) {
                        return ve.value
                    }
                }
                return undefined
            }
            return vx
        }

        expandExpr(stk: QueryStack, sol: Solution.Solution, vcontetns: GTems.GBase, nlevel = 0): string {

            if (vcontetns instanceof GTems.LiteralStr) return vcontetns.value
            if (nlevel > 5) return vcontetns.toString()

            let buffer = ""
            if (vcontetns instanceof GTems.Variable) {
                let vv = this.expandVar(stk, sol, vcontetns.name)
                if (isUndefined(vv)) return "$" + vcontetns.name
                return this.expandExpr(stk, sol, vv, nlevel + 1)
            }

            for (var qrep of this.query_ar1(stk, sol, "repr", vcontetns)) {
                if (qrep instanceof Solution.Solution) {
                    if (Solution.isValid(qrep)) {
                        return this.expandExpr(stk, sol, qrep.value, nlevel + 1)
                    }
                }
            }


            if (vcontetns instanceof GTems.GList) {
                let xrep = vcontetns.items.map((element) => {
                    return this.expandExpr(stk, sol, element, nlevel + 1)
                });
                return xrep.join(", ")
            }

            return vcontetns.toString()



        }
        expandString(stk: QueryStack, sol: Solution.Solution, x: string): string {
            let buffer = ""
            let i = -1;
            let n = x.length
            while (i < n - 1) {
                i = i + 1
                if (x[i] == "$") {
                    let j = findEndAtom(x, i)
                    let varname = x.substr(i + 1, j - i - 1)
                    let local_var = new GTems.Variable(varname)
                    let vx = this.expandExpr(stk, sol, local_var)
                    buffer += (isUndefined(vx) ? "$" + varname : vx.toString());
                    i = j - 1
                    continue
                }

                if (x[i] == "[") {
                    let j = findEndBraket(x, i)
                    let inner = x.substr(i + 1, j - i - 1)
                    i = j

                    let contents = inner.trim()
                    let vcontetns: GTems.GBase = undefined
                    if (contents[0] == "$") vcontetns = new GTems.Variable(contents.substr(1))
                    else vcontetns = new GTems.Atom(contents)

                    buffer += this.expandExpr(stk, sol, vcontetns)
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
                    continue
                }


                buffer += x[i]
            }
            return buffer
        }


        public *query_append(sol: Solution.Solution, q1: GTems.GBase, q2: GTems.GBase) {
            if (q1 instanceof GTems.GList) {
                let qcopy = q1.clone()
                qcopy.items.push(q2)

                let r = Solution.fuse(sol, new Solution.Solution(Solution.SolutionState.QTrue, qcopy, {}))
                yield r
                return

            }
            return
        }


        public *query_and(stk: QueryStack, sol: Solution.Solution, q1: GTems.GBase, q2: GTems.GBase) {
            for (var qq of this.evaluate_query(stk, sol, q1)) {
                let qsol = <Solution.Solution>qq
                if (Solution.isValid(qsol)) {
                    let v = qsol.value
                    if (v instanceof GTems.LiteralBool) {
                        if (v.value == false) {
                            yield new Solution.Solution(Solution.SolutionState.QFalse, GTems.atom_false(), {})
                            continue; //nem tenta o segundo termo
                        }
                    }
                    for (var qz of this.evaluate_query(stk, Solution.fuse(sol, qsol), q2)) {
                        if (qz.state == Solution.SolutionState.QFail) {
                            yield qz
                            return
                        }
                        if (Solution.isValid(<Solution.Solution>qz)) {
                            let fz = Solution.fuse(qq, qz)
                            yield fz

                        }


                    }
                }
            }
        }


        public *query_or(stk: QueryStack, sol: Solution.Solution, q1: GTems.GBase, q2: GTems.GBase) {

            for (var qq of this.evaluate_query(stk, sol, q1)) {
                if (Solution.isValid(<Solution.Solution>qq)) {
                    let v = (<Solution.Solution>qq).value
                    if (v instanceof GTems.LiteralBool) {
                        if (v.value == false) {
                            yield new Solution.Solution(Solution.SolutionState.QFalse, GTems.atom_false(), {})
                            continue
                        }
                    }
                    yield qq
                }
            }

            //another term
            for (var qq of this.evaluate_query(stk, sol, q2)) {
                if (Solution.isValid(<Solution.Solution>qq)) {
                    let v = (<Solution.Solution>qq).value
                    if (v instanceof GTems.LiteralBool) {
                        if (v.value == false) {
                            yield new Solution.Solution(Solution.SolutionState.QFalse, GTems.atom_false(), {})
                            continue
                        }
                    }
                    yield qq
                }
            }
        }



        public all_query(q: GTems.GBase) {

            this.warringbuffer = []
            this.writebuffer = ""
            let sol = new Solution.Solution(Solution.SolutionState.QTrue, GTems.atom_true(), {})

            let stk: QueryStack = new QueryStack()

            let r = []
            for (var qz of this.query(stk, sol, q)) {
                if (Solution.isValid((<Solution.Solution>qz))) {

                    r.push(qz)
                }
            }

            for (var [i, wm] of this.warringbuffer.entries()) {
                //process.stderr.write("Warring:" + wm) 
                console.log("Warring:" + wm)
            }
            this.warringbuffer = []

            let mwriteP = this.writebuffer.replace(new RegExp("\\\\n", 'g'), "\r\n");
            //process.stdout.write(mwriteP)   
            console.log(mwriteP)
            this.writebuffer = ""

            return r
        }

        public *query(stk: QueryStack, sol: Solution.Solution, q: GTems.GBase) {
            if (q instanceof GTems.Functor) {
                if (q.name == "and") {
                    for (var qq of this.query_and(stk, sol, q.args[0], q.args[1])) yield qq
                    return
                }

                if (q.name == "or") {
                    for (var qq of this.query_or(stk, sol, q.args[0], q.args[1])) yield qq
                    return
                }

                if (q.args.length == 0) {
                    for (var qx0 of this.query_ar0(stk, sol, q.name)) {
                        yield qx0
                    }
                    return
                }
                if (q.args.length == 1) {
                    for (var qx of this.query_ar1(stk, sol, q.name, q.args[0])) {
                        yield qx
                    }
                    return
                }

                if (q.args.length == 2) {
                    for (var qy of this.query_ar2(stk, sol, q.name, q.args[0], q.args[1])) {
                        yield qy
                    }
                    return
                }

                if (q.args.length == 3) {
                    for (var qz of this.query_ar3(stk, sol, q.name, q.args[0], q.args[1], q.args[2])) {
                        yield qz
                    }
                    return
                }

            }

            if (q instanceof GTems.LiteralBool) {
                if (q.value == false) yield new Solution.Solution(Solution.SolutionState.QFalse, q, {})
                if (q.value == true) yield new Solution.Solution(Solution.SolutionState.QTrue, q, {})
                return
            }


            if (q instanceof GTems.Atom) {
                if (q.name == "true") {
                    yield new Solution.Solution(Solution.SolutionState.QTrue, q, {})
                    return
                }
                if (q.name == "false") {
                    yield new Solution.Solution(Solution.SolutionState.QFalse, q, {})
                    return
                }
                if (q.name == "fail") {
                    yield new Solution.Solution(Solution.SolutionState.QFail, q, {})
                    return
                }
                if (q.name == "cut") {
                    yield new Solution.Solution(Solution.SolutionState.QCut, q, {})
                    return
                }


                yield new Solution.Solution(Solution.SolutionState.QTrue, q, {}) //fail
                return
            }
            if (q instanceof GTems.Variable) {

                for (var [vi, ve] of this.var_atoms.entries()) {
                    if (ve.unique_name == q.name) {
                        yield new Solution.Solution(Solution.SolutionState.QTrue, ve.value, {})
                        return
                    }
                }

                if (this.isVar(q)) {
                    let qval = Solution.getValue(sol, q);
                    if (isUndefined(qval)) {
                        yield new Solution.Solution(Solution.SolutionState.QFalse, qval, {}) //fail                        
                    }
                    else {
                        yield new Solution.Solution(Solution.SolutionState.QTrue, qval, {})
                    }
                    return
                }
            }

            if (q instanceof GTems.LiteralNumber) {
                yield new Solution.Solution(Solution.SolutionState.QTrue, q, {})
                return
            }


            if (q instanceof GTems.LiteralStr) {
                if (q.expanded == false) {
                    let sxValue = this.expandString(stk, sol, q.value)
                    let r = new GTems.LiteralStr(sxValue, true)
                    yield new Solution.Solution(Solution.SolutionState.QTrue, r, {})
                }
                else {
                    yield new Solution.Solution(Solution.SolutionState.QTrue, q, {})
                }
                return
            }

            if (q instanceof GTems.GList) {
                yield new Solution.Solution(Solution.SolutionState.QTrue, q, {})
                return
            }



            throw new Error('Unassigned Term Evaluator ' + q.toString());


        }



        *evaluate_query(stk: QueryStack, sol: Solution.Solution, code: GTems.GBase) {


            if (code instanceof GTems.Atom) {

                if (code.name == "discard") {
                    stk.discardStack.push(new QS.DiscardItem(stk.callStack[stk.callStack.length - 1].unique_name))
                    yield new Solution.Solution(Solution.SolutionState.QTrue, new GTems.LiteralBool(true), {})
                    return
                }


                if (code.name == "true") {
                    yield new Solution.Solution(Solution.SolutionState.QTrue, new GTems.LiteralBool(true), {})
                    return
                }
                if (code.name == "false") {
                    yield new Solution.Solution(Solution.SolutionState.QFalse, new GTems.LiteralBool(false), {})
                    return
                }
                if (code.name == "fail") {
                    yield new Solution.Solution(Solution.SolutionState.QFail, code, {})
                    return
                }
                if (code.name == "cut") {
                    yield new Solution.Solution(Solution.SolutionState.QCut, code, {})
                    return
                }

                for (var [i, cc] of this.cons_atoms.entries()) {
                    if (cc.unique_name == code.name) {
                        yield new Solution.Solution(Solution.SolutionState.QTrue, cc.value, {})
                        return
                    }
                }

            }

            if (code instanceof GTems.Variable) {
                if (code.name == "_") {
                    yield new Solution.Solution(Solution.SolutionState.QTrue, code, {})
                    return
                }
                for (var [vi, ve] of this.var_atoms.entries()) {
                    if (ve.unique_name == code.name) {
                        yield new Solution.Solution(Solution.SolutionState.QTrue, ve.value, {})
                        return
                    }
                }



                let code_value = Solution.getValue(sol, code)
                if (isUndefined(code_value)) {
                    yield new Solution.Solution(Solution.SolutionState.QTrue, code, {})
                    return
                }
                yield new Solution.Solution(Solution.SolutionState.QTrue, code_value, {})
                return
            }

            if (code instanceof GTems.LiteralNumber) {
                yield new Solution.Solution(Solution.SolutionState.QTrue, code, {})
                return
            }
            if (code instanceof GTems.LiteralBool) {
                yield new Solution.Solution(Solution.SolutionState.QTrue, code, {})
                return
            }





            if (code instanceof GTems.GList) {
                for (var ecc of this.eval_rec(stk, sol, [], code.items)) {
                    yield new Solution.Solution(Solution.SolutionState.QTrue, new GTems.GList(ecc), {})
                }
                return
            }

            for (var qin of this.query(stk, sol, code)) {
                let fsol = Solution.fuse(sol, qin)
                if (Solution.isValid(fsol)) {
                    yield fsol;
                }
                if (fsol.state == Solution.SolutionState.QFail) {
                    yield fsol
                    return
                }

            }
        }


        //Parse 

        *string_match(stk: QueryStack, arg1: GTems.LiteralStr, patternMatching: GTems.LiteralStr) {

            for (var variables of MParse.uparseString(arg1.value, patternMatching.value)) {
                {
                    let sol = new Solution.Solution(Solution.SolutionState.QTrue, GTems.atom_true(), {})
                    for (var k in variables) {
                        let x = variables[k]
                        let val = undefined
                        {
                            if (x.length == 1) {
                                val = new GTems.LiteralStr(x[0].gettext())
                            }
                            else {
                                let all_str = []
                                for (var [i, xx] of x.entries()) {
                                    all_str.push(xx.gettext())
                                }
                                val = new GTems.LiteralStr(all_str.join(" "))
                            }
                        }
                        while (k[0] == "$") k = k.substr(1)
                        sol = sol.add(k, val)
                    }
                    yield sol
                }
            }
        }

        *string_parse(stk: QueryStack, arg1: GTems.LiteralStr) {
            for (var [i, umm] of this.understands.entries()) {
                for (var variables_sol of this.string_match(stk, arg1, umm.patternMatching)) {
                    for (var r of this.evaluate_query(stk, variables_sol, umm.value)) {
                        yield r
                    }
                }
            }
        }



        //buildIn Predicates




        *eval_rec(stk, sol, acc: GTems.GBase[], args: GTems.GBase[]) {
            if (args.length == 0) {
                yield acc;
                return
            }
            let args_c = Object.assign([], args);
            let arg = args_c.shift()
            for (var v of this.evaluate_query(stk, sol, arg)) {
                if (Solution.isValid(v)) {
                    let acc2 = Object.assign([], acc);
                    acc2.push(v.value)
                    for (var rval of this.eval_rec(stk, sol, acc2, args_c)) yield rval
                }
            }
        }




        *apply_rec(stk, sol, acc: GTems.GBase[], args: GTems.GBase[], func) {
            if (args.length == 0) {
                yield acc;
                return
            }
            let args_c = Object.assign([], args);
            let arg = args_c.shift()
            for (var v of this.evaluate_query(stk, sol, arg)) {
                if (Solution.isValid(v)) {
                    for (var qs of this.query_ar1(stk, sol, func, v.value)) {
                        if (qs instanceof Solution.Solution) {
                            let acc2 = Object.assign([], acc);
                            acc2.push(qs.value)
                            for (var rval of this.apply_rec(stk, sol, acc2, args_c, func)) yield rval
                        }
                    }
                }
            }
        }



        //general call



        public *query_ar3(stk: QueryStack, sol: Solution.Solution, f_name: string, _arg1: GTems.GBase, _arg2: GTems.GBase, _arg3: GTems.GBase) {
            let hasY: boolean = false
            for (var s of this.query_ar3_inner(stk, sol, PredicateKind.NOMINAL, f_name, _arg1, _arg2, _arg3)) {
                yield s
                if (Solution.isValid(s)) hasY = true
            }
            //nao achou uma solução..entao tenta o unless
            if (hasY == false) {
                for (var sq of this.query_ar3_inner(stk, sol, PredicateKind.UNLESS, f_name, _arg1, _arg2, _arg3)) {
                    yield sq
                }
            }
            return
        }

        *query_ar3_inner(stk: QueryStack, sol: Solution.Solution, attribSelect: PredicateKind, f_name: string, _arg1: GTems.GBase, _arg2: GTems.GBase, _arg3: GTems.GBase) {


            if (attribSelect == PredicateKind.NOMINAL) {



                if (f_name == "if_else") {
                    let has_query = false
                    for (var sol_if of this.query(stk, sol, _arg1)) {
                        if (sol_if instanceof Solution.Solution) {
                            has_query = true
                            if (Solution.isTrue(sol_if)) {
                                sol_if = Solution.fuse(sol, sol_if) //nao tem muita diferenca entre a ordem
                                for (var sol_then of this.query(stk, sol_if, _arg2)) {
                                    yield sol_then
                                }
                            }
                            else {
                                for (var sol_else of this.query(stk, sol, _arg3)) {
                                    yield sol_else
                                }
                            }
                        }
                    }
                    if (has_query == false) {
                        for (var sol_else of this.query(stk, sol, _arg3)) {
                            yield sol_else
                        }
                    }
                    return
                }

            }




            for (var x1 of this.evaluate_query(stk, sol, _arg1)) {
                if (Solution.isValid(x1)) {
                    let nsol = Solution.fuse(sol, x1)
                    for (var x2 of this.evaluate_query(stk, nsol, _arg2)) {
                        if (Solution.isValid(x2)) {
                            let nsol2 = Solution.fuse(nsol, x2)
                            for (var x3 of this.evaluate_query(stk, nsol2, _arg3)) {
                                if (Solution.isValid(x3)) {
                                    let nsol3 = Solution.fuse(nsol2, x3)
                                    for (var z of this.query_ar3_inner_argv(stk, nsol3, attribSelect, f_name, x1.value, x2.value, x3.value)) {
                                        yield z
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        *query_ar3_inner_argv(stk: QueryStack, sol: Solution.Solution, attribSelect: PredicateKind, f_name: string, _arg1: GTems.GBase, _arg2: GTems.GBase, _arg3: GTems.GBase) {
            if (isArray(_arg1)) _arg1 = _arg1[0]
            if (isArray(_arg2)) _arg2 = _arg2[0]
            if (isArray(_arg3)) _arg3 = _arg3[0]

            let arg1 = _arg1
            let arg2 = _arg2
            let arg3 = _arg3

            if (f_name == "apply") {
                if (_arg1 instanceof GTems.Atom) {
                    let f = new GTems.Functor(_arg1.name, _arg2, _arg3)
                    for (var r of this.evaluate_query(stk, sol, f)) {
                        yield r
                    }
                }
                return
            }


            if (f_name == "append") {

                for (var ssk of BuildIns.buildIn_append(this, stk, sol, arg1, arg2, arg3)) yield ssk
                return
            }
            if (f_name == "HT") {

                for (var ssk of BuildIns.buildIn_ht(this, stk, sol, arg1, arg2, arg3)) yield ssk
                return
            }
            if (f_name == "nextto") {
                for (var ssn of BuildIns.buildIn_nextto(this, stk, sol, arg1, arg2, arg3)) yield ssn
                return
            }

            if (true) {
                for (var r of this.query_n_argv(stk, sol, attribSelect, f_name, [arg1, arg2, arg3])) {
                    yield r
                }

            }

        }



        public *query_n_argv(stk: QueryStack, sol: Solution.Solution, attribSelect: PredicateKind, f_name: string, _arg: GTems.GBase[]) {
            let hasFound = false

            let N = _arg.length
            if (f_name in this.predicades) {
                let pnamed = this.predicades[f_name].filter(x => x.entry.name == f_name)
                for (var [i, p] of pnamed.entries()) {

                    // if (query_satisf)  continue
                    if (stk.contains_discard(p.unique_name)) continue

                    if (p.entry.name != f_name) continue
                    let pp = p.entry;
                    if (pp instanceof GTems.Functor) {

                        if (p.has(attribSelect) == false) continue; //UNLESS

                        hasFound = true
                        if (pp.args.length != N) continue
                        let pa = []
                        for (var k = 0; k < N; k++) {
                            if (isArray(pp.args[k])) pa.push(pp.args[k][0])
                            else { pa.push(pp.args[k]) }
                        }


                        //if (stk.contains(p.unique_name, ..._arg)) continue //nao tenta de novo se ja estiver tetando dar query no mesmo predicado e nos mesmo parametros
                        let stk_next: QueryStack = stk.pushCall(p.unique_name, ..._arg)


                        //arg1 nao rh uma variavel ..bind o argumento para o valor dela ..senao,bind na saida
                        let sol_next = new Solution.Solution(Solution.SolutionState.QTrue, GTems.atom_true(), {})
                        for (var k = 0; k < N; k++) {
                            if (this.isVar(_arg[k]) == false) { sol_next = this.bind(sol_next, pa[k], _arg[k]) }
                        }


                        // testa a condicao de ativacao do predicado
                        let cond_satisf = true
                        if (isUndefined(p.condition) == false) {
                            cond_satisf = false
                            //testa a condicao
                            for (var sol_cond of this.evaluate_query(stk_next, sol_next, p.condition)) {
                                if (Solution.isValid(sol_cond)) {
                                    cond_satisf = true
                                    sol_next = Solution.fuse(sol_next, sol_cond)
                                    break //apenas a primeira true ja serve
                                }
                            }
                        }
                        if (cond_satisf == false) continue  // nem testa o corpo .. proximo termo 

                        if (Solution.isValid(sol_next) == false) continue
                        for (var sol_next_inner of this.evaluate_query(stk_next, sol_next, p.value)) {
                            if (sol_next_inner.state == Solution.SolutionState.QFail) {
                                yield sol_next_inner
                                return
                            }

                            if (Solution.isValid(sol_next_inner) == false) continue
                            sol_next_inner = Solution.fuse(sol_next, sol_next_inner);
                            let sol_n = new Solution.Solution(Solution.SolutionState.QTrue, GTems.atom_true(), {})
                            sol_n = Solution.fuse(sol, sol_n) //just a copy                         


                            for (var k = 0; k < N; k++) {
                                if (this.isVar(_arg[k]))  //arg1 eh uma variavel ? bind para o resultado 
                                {
                                    let v_ret = Solution.getValue(sol_next_inner, pa[k])
                                    if (isUndefined(v_ret) == false) sol_n = this.bind(sol_n, v_ret, _arg[k])
                                    if (Solution.isValid(sol_n) == false) continue
                                }
                            }
                            if (Solution.isValid(sol_n) == false) continue



                            let ret = sol_n.add_value(sol_next_inner)
                            if (ret.state == Solution.SolutionState.QCut || p.has(PredicateKind.DIRECT)) {
                                ret.state = Solution.SolutionState.QTrue;
                                yield ret
                                return
                            }
                            else {
                                yield ret
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
                        this.warring("Predicate " + f_name + "/" + N.toString() + "  not found ")
                    }
                }
        }




        public *query_ar2(stk: QueryStack, sol: Solution.Solution, f_name: string, _arg1: GTems.GBase, _arg2: GTems.GBase) {
            let hasY: boolean = false
            for (var s of this.query_ar2_inner(stk, sol, PredicateKind.NOMINAL, f_name, _arg1, _arg2)) {
                yield s
                if (Solution.isValid(s)) hasY = true
            }
            if (hasY == false) {
                for (var sq of this.query_ar2_inner(stk, sol, PredicateKind.UNLESS, f_name, _arg1, _arg2)) {
                    yield sq
                }
            }
            return
        }


        *query_ar2_inner(stk: QueryStack, sol: Solution.Solution, attribSelect: PredicateKind, f_name: string, _arg1: GTems.GBase, _arg2: GTems.GBase) {


            if (attribSelect == PredicateKind.NOMINAL) {
                if (f_name == "set") {
                    let _predName = undefined
                    if (_arg1 instanceof GTems.Atom) _predName = _arg1.name
                    if (_arg1 instanceof GTems.Variable) {
                        for (var var1 of this.evaluate_query(stk, sol, _arg1)) { if (Solution.isValid(var1)) if (var1.value instanceof GTems.Atom) { _predName = var1.value.name; break } }
                    }

                    if ((isUndefined(_predName) == false) && _arg2 instanceof GTems.GList) {
                        for (var av of this.eval_rec(stk, sol, [], _arg2.items)) {
                            let s = new Solution.Solution(Solution.SolutionState.QTrue, GTems.atom_true(), {})
                            this.setPredicate(stk, s, _predName, av)
                            yield new Solution.Solution(Solution.SolutionState.QTrue, GTems.atom_true(), {})
                        }
                        return
                    }
                }

                if (f_name == "unset") {
                    let _predName = undefined
                    if (_arg1 instanceof GTems.Atom) _predName = _arg1.name
                    if (_arg1 instanceof GTems.Variable) {
                        for (var var1 of this.evaluate_query(stk, sol, _arg1)) { if (Solution.isValid(var1)) if (var1.value instanceof GTems.Atom) { _predName = var1.value.name; break } }
                    }

                    if ((isUndefined(_predName) == false) && _arg2 instanceof GTems.GList) {
                        for (var av of this.eval_rec(stk, sol, [], _arg2.items)) {
                            let s = new Solution.Solution(Solution.SolutionState.QTrue, GTems.atom_true(), {})
                            this.unsetPredicate(stk, s, _predName, av)
                            yield new Solution.Solution(Solution.SolutionState.QTrue, GTems.atom_true(), {})
                        }
                        return
                    }
                }


                if (f_name == "findall") {
                    let results: GTems.GBase[] = []
                    if (_arg1 instanceof GTems.Variable) {
                        for (var x2 of this.evaluate_query(stk, sol, _arg2)) {
                            if (Solution.isValid(x2)) {
                                results.push(x2.var_values[_arg1.name])
                            }
                        }
                    }
                    var cpy = new Solution.Solution(Solution.SolutionState.QTrue, new GTems.GList(results), {})
                    yield cpy
                    return
                }


                if (f_name == "assign") {
                    if (_arg1 instanceof GTems.Variable) {
                        for (var x2 of this.evaluate_query(stk, sol, _arg2)) {
                            if (Solution.isValid(x2)) {
                                if (this.setGlobalVariableValue(_arg1.name, x2.value)) {
                                    yield sol
                                }
                                else {
                                    var cpy = Solution.fuse(new Solution.Solution(Solution.SolutionState.QTrue, GTems.atom_true(), {}), sol)
                                    cpy.var_values[_arg1.name] = x2.value
                                    yield cpy
                                }
                            }
                        }
                    }
                    return
                }

            }


            for (var x1 of this.evaluate_query(stk, sol, _arg1)) {
                if (Solution.isValid(x1)) {
                    let nsol = Solution.fuse(sol, x1)

                    for (var x2 of this.evaluate_query(stk, nsol, _arg2)) {
                        if (Solution.isValid(x2)) {
                            let nsol2 = Solution.fuse(nsol, x2)
                            for (var z of this.query_ar2_inner_argv(stk, nsol2, attribSelect, f_name, x1.value, x2.value)) {
                                yield z
                            }
                        }
                    }
                }
            }
        }


        *query_ar2_inner_argv(stk: QueryStack, sol: Solution.Solution, attribSelect: PredicateKind, f_name: string, _arg1: GTems.GBase, _arg2: GTems.GBase) {
            if (isArray(_arg1)) _arg1 = _arg1[0]
            if (isArray(_arg2)) _arg2 = _arg2[0]

            let arg1 = _arg1
            let arg2 = _arg2


            if (f_name == "apply") {
                if (_arg1 instanceof GTems.Atom) {
                    let f = new GTems.Functor(_arg1.name, _arg2)
                    for (var r of this.evaluate_query(stk, sol, f)) {
                        yield r
                    }
                }
                return
            }


            if (f_name == "unify") {
                var bvar = this.bind(sol, arg1, arg2)
                yield bvar
                return
            }

            if (f_name == "equal") {
                var bvar_e = this.bind(sol, arg1, arg2)
                if (Solution.isValid(bvar_e)) yield new Solution.Solution(bvar_e.state, GTems.atom_true(), {})
                else yield new Solution.Solution(bvar_e.state, GTems.atom_false(), {})
                return
            }





            if (f_name == "not_equal") {
                var bvar_e = this.bind(sol, arg1, arg2)
                if (Solution.isValid(bvar_e)) {
                    yield new Solution.Solution(Solution.SolutionState.QTrue, GTems.atom_false(), {})
                }
                else {
                    yield new Solution.Solution(Solution.SolutionState.QTrue, GTems.atom_true(), {})
                }
                return
            }


            // if (f_name == "append") {
            //     for (var qq of this.query_append(sol, arg1, arg2)) {
            //         yield qq
            //     }
            //     return
            // }

            if (f_name == "member") {
                for (var qqm of BuildIns.buildIn_member(this, stk, sol, arg1, arg2)) {
                    yield qqm
                }
                return
            }
            if (f_name == "random_member") {
                for (var qqm of BuildIns.buildIn_random_member(this, stk, sol, arg1, arg2)) {
                    yield qqm
                }
                return
            }




            if (f_name == "atom_string") {
                for (var qqm of BuildIns.buildIn_atom_string(this, stk, sol, arg1, arg2)) {
                    yield qqm
                }
                return
            }


            if (f_name == "and") {
                for (var qq of this.query_and(stk, sol, arg1, arg2)) {
                    yield qq
                }
                return
            }

            if (f_name == "plus") {
                for (var ssk of BuildIns.buildIn_add(this, stk, sol, arg1, arg2)) yield ssk
                //yield BuildIns.buildIn_add(stk,sol, arg1, arg2)
                return
            }

            if (f_name == "minus") {
                for (var ss8 of BuildIns.buildIn_minus(this, stk, sol, arg1, arg2)) yield ss8
                //yield BuildIns.buildIn_minus(stk,sol, arg1, arg2)
                return
            }

            if (f_name == "div") {
                for (var ss81 of BuildIns.buildIn_div(this, stk, sol, arg1, arg2)) yield ss81
                return
            }

            if (f_name == "mod") {
                for (var ss82 of BuildIns.buildIn_mod(this, stk, sol, arg1, arg2)) yield ss82
                return
            }


            if (f_name == "GREATER") {
                //yield BuildIns.buildIn_gt(stk,sol, arg1, arg2)
                for (var ss7 of BuildIns.buildIn_gt(this, stk, sol, arg1, arg2)) yield ss7
                return
            }

            if (f_name == "LESS") {
                //yield BuildIns.buildIn_lt(stk,sol, arg1, arg2)
                for (var ss5 of BuildIns.buildIn_lt(this, stk, sol, arg1, arg2)) yield ss5
                return
            }

            if (f_name == "GREATEREQUAL") {
                //yield BuildIns.buildIn_gt(stk,sol, arg1, arg2)
                for (var ss71 of BuildIns.buildIn_gte(this, stk, sol, arg1, arg2)) yield ss71
                return
            }

            if (f_name == "LESSEQUAL") {
                //yield BuildIns.buildIn_lt(stk,sol, arg1, arg2)
                for (var ss22 of BuildIns.buildIn_lte(this, stk, sol, arg1, arg2)) yield ss22
                return
            }



            if (f_name == "*") {
                // yield BuildIns.buildIn_mul(stk,sol, arg1, arg2)
                for (var ss4 of BuildIns.buildIn_mul(this, stk, sol, arg1, arg2)) {
                    yield ss4
                }
                return
            }

            if (f_name == "head") {
                // yield BuildIns.buildIn_head(stk,sol, arg1, arg2)
                for (var ss2 of BuildIns.buildIn_head(this, stk, sol, arg1, arg2)) yield ss2
                return
            }

            if (f_name == "tail") {
                //yield BuildIns.buildIn_tail(stk,sol, arg1, arg2)
                for (var ss2 of BuildIns.buildIn_tail(this, stk, sol, arg1, arg2)) yield ss2
                return
            }

            if (f_name == "maplist") {
                //yield BuildIns.buildIn_tail(stk,sol, arg1, arg2)
                for (var ssm of BuildIns.buildIn_maplist(this, stk, sol, arg1, arg2)) yield ssm
                return
            }


            if (f_name == "match") {
                if (arg1 instanceof GTems.LiteralStr) {
                    if (arg2 instanceof GTems.LiteralStr) {
                        for (var msol of this.string_match(stk, arg1, arg2)) {
                            yield msol
                        }
                    }
                }
                return
            }


            if (true) {
                for (var r of this.query_n_argv(stk, sol, attribSelect, f_name, [arg1, arg2])) {
                    yield r
                }

            }






        }




        //AR 1 
        public *query_ar1(stk: QueryStack, sol: Solution.Solution, f_name: string, _arg1: GTems.GBase) {

            let hasY: boolean = false
            for (var s of this.query_ar1_inner(stk, sol, PredicateKind.NOMINAL, f_name, _arg1)) {
                yield s
                hasY = true
                //if (Solution.isValid(s))
            }
            if (hasY == false) {
                for (var sq of this.query_ar1_inner(stk, sol, PredicateKind.UNLESS, f_name, _arg1)) {
                    yield sq
                }
            }
            return
        }




        *query_ar1_inner(stk: QueryStack, sol: Solution.Solution, attribSelect: PredicateKind, f_name: string, _arg1: GTems.GBase) {



            if (attribSelect != PredicateKind.UNLESS) {


                if (f_name == "set") {
                    //let s = new Solution.Solution(Solution.SolutionState.QTrue, GTems.atom_true(), {})
                    if (_arg1 instanceof GTems.Functor) {
                        for (var av of this.eval_rec(stk, sol, [], _arg1.args)) {
                            let s = new Solution.Solution(Solution.SolutionState.QTrue, GTems.atom_true(), {})
                            this.setPredicate(stk, s, _arg1.name, av)
                            yield new Solution.Solution(Solution.SolutionState.QTrue, GTems.atom_true(), {})
                        }
                        return
                    }
                }

                if (f_name == "unset") {
                    if (_arg1 instanceof GTems.Functor) {
                        for (var av of this.eval_rec(stk, sol, [], _arg1.args)) {
                            let s = new Solution.Solution(Solution.SolutionState.QTrue, GTems.atom_true(), {})
                            this.unsetPredicate(stk, s, _arg1.name, av)
                            yield new Solution.Solution(Solution.SolutionState.QTrue, GTems.atom_true(), {})
                        }
                        return
                    }
                }

                if (f_name == "once") {
                    for (var x1 of this.evaluate_query(stk, sol, _arg1)) {
                        if (Solution.isTrue(x1)) {
                            yield Solution.fuse(sol, x1)
                            break
                        }
                    }
                    return
                }

                if (f_name == "last") {
                    let last = undefined
                    for (var x1 of this.evaluate_query(stk, sol, _arg1)) {
                        if (Solution.isTrue(x1)) {
                            last = Solution.fuse(sol, x1)
                        }
                    }
                    if (isUndefined(last) == false) { yield last }
                    return
                }

                if (f_name == "repeat") {
                    while (true) {
                        let hasQuery = false
                        for (var x1 of this.evaluate_query(stk, sol, _arg1)) {
                            hasQuery = true
                            if (Solution.isTrue(x1)) {
                                yield Solution.fuse(sol, x1)
                            }
                            else {
                                return
                            }
                        }
                        if (hasQuery == false) {
                            //yield new Solution.Solution(Solution.SolutionState.QFalse, GTems.atom_false(), {})
                            return
                        }
                    }
                }

                if (f_name == "not") {
                    let has_yielded = false
                    for (var x1 of this.evaluate_query(stk, sol, _arg1)) {
                        if (Solution.isValid(x1)) {
                            has_yielded = true
                            if (x1.value instanceof GTems.LiteralBool) {
                                if (x1.value.value) yield new Solution.Solution(Solution.SolutionState.QTrue, GTems.atom_false(), {})
                                else yield new Solution.Solution(Solution.SolutionState.QTrue, GTems.atom_true(), {})
                            }
                            else {
                                yield new Solution.Solution(Solution.SolutionState.QTrue, GTems.atom_false(), {})
                            }
                        }
                        else {
                            has_yielded = true
                            yield new Solution.Solution(Solution.SolutionState.QTrue, GTems.atom_true(), {})
                        }
                    }
                    if (has_yielded == false) {
                        yield new Solution.Solution(Solution.SolutionState.QTrue, GTems.atom_true(), {})
                    }

                    return
                }
            }

            for (var x1 of this.evaluate_query(stk, sol, _arg1)) {
                if (Solution.isValid(x1)) {
                    let nsol = Solution.fuse(sol, x1)
                    for (var z of this.query_ar1_inner_argv(stk, nsol, attribSelect, f_name, x1.value)) {
                        yield z
                    }
                }
            }
        }





        *query_ar1_inner_argv(stk: QueryStack, sol: Solution.Solution, attribSelect: PredicateKind, f_name: string, _arg1: GTems.GBase) {



            if (isArray(_arg1)) _arg1 = _arg1[0]

            let arg1 = _arg1

            let value_1 = Array.from(this.evaluate_query(stk, sol, _arg1)).filter((x) => Solution.isValid(x)).map((c) => c.value)

            if (value_1.length > 1) {
                for (var [i, q_arg1] of value_1.entries()) {
                    for (var r_arg1 of this.query_ar1_inner(stk, sol, attribSelect, f_name, q_arg1)) yield r_arg1
                }
                return
            }


            if (value_1.length > 0) arg1 = value_1[0]
            else arg1 = GTems.atom_false()


            let query_satisf: Boolean = false




            if (f_name == "is_atom") {
                if (arg1 instanceof GTems.Atom) {
                    yield new Solution.Solution(Solution.SolutionState.QTrue, GTems.atom_true(), {})
                }
                else {
                    yield new Solution.Solution(Solution.SolutionState.QTrue, GTems.atom_false(), {})
                }
                return
            }

            if (f_name == "is_list") {
                if (arg1 instanceof GTems.GList) {
                    yield new Solution.Solution(Solution.SolutionState.QTrue, GTems.atom_true(), {})
                }
                else {
                    yield new Solution.Solution(Solution.SolutionState.QTrue, GTems.atom_false(), {})
                }
                return
            }

            if (f_name == "is_string") {
                if (arg1 instanceof GTems.LiteralStr) {
                    yield new Solution.Solution(Solution.SolutionState.QTrue, GTems.atom_true(), {})
                }
                else {
                    yield new Solution.Solution(Solution.SolutionState.QTrue, GTems.atom_false(), {})
                }
                return
            }

            if (f_name == "expand") {
                if (arg1 instanceof GTems.LiteralStr) {
                    let rexp = this.expandString(stk, sol, arg1.value);
                    yield new Solution.Solution(Solution.SolutionState.QTrue, new GTems.LiteralStr(rexp), {})
                }
                else {
                    yield new Solution.Solution(Solution.SolutionState.QTrue, GTems.atom_false(), {})
                }
                return
            }



            if (f_name == "parse") {
                if (arg1 instanceof GTems.LiteralStr) {
                    for (var msol of this.string_parse(stk, arg1)) {
                        yield msol
                    }
                }
                return
            }



            for (var r of this.query_n_argv(stk, sol, attribSelect, f_name, [arg1])) {
                yield r
            }







            if (f_name == "write") {

                if (arg1 instanceof GTems.LiteralStr) { this.write(stk, sol, arg1.value); }
                else {
                    this.write(stk, sol, arg1.toString());
                }
                yield new Solution.Solution(Solution.SolutionState.QTrue, GTems.atom_true(), {})
                return
            }


            if (attribSelect != PredicateKind.UNLESS) {
                if (f_name === "repr") { }
                else {
                    this.warring("Predicate " + f_name + "/1  not found ")
                }
            }

        }
        write(stk: QueryStack, sol: Solution.Solution, arg0: string) {

            this.writebuffer = this.writebuffer + arg0
        }
        warring(arg0: string) {
            this.warringbuffer.push(arg0)
        }


        public *query_ar0(stk: QueryStack, sol: Solution.Solution, f_name: string) {

            let hasY: boolean = false
            for (var s of this.query_ar0_inner(stk, sol, PredicateKind.NOMINAL, f_name)) {
                yield s
                if (Solution.isValid(s)) hasY = true
            }
            if (hasY == false) {
                for (var sq of this.query_ar0_inner(stk, sol, PredicateKind.UNLESS, f_name)) {
                    yield sq
                }
            }
            return
        }

        *query_ar0_inner(stk: QueryStack, sol: Solution.Solution, attribSelect: PredicateKind, f_name: string) {
            for (var z of this.query_ar0_inner_argv(stk, sol, attribSelect, f_name)) yield z
        }


        *query_ar0_inner_argv(stk: QueryStack, sol: Solution.Solution, attribSelect: PredicateKind, f_name: string) {
            let query_satisf: Boolean = false


            if (f_name == "write") {
                this.write(stk, sol, ".")
                yield new Solution.Solution(Solution.SolutionState.QTrue, GTems.atom_true(), {})
                return
            }


            for (var r of this.query_n_argv(stk, sol, attribSelect, f_name, [])) {
                yield r
            }

        }





    } //class
} //namespace




