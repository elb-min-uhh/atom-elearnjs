'use strict';

const PromiseCounter = require("../../src/util/PromiseCounter.js");

/**
* Creates `count` Promises.
* @param count: integer of how many promises to create
* @param resolving: bool, if true promises will resolve, if false they
*                   will reject with a dummy error.
* @param timeoutMin: timeout of the first Promise
* @param timeoutMax (optional): timeout of the last Promise, other promises
*                   will be interpolated.
*/
var createPromises = function(count, resolving, timeoutMin, timeoutMax) {
    var timeoutBase = timeoutMin ? timeoutMin : 0;
    var timeoutStep = 0;
    if(count > 1 && timeoutMax) timeoutStep = (timeoutMax - timeoutBase) / (count - 1);

    var promises = [];

    for(var i=0; i<count; i++) {
        var promise = new Promise((resolve, reject) => {
            if(resolving) setTimeout(resolve, timeoutBase + (i*timeoutStep));
            else setTimeout(reject, timeoutBase + (i*timeoutStep));
        });
        promises.push(promise);
    }

    return promises;
}

module.exports.resolvedPromises = (test) => {
    var promises = createPromises(20, true, 0, 5000);

    test.expect(1);

    var counter = new PromiseCounter(promises);
    counter.then(() => {
            test.ok(true);
            test.done();
        }, (err) => {
            throw "Promises not correctly resolved.";
            test.done();
        });
}

module.exports.rejectedPromises = (test) => {
    var promises = createPromises(20, false, 0, 5000);

    test.expect(1);

    var counter = new PromiseCounter(promises, 10000);
    counter.then(() => {
            throw "Promises not correctly rejected.";
            test.done();
        }, (err) => {
            test.ok(true);
            test.done();
        });
}

module.exports.oneTimeouted = (test) => {
    var timeout = 1250;
    var promises = createPromises(20, true, 0, 1000);

    promises.push(new Promise((resolve, reject) => {
        setTimeout(resolve, 2000);
    }));

    test.expect(1);

    var counter = new PromiseCounter(promises, timeout);
    counter.then(() => {
            throw "Promises not correctly rejected.";
            test.done();
        }, (err) => {
            test.equals(err, `Timeout in PromiseCounter after ${timeout} ms.`);
            test.done();
        });
}

module.exports.allTimeouted = (test) => {
    var timeout = 500;
    var promises = createPromises(20, true, 1000, 5000);

    test.expect(1);

    var counter = new PromiseCounter(promises, timeout);
    counter.then(() => {
            throw "Promises not correctly rejected.";
            test.done();
        }, (err) => {
            test.equals(err, `Timeout in PromiseCounter after ${timeout} ms.`);
            test.done();
        });
}

module.exports.incorrectInit = (test) => {
    test.expect(1);

    test.throws(() => {
        new PromiseCounter();
    }, "No promise array given.");

    test.done();
}
