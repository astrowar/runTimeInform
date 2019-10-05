(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],2:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],3:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],4:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":3,"_process":1,"inherits":2}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("util");
var GTems;
(function (GTems) {
    class GBase {
    }
    GTems.GBase = GBase;
    function isValidAtomName(pstr) {
        for (var c of pstr) {
            if (";.,()[]|&".indexOf(c) >= 0) {
                return false;
            }
        }
        return true;
    }
    class Functor extends GBase {
        constructor(predname, ...arg1) {
            super();
            if (isValidAtomName(predname) == false) {
                throw new Error('name invalid for pred ' + predname);
            }
            this.name = predname;
            this.args = arg1;
        }
        toString() {
            let arr = (this.args.map((x) => { return x.toString(); }));
            return this.name + "(" + arr.join(" , ") + ")";
        }
        clone() { return new Functor(this.name), this.args.map((x) => x.clone()); }
    }
    GTems.Functor = Functor;
    class Atom extends GBase {
        constructor(atm_name) {
            super();
            if (atm_name == "true") {
                throw new Error(' invalid atom name ');
            }
            if (atm_name == "false") {
                throw new Error(' invalid atom name ');
            }
            if (isValidAtomName(atm_name) == false) {
                throw new Error('name invalid for atom ' + atm_name);
            }
            this.name = atm_name;
        }
        toString() { return this.name; }
        clone() { return new Atom(this.name); }
    }
    GTems.Atom = Atom;
    class Variable extends GBase {
        constructor(v_name) {
            super();
            if (isValidAtomName(v_name) == false) {
                throw new Error('name invalid for pred ' + v_name);
            }
            this.name = v_name;
        }
        toString() { return "$" + this.name; }
        clone() { return new Variable(this.name); }
    }
    GTems.Variable = Variable;
    class VariableBind extends GBase {
        constructor(v_name) {
            super();
            this.binded = undefined;
            if (isValidAtomName(v_name) == false) {
                throw new Error('name invalid for pred ' + v_name);
            }
            this.name = v_name;
        }
        toString() {
            let r = "$" + this.name;
            if (util_1.isUndefined(this.binded))
                return r;
            r = r + "==" + this.binded.toString();
        }
        clone() { return new VariableBind(this.name); }
    }
    GTems.VariableBind = VariableBind;
    class GValue extends GBase {
    }
    GTems.GValue = GValue;
    class LiteralStr extends GValue {
        constructor(lit_str) {
            super();
            this.value = lit_str;
        }
        toString() { return '"' + this.value + '"'; }
        clone() { return new LiteralStr(this.value); }
    }
    GTems.LiteralStr = LiteralStr;
    class LiteralNumber extends GValue {
        constructor(lit_num) {
            super();
            this.value = lit_num;
        }
        toString() {
            let r = this.value.toString();
            return r;
        }
        clone() { return new LiteralNumber(this.value); }
    }
    GTems.LiteralNumber = LiteralNumber;
    class LiteralBool extends GValue {
        constructor(lit_bol) {
            super();
            this.value = lit_bol;
        }
        toString() { return '?' + this.value; }
        clone() { return new LiteralBool(this.value); }
    }
    GTems.LiteralBool = LiteralBool;
    class GList extends GValue {
        constructor(_items) {
            super();
            this.items = _items;
        }
        toString() {
            let r = "[" + (this.items.map((x) => { return x.toString(); })).join(" , ") + "]";
            return r;
        }
        clone() { return new GList(this.items.map((x) => x.clone())); }
    }
    GTems.GList = GList;
    function atom_false() { return new GTems.LiteralBool(false); }
    GTems.atom_false = atom_false;
    function atom_true() { return new GTems.LiteralBool(true); }
    GTems.atom_true = atom_true;
    function isEqually(x, y) {
        let s1 = x.toString();
        let s2 = y.toString();
        if (s1 == s2)
            return true;
        return false;
    }
    GTems.isEqually = isEqually;
    function isEquallyNumber(x, y) {
        if (x.value == y.value)
            return true;
        return false;
    }
    GTems.isEquallyNumber = isEquallyNumber;
})(GTems = exports.GTems || (exports.GTems = {}));

},{"util":4}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const atoms_1 = require("./atoms");
const solution_1 = require("./solution");
const util_1 = require("util");
var Interp;
(function (Interp) {
    class PredicateEntry {
        constructor(unique_name, entry, value, condition, prior) {
            this.unique_name = unique_name;
            this.entry = entry;
            this.value = value;
            this.condition = condition;
            this.prior = prior;
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
                if (util_1.isUndefined(arg0) == false)
                    if (atoms_1.GTems.isEqually(cv.arg[0], arg0) == false)
                        continue;
                if (util_1.isUndefined(arg1) == false)
                    if (atoms_1.GTems.isEqually(cv.arg[1], arg1) == false)
                        continue;
                if (util_1.isUndefined(arg2) == false)
                    if (atoms_1.GTems.isEqually(cv.arg[2], arg2) == false)
                        continue;
                if (util_1.isUndefined(arg3) == false)
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
        if (a.prior > b.prior)
            return prior_A;
        if (a.prior < b.prior)
            return prior_B;
        if (util_1.isUndefined(a.condition) == false && util_1.isUndefined(b.condition))
            return prior_A;
        if (util_1.isUndefined(b.condition) == false && util_1.isUndefined(a.condition))
            return prior_B;
        let cp_a = getComplexity(a.entry);
        let cp_b = getComplexity(b.entry);
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
            this.predicades_id = 1;
        }
        addPredicateFunc(p, code, condition, prioridade) {
            let unique_name = p.name + this.predicades_id.toString();
            this.predicades_id++;
            console.log(code);
            this.predicades.unshift(new PredicateEntry(unique_name, p, code, condition, prioridade));
            this.predicades = this.predicades.sort((a, b) => { return predicateEntryOrder(a, b); });
            return true;
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
        *query_append(sol, q1, q2) {
            if (q1 instanceof atoms_1.GTems.GList) {
                let qcopy = q1.clone();
                qcopy.items.push(q2);
                yield solution_1.Solution.fuse(sol, new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, qcopy, {}));
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
                    for (var qz of this.evaluate_query(stk, solution_1.Solution.fuse(qsol, sol), q2)) {
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
            // console.dir(q, { depth: null })
            let sol = new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_true(), {});
            let stk = new QueryStack();
            let r = [];
            for (var qz of this.query(stk, sol, q)) {
                if (solution_1.Solution.isValid(qz)) {
                    r.push(qz);
                }
            }
            // console.log("solutions:")
            // console.dir( r, { depth: null })
            return r;
        }
        *query(stk, sol, q) {
            // console.log("...")
            // console.dir(q, { depth: null })
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
            if (q instanceof atoms_1.GTems.GList) {
                yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, q, {});
                return;
            }
            console.log("undefined term :", q);
            //throw new Error('Unassigned Term Evaluator');
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
            }
            if (code instanceof atoms_1.GTems.Variable) {
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
        //buildIn Predicates
        *buildIn_add(stk, sol, arg1, arg2) {
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
                            let r = new atoms_1.GTems.LiteralNumber(v1.value.value + v2.value.value);
                            yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, r, {});
                        }
                    }
                }
            }
            return new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QFalse, atoms_1.GTems.atom_false(), {});
        }
        *buildIn_minus(stk, sol, arg1, arg2) {
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
                            let r = new atoms_1.GTems.LiteralNumber(v1.value.value - v2.value.value);
                            yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, r, {});
                        }
                    }
                }
            }
            return new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QFalse, atoms_1.GTems.atom_false(), {});
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
        *buildIn_gt(stk, sol, arg1, arg2) {
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
                            if (v1.value.value > v2.value.value) {
                                yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, new atoms_1.GTems.LiteralBool(true), {});
                            }
                            else {
                                yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QFalse, new atoms_1.GTems.LiteralBool(false), {});
                            }
                        }
                    }
                }
            }
            return new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QFalse, atoms_1.GTems.atom_false(), {});
        }
        *buildIn_lt(stk, sol, arg1, arg2) {
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
                            if (v1.value.value < v2.value.value) {
                                yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, new atoms_1.GTems.LiteralBool(true), {});
                            }
                            else {
                                yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QFalse, new atoms_1.GTems.LiteralBool(false), {});
                            }
                        }
                    }
                }
            }
            //  return new Solution.Solution(Solution.SolutionState.QFalse, GTems.atom_false(), {})
        }
        *buildIn_mul(stk, sol, arg1, arg2) {
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
                            let vv = (v1.value.value * v2.value.value);
                            yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, new atoms_1.GTems.LiteralNumber(vv), {});
                        }
                    }
                }
            }
            // return new Solution.Solution(Solution.SolutionState.QFalse, GTems.atom_false(), {})
        }
        *buildIn_head(stk, sol, arg1, arg2) {
            //arg1 nao rh uma variavel ..bind o argumento para o valor dela ..senao,bind na saida
            let sol_next = new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_true(), {});
            // if (this.isVar(arg1)) new Solution.Solution(Solution.SolutionState.QFalse, GTems.atom_false(), {})
            if (this.isVar(arg2)) {
                console.log("Warring: head of a unbound variable is not possible");
                // yield new Solution.Solution(Solution.SolutionState.QFalse, GTems.atom_false(), {})
            }
            if (arg2 instanceof atoms_1.GTems.GList) {
                if (arg2.items.length > 0) {
                    let head = arg2.items[0];
                    let s = solution_1.Solution.bind(sol, head, arg1);
                    yield s;
                }
            }
            // return new Solution.Solution(Solution.SolutionState.QFalse, GTems.atom_false(), {})
        }
        *buildIn_tail(stk, sol, arg1, arg2) {
            //arg1 nao rh uma variavel ..bind o argumento para o valor dela ..senao,bind na saida
            let sol_next = new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_true(), {});
            // if (this.isVar(arg1)) new Solution.Solution(Solution.SolutionState.QFalse, GTems.atom_false(), {})
            if (this.isVar(arg2)) {
                console.log("Warring: tail of a unbound variable is not possible");
                //yield new Solution.Solution(Solution.SolutionState.QFalse, GTems.atom_false(), {})
            }
            if (arg2 instanceof atoms_1.GTems.GList) {
                if (arg2.items.length > 0) {
                    let tail = arg2.clone();
                    tail.items.shift();
                    let s = solution_1.Solution.bind(sol, tail, arg1);
                    yield s;
                }
            }
            //return new Solution.Solution(Solution.SolutionState.QFalse, GTems.atom_false(), {})
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
                console.log("Warring: maplist of a unbound predicate is not possible");
                yield new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QFalse, atoms_1.GTems.atom_false(), {});
            }
            if (this.isVar(arg2)) {
                console.log("Warring: maplist of a unbound input list is not possible");
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
            for (var s of this.query_ar3_inner(stk, sol, f_name, _arg1, _arg2, _arg3)) {
                yield s;
                if (solution_1.Solution.isValid(s))
                    hasY = true;
            }
            if (hasY == false && f_name.startsWith("ULS") == false) {
                for (var sq of this.query_ar3_inner(stk, sol, "ULS" + f_name, _arg1, _arg2, _arg3)) {
                    yield sq;
                }
            }
            return;
        }
        *query_ar3_inner(stk, sol, f_name, _arg1, _arg2, _arg3) {
            for (var x1 of this.evaluate_query(stk, sol, _arg1)) {
                if (solution_1.Solution.isValid(x1)) {
                    let nsol = solution_1.Solution.fuse(sol, x1);
                    for (var x2 of this.evaluate_query(stk, nsol, _arg2)) {
                        if (solution_1.Solution.isValid(x2)) {
                            let nsol2 = solution_1.Solution.fuse(nsol, x2);
                            for (var x3 of this.evaluate_query(stk, nsol2, _arg3)) {
                                if (solution_1.Solution.isValid(x3)) {
                                    let nsol3 = solution_1.Solution.fuse(nsol2, x3);
                                    for (var z of this.query_ar3_inner_argv(stk, nsol3, f_name, x1.value, x2.value, x3.value)) {
                                        yield z;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        *query_ar3_inner_argv(stk, sol, f_name, _arg1, _arg2, _arg3) {
            if (util_1.isArray(_arg1))
                _arg1 = _arg1[0];
            if (util_1.isArray(_arg2))
                _arg2 = _arg2[0];
            if (util_1.isArray(_arg3))
                _arg3 = _arg3[0];
            let arg1 = _arg1;
            let arg2 = _arg2;
            let arg3 = _arg3;
            let hasFound = false;
            let query_satisf = false;
            for (var [i, p] of this.predicades.entries()) {
                // if (query_satisf)  continue
                if (p.entry.name != f_name)
                    continue;
                let pp = p.entry;
                if (pp instanceof atoms_1.GTems.Functor) {
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
                        sol_next = solution_1.Solution.bind(sol_next, pa0, arg1);
                    }
                    if (this.isVar(arg2) == false) {
                        sol_next = solution_1.Solution.bind(sol_next, pa1, arg2);
                    }
                    if (this.isVar(arg3) == false) {
                        sol_next = solution_1.Solution.bind(sol_next, pa2, arg3);
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
                                sol_n = solution_1.Solution.bind(sol_n, v_ret, arg1);
                        }
                        if (solution_1.Solution.isValid(sol_n) == false)
                            continue;
                        if (this.isVar(arg2)) //arg1 eh uma variavel ? bind para o resultado 
                         {
                            let v_ret = solution_1.Solution.getValue(sol_next_inner, pa1);
                            if (util_1.isUndefined(v_ret) == false)
                                sol_n = solution_1.Solution.bind(sol_n, v_ret, arg2);
                        }
                        if (solution_1.Solution.isValid(sol_n) == false)
                            continue;
                        if (this.isVar(arg3)) //arg1 eh uma variavel ? bind para o resultado 
                         {
                            let v_ret = solution_1.Solution.getValue(sol_next_inner, pa2);
                            if (util_1.isUndefined(v_ret) == false)
                                sol_n = solution_1.Solution.bind(sol_n, v_ret, arg3);
                        }
                        if (solution_1.Solution.isValid(sol_n) == false)
                            continue;
                        query_satisf = true;
                        let ret = sol_n.add_value(sol_next_inner);
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
            }
            if (f_name.startsWith("ULS") == false)
                if (hasFound == false) {
                    console.log("Predicate " + f_name + "/3  not found ");
                }
        }
        *query_ar2(stk, sol, f_name, _arg1, _arg2) {
            let hasY = false;
            for (var s of this.query_ar2_inner(stk, sol, f_name, _arg1, _arg2)) {
                yield s;
                if (solution_1.Solution.isValid(s))
                    hasY = true;
            }
            if (hasY == false && f_name.startsWith("ULS") == false) {
                for (var sq of this.query_ar2_inner(stk, sol, "ULS" + f_name, _arg1, _arg2)) {
                    yield sq;
                }
            }
            return;
        }
        *query_ar2_inner(stk, sol, f_name, _arg1, _arg2) {
            for (var x1 of this.evaluate_query(stk, sol, _arg1)) {
                if (solution_1.Solution.isValid(x1)) {
                    let nsol = solution_1.Solution.fuse(sol, x1);
                    for (var x2 of this.evaluate_query(stk, nsol, _arg2)) {
                        if (solution_1.Solution.isValid(x2)) {
                            let nsol2 = solution_1.Solution.fuse(nsol, x2);
                            for (var z of this.query_ar2_inner_argv(stk, nsol2, f_name, x1.value, x2.value)) {
                                yield z;
                            }
                        }
                    }
                }
            }
        }
        *query_ar2_inner_argv(stk, sol, f_name, _arg1, _arg2) {
            if (util_1.isArray(_arg1))
                _arg1 = _arg1[0];
            if (util_1.isArray(_arg2))
                _arg2 = _arg2[0];
            let arg1 = _arg1;
            let arg2 = _arg2;
            if (f_name == "unify") {
                var bvar = solution_1.Solution.bind(sol, arg1, arg2);
                yield bvar;
                return;
            }
            if (f_name == "equal") {
                var bvar_e = solution_1.Solution.bind(sol, arg1, arg2);
                if (solution_1.Solution.isValid(bvar_e))
                    yield new solution_1.Solution.Solution(bvar_e.state, atoms_1.GTems.atom_true(), {});
                else
                    yield new solution_1.Solution.Solution(bvar_e.state, atoms_1.GTems.atom_false(), {});
                return;
            }
            if (f_name == "append") {
                for (var qq of this.query_append(sol, arg1, arg2)) {
                    yield qq;
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
            let hasFound = false;
            let query_satisf = false;
            for (var [i, p] of this.predicades.entries()) {
                // if (query_satisf)  continue
                if (p.entry.name != f_name)
                    continue;
                let pp = p.entry;
                if (pp instanceof atoms_1.GTems.Functor) {
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
                        sol_next = solution_1.Solution.bind(sol_next, pa0, arg1);
                    }
                    if (this.isVar(arg2) == false) {
                        sol_next = solution_1.Solution.bind(sol_next, pa1, arg2);
                    }
                    // testa a condicao de ativacao do predicado
                    let cond_satisf = true;
                    if (util_1.isUndefined(p.condition) == false) {
                        cond_satisf = false;
                        //testa a condicao
                        for (var sol_cond of this.evaluate_query(stk_next, sol_next, p.condition)) {
                            if (solution_1.Solution.isValid(sol_cond)) {
                                cond_satisf = true;
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
                                sol_n = solution_1.Solution.bind(sol_n, v_ret, arg1);
                        }
                        if (solution_1.Solution.isValid(sol_n) == false)
                            continue;
                        if (this.isVar(arg2)) //arg1 eh uma variavel ? bind para o resultado 
                         {
                            let v_ret = solution_1.Solution.getValue(sol_next_inner, pa1);
                            if (util_1.isUndefined(v_ret) == false)
                                sol_n = solution_1.Solution.bind(sol_n, v_ret, arg2);
                        }
                        if (solution_1.Solution.isValid(sol_n) == false)
                            continue;
                        query_satisf = true;
                        let ret = sol_n.add_value(sol_next_inner);
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
            }
            if (f_name.startsWith("ULS") == false)
                if (hasFound == false) {
                    console.log("Predicate " + f_name + "/2  not found ");
                }
        }
        *query_ar1(stk, sol, f_name, _arg1) {
            let hasY = false;
            for (var s of this.query_ar1_inner(stk, sol, f_name, _arg1)) {
                yield s;
                if (solution_1.Solution.isValid(s))
                    hasY = true;
            }
            if (hasY == false && f_name.startsWith("ULS") == false) {
                for (var sq of this.query_ar1_inner(stk, sol, "ULS" + f_name, _arg1)) {
                    yield sq;
                }
            }
            return;
        }
        *query_ar1_inner(stk, sol, f_name, _arg1) {
            for (var x1 of this.evaluate_query(stk, sol, _arg1)) {
                if (solution_1.Solution.isValid(x1)) {
                    let nsol = solution_1.Solution.fuse(sol, x1);
                    for (var z of this.query_ar1_inner_argv(stk, nsol, f_name, x1.value)) {
                        yield z;
                    }
                }
            }
        }
        *query_ar1_inner_argv(stk, sol, f_name, _arg1) {
            if (util_1.isArray(_arg1))
                _arg1 = _arg1[0];
            let arg1 = _arg1;
            let value_1 = Array.from(this.evaluate_query(stk, sol, _arg1)).filter((x) => solution_1.Solution.isValid(x)).map((c) => c.value);
            if (value_1.length > 1) {
                for (var [i, q_arg1] of value_1.entries()) {
                    for (var r_arg1 of this.query_ar1_inner(stk, sol, f_name, q_arg1))
                        yield r_arg1;
                }
                return;
            }
            if (value_1.length > 0)
                arg1 = value_1[0];
            else
                arg1 = atoms_1.GTems.atom_false();
            //let arg1 = getValue(sol, _arg1)
            //if (isUndefined(arg1)) arg1 = _arg1
            let query_satisf = false;
            let hasFound = false;
            for (var [i, p] of this.predicades.entries()) {
                // if (query_satisf) continue
                if (p.entry.name != f_name)
                    continue;
                let pp = p.entry;
                if (pp instanceof atoms_1.GTems.Functor) {
                    if (pp.args.length != 1)
                        continue;
                    let pa0 = pp.args[0];
                    if (util_1.isArray(pa0))
                        pa0 = pa0[0];
                    hasFound = true;
                    if (stk.contains(p.unique_name, arg1)) {
                        console.log("Block ");
                        continue; //nao tenta de novo se ja estiver tetando dar query no mesmo predicado e nos mesmo parametros
                    }
                    // console.log("pass " ,p.unique_name ,arg1 )  
                    let stk_next = stk.pushCall(p.unique_name, arg1);
                    //arg1 nao rh uma variavel ..bind o argumento para o valor dela ..senao,bind na saida
                    let sol_next = new solution_1.Solution.Solution(solution_1.Solution.SolutionState.QTrue, atoms_1.GTems.atom_true(), {});
                    if (this.isVar(arg1) == false) {
                        sol_next = solution_1.Solution.bind(sol_next, pa0, arg1);
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
                                let sol_n = solution_1.Solution.bind(sol, v_ret, arg1);
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
                }
            }
            //yield new Solution.Solution(Solution.SolutionState.QFalse, GTems.atom_false(), {})
            if (f_name.startsWith("ULS") == false)
                if (hasFound == false) {
                    console.log("Predicate " + f_name + "/1  not found ");
                }
        }
    } //class
    Interp.Context = Context;
})(Interp = exports.Interp || (exports.Interp = {})); //namespace

},{"./atoms":5,"./solution":9,"util":4}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("util");
/// <reference path="./mterms.ts" />
//import * as mterms from "./mterms";
const mterms_1 = require("./mterms");
const atoms_1 = require("./atoms");
const interp_1 = require("./interp");
var parseString = mterms_1.UTerm.parseString;
var splitStringInput = mterms_1.UTerm.splitStringInput;
class Parser {
}
var SyntaxParser;
(function (SyntaxParser) {
    class Matchfunctior {
        constructor(mstr, func) {
            this.mstr = mstr;
            this.func = func;
        }
    }
    function* genPattens_ii(iline, matc) {
        {
            for (var vqxxxx of parseString(iline, matc)) {
                let vxxx = vqxxxx;
                let q = {};
                for (var sxxx of vxxx.entries()) {
                    q[sxxx[0]] = sxxx[1];
                    //yield sxxx
                }
                yield q;
            }
        }
        return;
    }
    class MFragmentKind {
        constructor(txt, optional) {
            this.txt = txt;
            this.optional = optional;
            if (this.optional) {
                if (this.txt[0] == '(') {
                    this.txt = this.txt.slice(1, this.txt.length - 1);
                }
            }
        }
    }
    function find_end_term(m, j) {
        let n = m.length;
        let p = 0;
        for (let i = j; i < n; ++i) {
            if ((m[i] == ' ') && (p == 0))
                return i;
            if (m[i] == '(')
                p = p + 1;
            if (m[i] == ')') {
                if (p == 1)
                    return i + 1;
                p = p - 1;
            }
        }
        return n;
    }
    function classifySegments(m) {
        let n = m.length;
        let terms = [];
        let i = 0;
        let pivot = 0;
        while (i < n) {
            if (m[i] == '?') {
                if (i - 1 > pivot)
                    terms.push(new MFragmentKind(m.slice(pivot, i - 1), false));
                let j = find_end_term(m, i + 1);
                terms.push(new MFragmentKind(m.slice(i + 1, j), true));
                pivot = j;
            }
            i++;
        }
        if (n > pivot)
            terms.push(new MFragmentKind(m.slice(pivot, n), false));
        return terms;
    }
    function* expand_rem(acc, rem) {
        if (rem.length == 0) {
            yield acc.join(" ");
        }
        else {
            let acc_nex = acc.concat([rem[0].txt]);
            for (var x of expand_rem(acc_nex, rem.slice(1))) {
                yield x;
            }
            if (rem[0].optional) {
                for (var x of expand_rem(acc, rem.slice(1))) {
                    yield x;
                }
            }
        }
    }
    function* expand_i(m) {
        //separa em fix segments e optional  
        let n = m.length;
        let terms = classifySegments(m);
        for (var mx of expand_rem([], terms)) {
            yield mx;
        }
        //yield m
    }
    function expand(matc) {
        let ret = [];
        for (var [i, m] of matc.entries()) {
            for (var mii of expand_i(m.mstr)) {
                ret.push(new Matchfunctior(mii, m.func));
            }
        }
        return ret;
    }
    function* genPattens_i(iline, matc) {
        let matc_ex = expand(matc);
        for (var [i, m] of matc_ex.entries()) {
            let anskitp = false;
            for (var rr of genPattens_ii(iline, m.mstr)) {
                yield ([rr, m.func]);
                anskitp = true;
            }
            //if (anskitp) break
        }
    }
    function resolve_as(args) {
        let codeexpr = Array.from(codebodyMatch(args));
        if (codeexpr.length > 0)
            return codeexpr[0];
        //aqui ..................esta o problema das EXP dentro das Expo
        let q = args.map(function (t) { return t.getGeneralTerm(); });
        return q;
    }
    function isBalanced(x) {
        let n = x.length;
        var x_par = 0;
        var x_bra = 0;
        var x_str = false;
        for (var i = 0; i < n; ++i) {
            if (x[i].txt == ")")
                x_par = x_par - 1;
            if (x[i].txt == "(")
                x_par = x_par + 1;
            if (x[i].txt == "]")
                x_bra = x_bra - 1;
            if (x[i].txt == "[")
                x_bra = x_bra + 1;
            if (x[i].txt === '"')
                x_str = !x_str;
            if (x_par < 0)
                return false;
            if (x_bra < 0)
                return false;
        }
        if (x_par !== 0)
            return false;
        if (x_bra !== 0)
            return false;
        if (x_str == true)
            return false;
        return true;
    }
    function resolve_args(args) {
        if (isBalanced(args) == false)
            return undefined;
        let arg_b = [];
        let acc = [];
        let n = args.length;
        let args_c = splitTerms(args, ",");
        for (var [i, ac] of args_c.entries()) {
            let rac = resolve_as(ac);
            arg_b.push(rac);
        }
        // for (var i = 0; i < n; i++)
        // {
        //     if (args[i].isLiteral() ==false && args[i].gettext() == ",") {
        //         if (acc.length > 0) arg_b.push(resolve_as(acc))
        //         acc = []
        //     }
        //     else {
        //         acc.push(args[i])
        //     }
        // }
        // if (acc.length > 0) arg_b.push(resolve_as(acc))
        return arg_b;
    }
    function isValidAtomName(pname) {
        if (pname.length != 1)
            return false;
        let pstr = (pname.map(function (t) { return t.gettext(); })).join();
        for (var c of pstr) {
            if (";.,()[]|&+-*/".indexOf(c) >= 0) {
                return false;
            }
        }
        return true;
    }
    function funct_resolve(pname, args) {
        if (pname.length != 1)
            return undefined;
        let arg_a = resolve_args(args);
        if (util_1.isUndefined(arg_a))
            return undefined;
        if (isValidAtomName(pname) == false)
            return undefined;
        let patm = pname[0].getGeneralTerm();
        return new atoms_1.GTems.Functor(patm.toString(), ...arg_a);
    }
    function* funct_0(args_dict) {
        let pname = args_dict["$funct"];
        return pname[0].getGeneralTerm();
        if (isValidAtomName(pname)) {
            yield new atoms_1.GTems.Atom(pname[0].gettext());
        }
    }
    function* funct_1(args_dict) {
        yield funct_resolve(args_dict["$funct"], args_dict["$A"]);
    }
    function* funct_2(args_dict) {
        let pname = args_dict["$funct"];
        if (pname.length != 1)
            return undefined;
        //let arg_a = args_dict["$A"].map(function (t: ITerm) {      return t.gettext();       });
        //let arg_b = args_dict["$B"].map(function (t: ITerm) { return t.gettext(); });
        let p = funct_resolve(pname, [args_dict["$A"], args_dict["$B"]]);
        if (p != null)
            yield p;
        //yield new GTems.Functor(pname[0].gettext(), arg_a, arg_b)        
    }
    function* funct_and(args_dict) {
        let pname1 = args_dict["$funct1"];
        if (pname1.length != 1)
            return undefined;
        let pname2 = args_dict["$funct2"];
        if (pname2.length != 1)
            return undefined;
        let arg_1 = args_dict["$args1"];
        let arg_2 = args_dict["$args2"];
        let p1 = funct_resolve(pname1, arg_1);
        if (util_1.isUndefined(p1))
            return undefined;
        let p2 = funct_resolve(pname2, arg_2);
        if (util_1.isUndefined(p2))
            return undefined;
        yield new atoms_1.GTems.Functor("and", p1, p2);
    }
    function* funct_rem(args_dict) {
        let pname1 = args_dict["$funct1"];
        if (pname1.length != 1)
            return undefined;
        let arg_1 = args_dict["$args1"];
        let p1 = funct_resolve(pname1, arg_1);
        if (util_1.isUndefined(p1))
            return undefined;
        for (var pnext of predDecl(args_dict["$rem"])) {
            if (util_1.isUndefined(pnext))
                continue;
            yield new atoms_1.GTems.Functor("and", p1, pnext);
        }
        return;
    }
    function* funct_rem_or(args_dict) {
        let pname1 = args_dict["$funct1"];
        if (pname1.length != 1)
            return undefined;
        let arg_1 = args_dict["$args1"];
        let p1 = funct_resolve(pname1, arg_1);
        if (util_1.isUndefined(p1))
            return undefined;
        for (var pnext of predDecl(args_dict["$rem"])) {
            if (util_1.isUndefined(pnext))
                continue;
            yield new atoms_1.GTems.Functor("or", p1, pnext);
        }
        return;
    }
    function* predDecl(args) {
        let basePathens = [
            new Matchfunctior("$funct1 ( $args1 ) , $funct2 ( $args2 )", funct_and),
            new Matchfunctior("$funct1 ( $args1 ) , $rem", funct_rem),
            new Matchfunctior("$funct1 ( $args1 ) | $rem", funct_rem_or),
            //new Matchfunctior("$funct ( $A , $B )", funct_2),
            new Matchfunctior("$funct ( $A )", funct_1),
            new Matchfunctior("$funct", funct_0)
        ];
        for (var vj of genPattens_i(args, basePathens)) {
            // for (var vv of vj[1](vj[0])) {
            //     if (isUndefined(vv) == false) 
            //     {
            //         yield vv
            //         break
            //     }
            // }
            let pool = [];
            for (var vv of vj[1](vj[0])) {
                if (util_1.isUndefined(vv) == false) {
                    pool.push(vv);
                }
                else {
                    pool = []; //um termo nao deu certo .. invalida toda sequencia
                    break;
                }
            }
            //alimanta saida dos termos
            for (var [i, vv] of pool.entries())
                yield vv;
            if (pool.length > 0)
                break;
        }
    }
    // Serarate Terms by
    function splitTerms(x, sep) {
        let r = [];
        let acc = [];
        let n = x.length;
        var x_par = 0;
        var x_bra = 0;
        var x_str = false;
        for (var i = 0; i < n; ++i) {
            if (x[i].txt == ")")
                x_par = x_par - 1;
            if (x[i].txt == "(")
                x_par = x_par + 1;
            if (x[i].txt == "]")
                x_bra = x_bra - 1;
            if (x[i].txt == "[")
                x_bra = x_bra + 1;
            if (x[i].txt === '"')
                x_str = !x_str;
            if (x_bra == 0 && x_par == 0 && x_str == false) {
                if (x[i].txt === sep) {
                    if (acc.length > 0)
                        r.push(acc);
                    acc = [];
                    continue;
                }
            }
            acc.push(x[i]);
        }
        if (acc.length > 0)
            r.push(acc);
        return r;
    }
    //==============================================================================================
    function* expr_inner(args_dict) {
        let pname = args_dict["$X"];
        if (util_1.isUndefined(pname))
            return undefined;
        for (var cy of codebodyMatch(pname))
            yield cy;
    }
    function* expr_and(args_dict) {
        let x = args_dict["$X"];
        let y = args_dict["$Y"];
        for (var cx of codebodyMatch(x)) {
            if (util_1.isUndefined(cx))
                continue;
            for (var cy of codebodyMatch(y)) {
                if (util_1.isUndefined(cy))
                    continue;
                yield new atoms_1.GTems.Functor("and", cx, cy);
            }
        }
    }
    function* expr_or(args_dict) {
        let x = args_dict["$X"];
        let y = args_dict["$Y"];
        for (var cx of codebodyMatch(x)) {
            if (util_1.isUndefined(cx))
                continue;
            for (var cy of codebodyMatch(y)) {
                if (util_1.isUndefined(cy))
                    continue;
                yield new atoms_1.GTems.Functor("or", cx, cy);
            }
        }
    }
    function* expr_xy_operator(op_name, args_dict) {
        let x = args_dict["$X"];
        let y = args_dict["$Y"];
        for (var cx of codebodyMatch(x)) {
            if (util_1.isUndefined(cx))
                continue;
            for (var cy of codebodyMatch(y)) {
                if (util_1.isUndefined(cy))
                    continue;
                yield new atoms_1.GTems.Functor(op_name, cx, cy);
            }
        }
    }
    function* expr_plus(args_dict) {
        for (var x of expr_xy_operator("plus", args_dict))
            yield x;
    }
    function* expr_minus(args_dict) {
        for (var x of expr_xy_operator("minus", args_dict))
            yield x;
    }
    function* expr_GT(args_dict) {
        for (var x of expr_xy_operator(">", args_dict))
            yield x;
    }
    function* expr_LT(args_dict) {
        for (var x of expr_xy_operator("<", args_dict))
            yield x;
    }
    function* expr_GTE(args_dict) {
        for (var x of expr_xy_operator(">=", args_dict))
            yield x;
    }
    function* expr_LTE(args_dict) {
        for (var x of expr_xy_operator("<=", args_dict))
            yield x;
    }
    function* expr_MUL(args_dict) {
        for (var x of expr_xy_operator("*", args_dict))
            yield x;
    }
    function* expr_DIV(args_dict) {
        for (var x of expr_xy_operator("/", args_dict))
            yield x;
    }
    function* expr_UNIFY(args_dict) {
        for (var x of expr_xy_operator("unify", args_dict))
            yield x;
    }
    function* expr_EQUAL(args_dict) {
        for (var x of expr_xy_operator("equal", args_dict))
            yield x;
    }
    function* expr_funct(args_dict) {
        let fname = args_dict["$funct"];
        if (fname.length != 1)
            return undefined;
        let fargs = args_dict["$args"];
        let p1 = funct_resolve(fname, fargs);
        yield p1;
    }
    function* expr_atorm_reserv(value) {
        if (value == "false")
            yield new atoms_1.GTems.LiteralBool(false);
        else if (value == "true")
            yield new atoms_1.GTems.LiteralBool(true);
        else
            yield new atoms_1.GTems.Atom(value);
    }
    function* expr_lst(args_dict) {
        let x = args_dict["$X"];
        if (util_1.isUndefined(x)) {
            yield new atoms_1.GTems.GList([]); //empty list
            return;
        }
        let xs = splitTerms(x, ",");
        let lst_x = [];
        for (var [i, xj] of xs.entries()) {
            for (var cx of codebodyMatch(xj)) {
                if (util_1.isUndefined(cx)) {
                    return;
                }
                lst_x.push(cx);
                break;
            }
            yield new atoms_1.GTems.GList(lst_x);
        }
    }
    function* expr_literal(args_dict) {
        let x = args_dict["$X"];
        if (x.length == 1) {
            let n = Number(x[0].txt);
            if (isNaN(n) == false) {
                yield new atoms_1.GTems.LiteralNumber(n);
                return;
            }
        }
        if (x.length == 1)
            yield x[0].getGeneralTerm();
    }
    function* codebodyMatch(args) {
        let basePathens = [
            new Matchfunctior("{ $X }", expr_inner),
            new Matchfunctior("true", (x) => { return expr_atorm_reserv("true"); }),
            new Matchfunctior("false", (x) => { return expr_atorm_reserv("false"); }),
            new Matchfunctior("fail", (x) => { return expr_atorm_reserv("fail"); }),
            new Matchfunctior("done", (x) => { return expr_atorm_reserv("done"); }),
            new Matchfunctior("!", (x) => { return expr_atorm_reserv("cut"); }),
            new Matchfunctior("$X , $Y", expr_and),
            new Matchfunctior("$X ; $Y", expr_or),
            new Matchfunctior("$X = = $Y", expr_EQUAL),
            new Matchfunctior("$X = $Y", expr_UNIFY),
            new Matchfunctior("$X + $Y", expr_plus),
            new Matchfunctior("$X - $Y", expr_minus),
            new Matchfunctior("$X > $Y", expr_GT),
            new Matchfunctior("$X < $Y", expr_LT),
            new Matchfunctior("$X > = $Y", expr_GTE),
            new Matchfunctior("$X < = $Y", expr_LTE),
            new Matchfunctior("$X * $Y", expr_MUL),
            new Matchfunctior("$X / $Y", expr_DIV),
            new Matchfunctior("$funct ( $args )", expr_funct),
            new Matchfunctior("[ $X ]", expr_lst),
            new Matchfunctior("[ ]", expr_lst),
            new Matchfunctior("$X ", expr_literal)
        ];
        for (var vj of genPattens_i(args, basePathens)) {
            let pool = [];
            for (var vv of vj[1](vj[0])) {
                if (util_1.isUndefined(vv) == false) {
                    pool.push(vv);
                }
                else {
                    pool = []; //um termo nao deu certo .. invalida toda sequencia
                    break;
                }
            }
            //alimanta saida dos termos
            for (var [i, vv] of pool.entries())
                yield vv;
            if (pool.length > 0)
                break;
        }
    }
    function* codeBody(y) {
        //maior e mais complexa funcao
        for (var cy of codebodyMatch(y)) {
            yield cy;
        }
    }
    function syntax_xyz(args_dict, reFunc) {
        let x = args_dict["$X"];
        let y = args_dict["$Y"];
        let z = args_dict["$Z"];
        for (var px of predDecl(x)) {
            for (var cy of codeBody(y)) {
                for (var cz of codeBody(z)) {
                    reFunc(px, cy, cz, 0);
                    return true;
                }
            }
        }
        return false;
    }
    function syntax_xy(args_dict, reFunc) {
        let x = args_dict["$X"];
        let y = args_dict["$Y"];
        for (var px of predDecl(x)) {
            for (var cy of codeBody(y)) {
                // console.dir([px, cy, []], { depth: null })
                reFunc(px, cy, undefined, 0);
                return true;
            }
        }
        return false;
    }
    function syntax_x(args_dict, reFunc) {
        let x = args_dict["$X"];
        for (var px of predDecl(x)) {
            //console.dir([px, [], []], { depth: null })
            reFunc(px, new atoms_1.GTems.LiteralBool(true), undefined, 0);
            return true;
        }
        return false;
    }
    function unless_xyz(args_dict, reFunc) {
        return syntax_xyz(args_dict, (p, body, cond, pr) => { p.name = "ULS" + p.name; reFunc(p, body, cond, pr - 1000); });
    }
    function unless_xy(args_dict, reFunc) {
        return syntax_xy(args_dict, (p, body, cond, pr) => { p.name = "ULS" + p.name; reFunc(p, body, cond, pr - 1000); });
    }
    function unless_x(args_dict, reFunc) {
        return syntax_x(args_dict, (p, body, cond, pr) => { p.name = "ULS" + p.name; reFunc(p, body, cond, pr - 1000); });
    }
    function syntax_xyz_low(args_dict, reFunc) {
        return syntax_xyz(args_dict, (p, body, cond, pr) => { reFunc(p, body, cond, pr - 1000); });
    }
    function syntax_xy_low(args_dict, reFunc) {
        return syntax_xy(args_dict, (p, body, cond, pr) => { reFunc(p, body, cond, pr - 1000); });
    }
    function syntax_x_low(args_dict, reFunc) {
        return syntax_x(args_dict, (p, body, cond, pr) => { reFunc(p, body, cond, pr - 1000); });
    }
    function syntax_xyz_high(args_dict, reFunc) {
        return syntax_xyz(args_dict, (p, body, cond, pr) => { reFunc(p, body, cond, pr + 1000); });
    }
    function syntax_xy_high(args_dict, reFunc) {
        return syntax_xy(args_dict, (p, body, cond, pr) => { reFunc(p, body, cond, pr + 1000); });
    }
    function syntax_x_high(args_dict, reFunc) {
        return syntax_x(args_dict, (p, body, cond, pr) => { reFunc(p, body, cond, pr + 1000); });
    }
    function before_x(args_dict, reFunc) {
        return syntax_x(args_dict, reFunc);
    }
    function before_xy(args_dict, reFunc) {
        return syntax_xy(args_dict, reFunc);
    }
    function before_xyz(args_dict, reFunc) {
        return syntax_xyz(args_dict, reFunc);
    }
    function linesSplit(xcode) {
        let n = xcode.length;
        let xc = "";
        let xcs = [];
        let p = 0;
        for (var i = 0; i < n; ++i) {
            if (xcode[i] == "{") {
                p = p + 1;
            }
            if (xcode[i] == "}") {
                p = p - 1;
            }
            if (p < 0)
                return undefined; //error
            if (xcode[i] == "\n") {
                if (p == 0) {
                    if (xc.length > 0)
                        xcs.push(xc);
                    xc = "";
                }
                else {
                    xc = xc + " \n ";
                }
            }
            else {
                xc = xc + xcode[i];
            }
        }
        if (xc.length > 0)
            xcs.push(xc);
        return xcs;
    }
    function MatchSyntaxDecl(xcode, resolutionFunc) {
        let basePathens = [
            new Matchfunctior("do -  $X as $Y if $Z", syntax_xyz_low),
            new Matchfunctior("do -  $X as $Y ", syntax_xy_low),
            new Matchfunctior("do -  $X  ", syntax_x_low),
            new Matchfunctior("do +  $X as $Y if $Z", syntax_xyz_high),
            new Matchfunctior("do +  $X as $Y ", syntax_xy_high),
            new Matchfunctior("do +  $X  ", syntax_x_high),
            new Matchfunctior("do  $X as $Y if $Z", syntax_xyz),
            new Matchfunctior("do  $X as $Y ", syntax_xy),
            new Matchfunctior("do  $X  ", syntax_x),
            new Matchfunctior("do  $X as $Y if $Z", syntax_xyz),
            new Matchfunctior("do  $X as $Y ", syntax_xy),
            new Matchfunctior("do  $X  ", syntax_x),
            new Matchfunctior("unless  $X as $Y if $Z", unless_xyz),
            new Matchfunctior("unless  $X as $Y ", unless_xy),
            new Matchfunctior("unless  $X  ", unless_x),
            new Matchfunctior("do  $X  ?.", syntax_x),
            new Matchfunctior("before  $X as  $Y if $Z", before_xyz),
            new Matchfunctior("before  $X as  $Y ", before_xy),
            new Matchfunctior("before  $X ", before_x)
        ];
        let xlines = linesSplit(xcode);
        for (var [i, iline] of xlines.entries()) {
            let sline = splitStringInput(iline);
            for (var vj of genPattens_i(sline, basePathens)) {
                let has_code = vj[1](vj[0], resolutionFunc);
                if (has_code)
                    break;
            }
        }
    }
    SyntaxParser.MatchSyntaxDecl = MatchSyntaxDecl;
    function MatchSyntaxGoal(xcode, resolutionFunc) {
        let xlines = linesSplit(xcode);
        for (var [i, iline] of xlines.entries()) {
            let sline = splitStringInput(iline);
            for (var px of codebodyMatch(sline)) {
                let s = resolutionFunc(px);
                break;
            }
        }
    }
    SyntaxParser.MatchSyntaxGoal = MatchSyntaxGoal;
})(SyntaxParser || (SyntaxParser = {}));
let ancode = `
do lit($r),Room($r) as true if contains($r,$d), lit($d)
do class(Thing).
do class(Room).
do Thing(  book).
do Localtion(  book) as limbo
do Room(limbo).

//condicao default de todas as salas
do lit(Room) as false.    
 
do lit(flashlight) as on(flashlight)
do on(flashlight) as state(flashlight, on)
do state(flashlight, on|off) 
do desc(flashlight) as "an flashligh,usefull for lit "

`;
let rulecodes = ` 
do Thing($obj),concealed($obj) | visible($obj) as true

      do  concealed($obj) as false if discovered($obj)
      do  concealed($obj) as true if carried($obj,$person),wear($person,something),small($obj)
      do  concealed($obj) as false  
      do  look($obj) as {
          print("Message");
          score := score + 1
      }
//understand "flash" or "light" as flashlight. 
do alias("flash","flashlight").
do alias("light","flashlight") .

do alias("the flashlight",flashlight).
do state(flashlight,lit|unlit).

do state(flashlight) as unlit.

do action(finding).
do command("find [something]") as finding.

carry_out  finding(flashlight) as { 
    if location(player)==location(flashlight) {
       move( flashlight, player)
       now( flashlight, lit)
       say("You grope around in the darkness, find the flashlight and turn it back on.") 
       action_stop()
     }

before going(south,Lighted Area) as {
    say "you need to take the flashlight before traveling into the dark.";
    action_stop()
   }  if location(player)!=location(flashlight)  
`;
let prices = `

    do price_contents($obj) as {  $contents = findall($x, inside($x ,$obj)) ,  maplist( price, $contents, $prices ) , sum($prices)   }  if container($obj)

    const price_teasure as 10
    const price_to_clean as 2

    do- price($obj) as 0
    do price($obj) as price_teasure if Teasure(obj)    
    do price($obj) as { price($obj) + price_contents($obj)  }  if Container($obj)
    do price($obj) as { price($obj) - price_to_clean }  if dirt($obj)
    do+ price($obj) as {  max( 0 , price($obj) )  } 
    


    `;
let simple = `

do r( a,b,1).
do r( b,c,1).
do r( c,d,2).
do r( d,f,1).
do r( a,e,5).
do r( e,f,5).

unless r($x,$y,$c) as r($x,$z,$c1),r($z,$y,$c2), $c =   +1
 
 
`;
let ctx = new interp_1.Interp.Context();
SyntaxParser.MatchSyntaxDecl(simple, (x, y, z, prio) => { return ctx.addPredicateFunc(x, y, z, prio); });
console.log("______________________________");
SyntaxParser.MatchSyntaxGoal(" r( a,f,$c)   ", (x) => { console.dir(ctx.all_query(x).map((s) => { return s.toString(); }), { depth: null }); });
console.log("______________________________");
console.log('end log');

},{"./atoms":5,"./interp":6,"./mterms":8,"util":4}],8:[function(require,module,exports){
"use strict";
/// <reference path="./atoms.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
const atoms_1 = require("./atoms");
var UTerm;
(function (UTerm) {
    class MatchTerm {
    }
    class MatchVar extends MatchTerm {
        constructor(_vname) {
            super();
            this.vname = _vname;
        }
    }
    ;
    class MatchLiteral extends MatchTerm {
    }
    ;
    class MatchStringLiteral extends MatchLiteral {
        constructor(_str) {
            super();
            this.str = _str;
        }
    }
    class VarAssigned {
        constructor(_var_name, _value) {
            this.var_name = _var_name;
            this.value = _value;
        }
        toString() { return this.var_name + ":" + this.value; }
    }
    class MatchResult {
        // public result: boolean
        //public vars: VarAssignedList
        constructor(result, vars = []) {
            this.result = result;
            this.vars = vars;
            // this.result = result;
            // this.vars = vars;
        }
        *entries() {
            for (var [i, s] of this.vars.entries()) {
                yield [s.var_name, s.value];
            }
            return;
        }
        add(other) {
            if ((this.result == false) || (other.result == false)) {
                return new MatchResult(false, []);
            }
            return new MatchResult(true, this.vars.concat(other.vars));
        }
    }
    UTerm.MatchResult = MatchResult;
    function isMatch(x, m) {
        //return new MatchResult(true)
        if (m instanceof MatchStringLiteral) {
            if (x.length == 1) {
                return new MatchResult(x[0].gettext() === m.str);
            }
        }
        if (m instanceof MatchVar) {
            let mv = m;
            if (isBalanced(x)) {
                return new MatchResult(true, [new VarAssigned(m.vname, x)]);
            }
        }
        return new MatchResult(false);
    }
    function isBalanced(h) {
        let eq = 0;
        let bq = 0;
        let cq = 0;
        for (var [i, x] of h.entries()) {
            if (x.gettext() == "(")
                eq = eq + 1;
            if (x.gettext() == ")")
                eq = eq - 1;
            if (x.gettext() == "[")
                bq = bq + 1;
            if (x.gettext() == "]")
                bq = bq - 1;
            if (x.gettext() == "{")
                cq = cq + 1;
            if (x.gettext() == "}")
                cq = cq - 1;
            if (eq < 0)
                return false;
            if (bq < 0)
                return false;
            if (cq < 0)
                return false;
        }
        return eq == 0;
    }
    function* combinations(acc, xs, ms) {
        let n = ms.length;
        if (n == 1) {
            let r = isMatch(xs, ms[0]);
            if (r.result) {
                yield acc.add(r);
            }
            return;
        }
        let m = xs.length;
        if (m < n)
            return;
        for (let i = 1; i < m; ++i) {
            let h = xs.slice(0, i);
            let rx = isMatch(h, ms[0]);
            if (rx.result) {
                // let accNext = acc.concat([h])
                let accNext = acc.add(rx);
                let t = xs.slice(i, m);
                var mstail = ms.slice(1);
                for (let tt of combinations(accNext, t, mstail)) {
                    yield tt;
                }
            }
        }
        return;
    }
    //function termParser(x: string): MatchTerm {
    //if (x[0] === x.toUpperCase() && x.length < 3) {
    //    return new MatchVar(x)
    //}
    function termParser(x) {
        if (x[0] === "$") {
            return new MatchVar(x);
        }
        return new MatchStringLiteral(x);
        //return new MatchTerm()
    }
    let CODEST;
    (function (CODEST) {
        CODEST[CODEST["SCODE"] = 0] = "SCODE";
        CODEST[CODEST["SLITERAL"] = 1] = "SLITERAL";
    })(CODEST || (CODEST = {}));
    class ITerm {
        constructor(_txt) { this.txt = _txt; }
        gettext() { return this.txt; }
        ;
        getGeneralTerm() { return null; }
        isLiteral() { return false; }
    }
    UTerm.ITerm = ITerm;
    class TermCode extends ITerm {
        constructor(_txt) { super(_txt); }
        isLiteral() { return false; }
        getGeneralTerm() {
            if (this.txt == "true") {
                return new atoms_1.GTems.LiteralBool(true);
            }
            if (this.txt == "false") {
                return new atoms_1.GTems.LiteralBool(false);
            }
            if (this.txt[0] == "$") {
                return new atoms_1.GTems.Variable((this.txt.slice(1)));
            }
            if (this.txt == "!") {
                return new atoms_1.GTems.Atom("cut");
            }
            {
                let n = Number(this.txt);
                if (isNaN(n) == false)
                    return new atoms_1.GTems.LiteralNumber(n);
            }
            return new atoms_1.GTems.Atom(this.txt);
        }
    }
    class TermLiteral extends ITerm {
        constructor(_txt) { super(_txt); }
        getGeneralTerm() { return new atoms_1.GTems.LiteralStr(this.txt); }
        isLiteral() { return true; }
    }
    function splitStringInput(x) {
        let state = CODEST.SCODE;
        let terms = [];
        let acc = "";
        let n = x.length;
        for (var i = 0; i < n; ++i) {
            let c = x[i];
            if (state == CODEST.SCODE) {
                if (c == '"') {
                    if (acc.length > 0)
                        terms.push(new TermCode(acc));
                    acc = "";
                    state = CODEST.SLITERAL;
                    continue;
                }
                if (c == ' ') {
                    if (acc.length > 0)
                        terms.push(new TermCode(acc));
                    acc = "";
                    continue;
                }
                if ((",;(){}|\n[].+-*/!#=><").indexOf(c) >= 0) {
                    if (acc.length > 0)
                        terms.push(new TermCode(acc));
                    terms.push(new TermCode(c));
                    acc = "";
                    continue;
                }
                else {
                    acc = acc + c;
                }
            }
            if (state == CODEST.SLITERAL) {
                if (c == '"') {
                    if (acc.length > 0)
                        terms.push(new TermLiteral(acc));
                    acc = "";
                    state = CODEST.SCODE;
                    continue;
                }
                else {
                    acc = acc + c;
                }
            }
        }
        if (state == CODEST.SCODE)
            if (acc.length > 0)
                terms.push(new TermCode(acc));
        if (state == CODEST.SLITERAL)
            if (acc.length > 0)
                terms.push(new TermLiteral(acc));
        return terms;
    }
    UTerm.splitStringInput = splitStringInput;
    function* parseString(xs, mstr) {
        //let xs = x.split(" ");
        //xs = xs.filter(Boolean);
        let m = mstr.split(" ");
        m = m.filter(Boolean);
        if (xs.length < m.length)
            return;
        let ret = [];
        var mterm = m.map(function (x) {
            return termParser(x);
        });
        for (let t of combinations(new MatchResult(true, []), xs, mterm)) {
            yield t;
        }
        return;
    }
    UTerm.parseString = parseString;
})(UTerm = exports.UTerm || (exports.UTerm = {}));

},{"./atoms":5}],9:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const atoms_1 = require("./atoms");
const util_1 = require("util");
var Solution;
(function (Solution_1) {
    // a clause foi provada .. foi disprovada
    // ou nao da para responder
    let SolutionState;
    (function (SolutionState) {
        SolutionState[SolutionState["QTrue"] = 0] = "QTrue";
        SolutionState[SolutionState["QFalse"] = 1] = "QFalse";
        SolutionState[SolutionState["QFail"] = 2] = "QFail";
        SolutionState[SolutionState["QCut"] = 3] = "QCut";
        SolutionState[SolutionState["QUndefined"] = 4] = "QUndefined";
    })(SolutionState = Solution_1.SolutionState || (Solution_1.SolutionState = {}));
    class Solution {
        constructor(state, value, var_values) {
            this.state = SolutionState.QUndefined;
            this.var_values = {};
            this.value = undefined;
            this.state = state;
            this.var_values = var_values;
            this.value = value;
            if ((value instanceof atoms_1.GTems.GBase) == false) {
                throw new Error('invalid value term');
            }
            if ((util_1.isObject(var_values)) == false) {
                throw new Error('invalid var_value term');
            }
        }
        add(var_name, value) {
            let nsol = new Solution(this.state, this.value, {});
            for (var i in this.var_values) {
                nsol.var_values[i] = this.var_values[i];
            }
            nsol.var_values[var_name] = value;
            return nsol;
        }
        add_value(value) {
            let nsol = new Solution(this.state, value.value, {});
            for (var i in this.var_values) {
                nsol.var_values[i] = this.var_values[i];
            }
            if (value.state == SolutionState.QCut)
                nsol.state = SolutionState.QCut;
            return nsol;
        }
        toString() {
            let s = this.value.toString();
            if (Object.keys(this.var_values).length > 0) {
                s += " { ";
                for (var kv in this.var_values) {
                    s += kv.toString() + ":" + this.var_values[kv].toString() + " ";
                }
                s += " } ";
            }
            return s;
        }
    }
    Solution_1.Solution = Solution;
    function isValid(a) {
        if (a.state == SolutionState.QTrue)
            return true;
        if (a.state == SolutionState.QCut)
            return true;
        if (a.state == SolutionState.QFalse)
            return false;
        if (a.state == SolutionState.QFail)
            return false;
        throw new Error("invalid state");
    }
    Solution_1.isValid = isValid;
    //mantem o segundo termo como valor
    function fuse(a, b) {
        if (isValid(a) == false)
            return a;
        if (isValid(b) == false)
            return b;
        var s = new Solution(b.state, b.value, {});
        if (b.value instanceof atoms_1.GTems.Atom)
            if (b.value.name == "cut")
                s = new Solution(SolutionState.QCut, a.value, {});
        if (a.value instanceof atoms_1.GTems.Atom)
            if (a.value.name == "cut")
                s = new Solution(SolutionState.QCut, b.value, {});
        for (var i in a.var_values) {
            s.var_values[i] = a.var_values[i];
        }
        for (var i in b.var_values) {
            s.var_values[i] = b.var_values[i];
        }
        return s;
    }
    Solution_1.fuse = fuse;
    class SolutionGroup {
        constructor() {
            this.solution = [];
        }
    }
    //retorna o valor da variavel em questao .. retorna ATOM ou undefined
    function getBindValue(sol, x) {
        let v = getBindTail(sol, x);
        return getBindVarValue(sol, v);
    }
    function getValue(sol, x) {
        if (x instanceof atoms_1.GTems.Variable) {
            {
                let v = getBindTail(sol, x);
                return getBindVarValue(sol, v);
            }
        }
        return x;
    }
    Solution_1.getValue = getValue;
    function getBindVarValue(sol, x) {
        for (var i in sol.var_values) {
            if (i == x.name) {
                let value_bind = sol.var_values[i];
                if (value_bind instanceof atoms_1.GTems.Variable) {
                    return undefined;
                }
                else {
                    return value_bind;
                }
            }
        }
        return undefined;
    }
    function getBindTail(sol, x, deep = 0) {
        if (deep > 300)
            return x;
        for (var i in sol.var_values) {
            if (i == x.name) {
                let value_bind = sol.var_values[i];
                if (value_bind instanceof atoms_1.GTems.Variable) {
                    if (value_bind.name == x.name)
                        return x; // fundo do poco .. eu mesmo
                    return getBindTail(sol, value_bind, deep + 1);
                }
                else {
                    return x; //esta anexado ao bind de uma variable
                }
            }
        }
        return x; //nao tem bind
    }
    function bindVar(sol, x, y) {
        if (y instanceof atoms_1.GTems.Variable) {
            return bindVarVar(sol, x, y);
        }
        // bind da variavel e retorna nova solucao derivada 
        let xx = getBindTail(sol, x);
        let value_binded = getBindVarValue(sol, xx);
        if (util_1.isUndefined(value_binded)) {
            let vname = xx.name;
            return sol.add(vname, y);
        }
        if (atoms_1.GTems.isEqually(value_binded, y)) {
            return sol;
        }
        return new Solution(SolutionState.QFalse, atoms_1.GTems.atom_false(), {});
    }
    function bindVarVar(sol, x, y) {
        if (x.name == y.name)
            return sol;
        let xx = getBindTail(sol, x);
        let yy = getBindTail(sol, y);
        let x_value = getBindVarValue(sol, xx);
        let y_value = getBindVarValue(sol, yy);
        if (util_1.isUndefined(x_value)) {
            return sol.add(xx.name, y);
        }
        if (util_1.isUndefined(y_value)) {
            return sol.add(yy.name, x);
        }
        //nenhum dos ois eh indefinido 
        if (atoms_1.GTems.isEqually(x_value, y_value)) {
            return sol;
        }
        return new Solution(SolutionState.QFalse, atoms_1.GTems.atom_false(), {});
    }
    function bind(sol, x, y) {
        if (isValid(sol) == false)
            return sol; //nem tenta
        if (util_1.isArray(y))
            return bind(sol, x, y[0]);
        if (util_1.isArray(x))
            return bind(sol, x[0], y);
        if (x instanceof atoms_1.GTems.LiteralNumber) {
            if (y instanceof atoms_1.GTems.LiteralNumber) {
                if (atoms_1.GTems.isEquallyNumber(x, y))
                    return sol;
                else
                    return new Solution(SolutionState.QFalse, atoms_1.GTems.atom_false(), {});
            }
        }
        if (x instanceof atoms_1.GTems.GList) {
            if (y instanceof atoms_1.GTems.GList) {
                if (x.items.length != y.items.length)
                    return new Solution(SolutionState.QFalse, atoms_1.GTems.atom_false(), {});
                let sol_n = fuse(sol, new Solution(SolutionState.QTrue, atoms_1.GTems.atom_true(), {}));
                let n = x.items.length;
                for (var i = 0; i < n; ++i) {
                    sol_n = bind(sol_n, x.items[i], y.items[i]);
                    if (sol_n.state != SolutionState.QTrue)
                        break;
                }
                return sol_n;
            }
        }
        if (x instanceof atoms_1.GTems.LiteralBool) {
            if (y instanceof atoms_1.GTems.LiteralBool) {
                if (x.value == y.value)
                    return sol;
                else
                    return new Solution(SolutionState.QFalse, atoms_1.GTems.atom_false(), {});
            }
        }
        if (x instanceof atoms_1.GTems.GValue) {
            if (y instanceof atoms_1.GTems.Variable) {
                return bindVar(sol, y, x);
            }
        }
        if (x instanceof atoms_1.GTems.Variable) {
            if (y instanceof atoms_1.GTems.GValue) {
                return bindVar(sol, x, y);
            }
        }
        if (x instanceof atoms_1.GTems.Atom) {
            if (y instanceof atoms_1.GTems.Atom) {
                if (atoms_1.GTems.isEqually(x, y))
                    return sol;
                else
                    return new Solution(SolutionState.QFalse, atoms_1.GTems.atom_false(), {});
            }
            if (y instanceof atoms_1.GTems.Variable) {
                return bindVar(sol, y, x);
            }
        }
        if (x instanceof atoms_1.GTems.Variable) {
            if (y instanceof atoms_1.GTems.Atom) {
                return bindVar(sol, x, y);
            }
            if (y instanceof atoms_1.GTems.Variable) {
                return bindVarVar(sol, y, x);
            }
        }
        return new Solution(SolutionState.QFalse, atoms_1.GTems.atom_false(), {});
    }
    Solution_1.bind = bind;
})(Solution = exports.Solution || (exports.Solution = {}));

},{"./atoms":5,"util":4}]},{},[7]);
