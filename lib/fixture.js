/**
 * Defers execution of some functions until something else 
 * @type {[type]}
 */
module.exports = FnBuffer;

function Fixture() {
    this.calls = [];
}

Fixture.prototype.add = function (fn, ctx, args) {
    this.calls.push({ f: bind(fn, ctx), args: args });
    return this;
};

Fixture.prototype.run = function () {
    this.calls.forEach(run);
    return this;
};


function run(call) {
    if (!call) {
        return;
    }

    var fn = call.f || nop;

    setImmediate.apply(call.f, call.args);
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