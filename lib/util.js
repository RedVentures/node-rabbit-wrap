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


function nop() {}