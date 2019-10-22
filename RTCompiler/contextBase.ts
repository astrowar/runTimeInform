import { GTems } from "./atoms";
import { Solution } from "./solution";
import { isUndefined, isArray, isObject } from "util";
import { MParse } from "./parse";
import { QueryStack as QS } from "./querystack";
import { BuildIns } from "./buildin";


import QueryStack = QS.QueryStack;

 export interface ContextBase {
     evaluate_query(stk: QueryStack, sol: Solution.Solution, code: GTems.GBase ) ;
     bind(sol: Solution.Solution, v1: GTems.GBase, v2: GTems.GBase): Solution.Solution ;
     warring( msg:string) ;
     apply_rec(stk: QueryStack, sol: Solution.Solution, acc: GTems.GBase[], args: GTems.GBase[], func) ;

}