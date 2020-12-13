(function () {
  var isPromise = function isPromise (obj) {
    if ((obj !== null && typeof obj === 'object') || (typeof obj === 'function')) {
      if (typeof obj.then === 'function') {
        return true;
      }
    }
    return false;
  }

  function resolvePromsie (promiseNew, x, resolve, reject) {
    if (x === promiseNew) throw new TypeError('then的处理函数的返回值和then本身的返回值是一个promise，不可以');
    if ((x !== null && typeof x === 'object') || (typeof x === 'function')) {
      try {
        var then = x.then;
        if (typeof then === 'function') {
          then.call(x, resolve, reject);
        } else {
          resolve(x)
        }
      } catch (err) {
        reject(err)
      }
      return;
    }
    resolve(x);
  }

  var Promise = function Promise (executor) {
    if (typeof executor !== 'function') throw new TypeError(executor + ' 不是一个函数')
    var that = this;
    that.promiseState = 'pending';
    that.promiseResult = 'undefined';
    that.onfulfilledCallbacks = [];
    that.onrejectedCallbacks = [];

    var resolve = function resolve (result) {
      change('fulfilled', result);
    }
    var reject = function reject (reason) {
      change('rejected', reason)
    }
    var change = function change (state, result) {
      if (that.promiseState !== 'pending') return;
      that.promiseState = state;
      that.promiseResult = result;

      setTimeout(function () {
        var callbacks = that.promiseState === 'fulfilled' ? that.onfulfilledCallbacks : that.onrejectedCallbacks;
        for (var i = 0; i < callbacks.length; i++) {
          var item = callbacks[i];
          if (typeof item === 'function') {
            item(that.promiseResult);
          }
        }
      })
    }

    try {
      executor(resolve, reject);
    } catch (err) {
      change('rejected', err)
    }
  }

  Promise.prototype = {
    constructor: Promise,
    then: function (onfulfilled, onrejected) {
      if (typeof onfulfilled !== 'function') {
        onfulfilled = function onfulfilled (promiseResult) {
          return promiseResult;
        }
      }
      if (typeof onrejected !== 'function') {
        onrejected = function onrejected (promiseResult) {
          throw promiseResult;
        }
      }
      var that = this;
      var promiseNew = null;
      promiseNew = new Promise(function (resolve, reject) {
        switch (that.state) {
          case 'fulfilled':
            setTimeout(function () {
              try {
                var x = onfulfilled(that.promiseResult);
                resolvePromsie(promiseNew, x, resolve, reject);
              } catch (err) {
                reject(err);
              }
            });
            break;
          case 'rejected':
            setTimeout(function () {
              try {
                var x = onrejected(that.promiseResult);
                resolvePromsie(promiseNew, x, resolve, reject);
              } catch (err) {
                reject(err);
              }
            });
            break;
          default:
            that.onfulfilledCallbacks.push(function (promiseResult) {
              try {
                var x = onfulfilled(promiseResult);
                resolvePromsie(promiseNew, x, resolve, reject);
              } catch (err) {
                reject(err)
              }
            });
            that.onrejectedCallbacks.push(function (promiseResult) {
              try {
                var x = onrejected(promiseResult);
                resolvePromsie(promiseNew, x, resolve, reject);
              } catch (err) {
                reject(err)
              }
            })
        }
      });
      return promiseNew;
    },
    catch: function (onrejected) {
      var that = this;
      return that.then(null, onrejected);
    }
  }

  Promise.resolve = function resolve (promiseResult) {
    return new Promise(function (resolve) {
      resolve(promiseResult);
    });
  }

  Promise.reject = function reject (promiseResult) {
    return new Promise(function (_, reject) {
      reject(promiseResult);
    });
  }

  Promise.all = function all (promises) {
    return new Promise(function (resolve, reject) {
      try {
        var index = 0;
        var results = [];
        var len = promises.length;
        for (var i = 0; i < len; i++) {
          (function (i) {
            var item = promises[i];
            if (!isPromise(item)) {
              index++;
              results[i] = item;
              index === len ? resolve(results) : null;
              return;
            }
            item.then(function (result) {
              index++;
              results[i] = result;
              index === len ? resolve(results) : null;
            }, function (reason) {
              reject(reason);
            })
          })(i);
        }
      } catch (err) {
        reject(err);
      }
    })
  }

  if (typeof window !== 'undefined') {
    window.Promise = Promise;
  }

  if (typeof module === 'object' && typeof module.export === 'object') {
    module.export = Promise;
  }
})();

function queryData () {
  return new Promise(resolve => {
    let xhr = new XMLHttpRequest;
    xhr.open('get', 'http://127.0.0.1:8888/user/list');
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4 && xhr.status === 200) {
        let result = JSON.parse(xhr.responseText)
        resolve(result)
      }
    }
    xhr.send(null);
  })
}

queryData().then(resolve => {
  console.log(resolve)
})