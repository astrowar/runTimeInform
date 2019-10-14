 
import { UTerm } from "./mterms";
import { isString } from "util";
 

type ITerm = UTerm.ITerm
var parseString = UTerm.parseString
type MatchResult = UTerm.MatchResult
var splitStringInput = UTerm.splitStringInput


export namespace MParse{

    export   class PSyntaxError{
        constructor(public message: string ) { }
      }
  export  class Matchfunctior {
        constructor(public mstr: string, public func: any) { }
    }

    function isSameTermArray(a: ITerm[], b: ITerm[] | string) {

        if (isString(b)) { 
            return false
        } 
        if (a.length != b.length) return false
        let n = a.length
        for (var i = 0; i < n; i++) {
            if (a[i].txt != b[i].txt) {
                return false
            }
        }
        return true; //todos iguais
    }
 

    function* genPattens_ii(iline: ITerm[], matc: string) {
        {
            for (var vqxxxx of parseString(iline, matc)) {
                let vxxx: MatchResult = <MatchResult>vqxxxx
                let q = {}
                let matchIsValid = true 
                for (var sxxx of vxxx.entries()) {
                    let varname: string = <string>sxxx[0]
                    if (q[varname] == undefined){   q[varname] = sxxx[1] }
                    else {
                        //verifica se ja existe e se é a mesma coisa
                        let term_old = q[varname]
                        if (isSameTermArray(term_old, sxxx[1]) == false ) { matchIsValid =false; break }
                    } 
                    //yield sxxx
                }
                if (matchIsValid)   yield q
            }
        }
        return
    }
    export class MFragmentKind {
        constructor(public txt: string, public optional: boolean) {
            if (this.optional) {
                if (this.txt[0] == '(') {
                    this.txt = this.txt.slice(1, this.txt.length - 1)
                }
            }
        }
    }

    function find_end_term(m: string, j) {
        let n = m.length
        let p = 0;
        for (let i = j; i < n; ++i) {
            if ((m[i] == ' ') && (p == 0)) return i
            if (m[i] == '(') p = p + 1
            if (m[i] == ')') {
                if (p == 1) return i + 1
                p = p - 1
            }

        }
        return n
    }


    function classifySegments(m: string): MFragmentKind[] {
        let n = m.length
        let terms: MFragmentKind[] = []
        let i = 0
        let pivot = 0
        while (i < n) {
            if (m[i] == '?') {
                if (i - 1 > pivot) terms.push(new MFragmentKind(m.slice(pivot, i - 1), false))
                let j = find_end_term(m, i + 1)
                terms.push(new MFragmentKind(m.slice(i + 1, j), true))
                pivot = j
            }
            i++
        }
        if (n > pivot) terms.push(new MFragmentKind(m.slice(pivot, n), false))
        return terms
    }


    function* expand_rem(acc: string[], rem: MFragmentKind[]) {
        if (rem.length == 0) {
            yield acc.join(" ")
        }
        else {
            let acc_nex: string[] = acc.concat([rem[0].txt])
            for (var x of expand_rem(acc_nex, rem.slice(1))) { yield x }
            if (rem[0].optional) {
                for (var x of expand_rem(acc, rem.slice(1))) { yield x }
            }
        }
    }

    function* expand_i(m: string) {
        //separa em fix segments e optional  
        let n = m.length
        let terms: MFragmentKind[] = classifySegments(m);
        for (var mx of expand_rem([], terms)) {
            yield mx
        }
        //yield m
    }

    function expand(matc: Matchfunctior[]): Matchfunctior[] {
        let ret: Matchfunctior[] = []
        for (var [i, m] of matc.entries()) {
            for (var mii of expand_i(m.mstr)) {
                ret.push(new Matchfunctior(mii, m.func))
            }
        }

        return ret;
    }




    export function* genPattens_i(iline: ITerm[], matc: Matchfunctior[]) {
        let matc_ex: Matchfunctior[] = expand(matc)
        for (var [i, m] of matc_ex.entries()) {
            let anskitp = false
            for (var rr of genPattens_ii(iline, m.mstr)) {
                yield ([rr, m.func])
                anskitp = true
            }
            //if (anskitp) break
        }
    }


    export function* uparseString( line:string , pmatch:string  ){
        let sline = splitStringInput(line)
        for (var mii of expand_i(pmatch)){
            for (var rr of genPattens_ii(sline, mii)) {
                yield rr
            }
        }
    }

}