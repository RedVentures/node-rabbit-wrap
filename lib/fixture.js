/**
 * Defers execution of some functions until something else 
 */
var when = require('when');
var EventEmitter = require('events').EventEmitter;

module.exports = Fixture;

function Fixture() {
    this.calls = [];
    this.deps = {};

    EventEmitter.call(this);
}

Fixture.prototype = Object.create(EventEmitter.prototype);

Fixture.prototype.add = function (fn, dep, args) {
    this.calls.push({ f: fn, dep: dep, args: args });
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


function run(call) {
    if (!call) {
        return;
    }

    var fn = call.f || nop;

    var dep = this.deps[call.dep];

    return dep[fn].apply(dep, call.args);
}

function nop() {}

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