//runTime executor
function* combinations(acc, xs, n) {
    if (n == 1)
        yield acc.concat(xs);
    let m = xs.length;
    for (let i = 1; i < m; ++i) {
        let h = xs.slice(0, i);
        let accNext = acc.concat(h);
        let t = xs.slice(i, m);
        for (let tt of combinations(accNext, t, n - 1)) {
            yield tt;
        }
    }
    return [];
}
function parseAction(x, m) {
    let xs = x.split(" ");
    if (xs.length < m.length)
        return null;
}
class ActionCmd {
    func() { }
}
class RunTime {
    tryParseCmd(cmd) {
        for (let a in this.actions) {
        }
        return null;
    }
    Command(cmd) {
        let result = this.tryParseCmd(cmd);
    }
}
;
let ms = combinations([], ["a", "ball", "is", "an", "red", "thing"], 3);
console.log(ms);
//# sourceMappingURL=server.js.map