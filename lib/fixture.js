/**
 * Defers execution of some functions until something else 
 */
var when = require('when');
var EventEmitter = require('events').EventEmitter;
var uuid = require('node-uuid').v4;

module.exports = Fixture;

function Fixture(id) {
    this.calls = [];
    this.deps = {};
    this.id = id || uuid();

    EventEmitter.call(this);
}

Fixture.prototype = Object.create(EventEmitter.prototype);

Fixture.prototype.add = function (fn, dep, args) {
    this.calls.push({ f: fn, dep: dep, args: args });
    return this;
};

/**
 * Removes a call from the fixture
 * @param  {Function} fn  
 * @param  {String|}   dep 
 * @param  {Number}   num Number of occurrences to remove (default: all of them)
 * @return {this}
 */
Fixture.prototype.remove = function (fn, dep, filter) {
    var calls = this.calls;
    var call;
    var newcalls;
    var i;
    var tmp;
    var used;
    var n = calls.length;
    filter = 'function' === typeof filter ? filter : nop;

    while (n--) {
        call = calls[n];
        if (call.f === fn && call.dep === dep && filter(call.args)) {            
            newcalls = new Array(this.calls.length - 1);
            used = 0;
            for (i = 0, tmp = this.calls.length; i < tmp; i += 1) {
                if (this.calls[i] !== call) {
                    newcalls[used] = this.calls[i];
                    used += 1;
                }
            }

            this.calls = newcalls;
        }
    }


    return this;
};

Fixture.prototype.run = function () {
    //this.calls.forEach(run, this);
    return when.all(this.calls.map(run, this));
};

/**
 * Adds or updates a dependency
 * @param  {String} name  
 * @param  {Object} value 
 * @return {this}       
 */
Fixture.prototype.dep = function (name, value) {
    this.deps[name] = value;
    return this;
};

/**
 * Clears the fixture
 * @return {this} 
 */
Fixture.prototype.clean = function () {
    this.deps = {};
    this.calls = [];
    return this;
};


function run(call) {
    if (!call) {
        return;
    }
    var fn = call.f || nop;

    var dep = this.deps[call.dep];

    this.emit('run', fn, call.args);

    return dep[fn].apply(dep, call.args);
}

function nop() { return true; }

/**
 * Because `Function.prototype.bind` is slow
 * @param  {Function} fn  
 * @param  {Object}   ctx this value
 * @return {Function}       
 */
function bind(fn, ctx) {
    return function () {
        fn.apply(ctx, arguments);
    };
}