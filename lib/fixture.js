/**
 * Defers execution of some functions until something else 
 */
module.exports = Fixture;

function Fixture() {
    this.calls = [];
    this.deps = {};
}

Fixture.prototype.add = function (fn, dep, args) {
    this.calls.push({ f: fn, dep: dep, args: args });
    return this;
};

Fixture.prototype.run = function () {
    this.calls.forEach(run);
    return this;
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

    setImmediate.apply(null, [bind(f, this.dep[call.dep])].concat(call.args));
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