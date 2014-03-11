/**
 * Returns a function that invokes a callback w/error
 * node-style
 * @param  {Function} cb 
 * @return {Function}      
 */
exports.invokeErr = function (cb) {
    cb = cb || nop;
    return function (err) {
        return cb(err);
    };
};

/**
 * Simple bind implementation because function.bind is slow     
 * @param  {Function} cb 
 * @return {Function}
 */
exports.bind = function (cb, ctx) {
    cb = 'function' === typeof cb ? cb : nop;

    return function () {
        return cb.apply(ctx, arguments);
    };
};

/**
 * Special-case bind that avoids apply because args are filled in already
 * @param  {Function} cb  
 * @param  {Object}   ctx 
 * @return {Function}
 */
exports.bindCurried = function (cb, ctx) {
    cb = 'function' === typeof cb ? cb : nop;

    return function () {
        cb.call(ctx);
    };
};

/**
 * curry implementation
 * @param  {Function} fn   
 * @param  {Array|String|Number|Object}   args
 * @return {Function}
 */
exports.curry = function (fn, args) {
    if (typeof fn !== 'function') {
        throw new Error('Cannot curry a non-function!');
    }
 
    if (arguments.length > 2) {
        //more than 2 args? append, append!
        args = [].concat( [].slice.call(arguments, 1) );
    } else if (!Array.isArray(args)) {
        args = [args];
    }
 
    return function () {
        fn.apply(null, args.concat( [].slice.call(arguments, 0) ));
    };
};

function nop() {}