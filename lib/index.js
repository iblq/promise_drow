function PPromise(resolver) {
  let self = this

  self.status = 'pending' // fulfilled 或 rejected.
  self.fulfillEventQueue = []
  self.rejectEventQueue = []

  function resolve(value) {
 
    if (value instanceof PPromise) {
      return value.then(resolve, reject)
    }

    setTimeout(function () {
    
      if (self.status === 'pending') {
        self.status = 'fulfilled'
        self.data = value
     
        for (let fn of self.fulfillEventQueue) {
          fn(value)
        }
      }
    })
  }

  function reject(reason) {
    setTimeout(function () {
      if (self.status === 'pending') {
        self.status = 'rejected'
        self.data = reason

        for (let fn of self.rejectEventQueue) {
          fn(reason)
        }
      }
    })
  }

  try {
  
    resolver(resolve, reject)
  } catch (reason) {
    reject(reason)
  }
}

function analysis(promise2, x, resolve, reject) {
  let then
  let resolveOrReject = false

  if (promise2 === x) { // 如果promise 和 x 指向相同的值, 使用 TypeError做为原因将promise拒绝。
    return reject(new TypeError('error'))
  }

  /**
   * 如果x是pending状态，promise必须保持pending走到x fulfilled或rejected.
   * 如果x是fulfilled状态，将x的值用于fulfill promise.
   * 如果x是rejected状态, 将x的原因用于reject promise..
   */
  if (x instanceof PPromise) { // 如果 x 是一个promise
    if (x.status === 'pending') {
      x.then(function (v) {
        analysis(promise2, v, resolve, reject)
      }, reject)
    } else {
      x.then(resolve, reject)
    }
    return
  }
  /**
   * 如果x是一个对象或一个函数
   * 
   */

  if (x && ((typeof x === 'object') || (typeof x === 'function'))) {
    try {
      then = x.then

      /**
       * 如果 then 是一个函数， 
       * 以x为this调用then函数， 
       * 且第一个参数是resolvePromise，
       * 第二个参数是rejectPromise
       */

      if (typeof then === 'function') {
        then.call(x, function resolvePromise(y) {
          //如果 resolvePromise 和 rejectPromise 都被调用了，或者被调用了多次，则只第一次有效，后面的忽略。
          if (resolveOrReject) return
          resolveOrReject = true
          return analysis(promise2, y, resolve, reject)

        }, function rejectPromise(r) {
        
          if (resolveOrReject) return
          resolveOrReject = true
          return reject(r)

        })
      } else {
        resolve(x)
      }
    } catch (e) {
      if (resolveOrReject) return
      resolveOrReject = true
      return reject(e)
    }
  } else {
    resolve(x)
  }
}

PPromise.prototype.then = function (onFulfilled, onRejected) {
  let self = this
  let promise2
  /**
   * 如果onFulfilled不是一个函数，则忽略之。
   */
  onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : function (v) {
    return v
  }
  onRejected = typeof onRejected === 'function' ? onRejected : function (r) {
    throw r
  }

  if (self.status === 'fulfilled') {
    return promise2 = new PPromise(function (resolve, reject) {
      setTimeout(function () {
        try {
          let x = onFulfilled(self.data)
          analysis(promise2, x, resolve, reject)
        } catch (reason) {
          reject(reason)
        }
      })
    })
  }

  if (self.status === 'rejected') {
    return promise2 = new PPromise(function (resolve, reject) {
      setTimeout(function () {
        try {
          let x = onRejected(self.data)
          analysis(promise2, x, resolve, reject)
        } catch (reason) {
          reject(reason)
        }
      })
    })
  }

  if (self.status === 'pending') {
    return promise2 = new PPromise(function (resolve, reject) {
    
      self.fulfillEventQueue.push(function (value) {
        try {
          let x = onFulfilled(value)
          analysis(promise2, x, resolve, reject)
        } catch (r) {
          reject(r)
        }
      })

      self.rejectEventQueue.push(function (reason) {
        try {
          let x = onRejected(reason)
          analysis(promise2, x, resolve, reject)
        } catch (r) {
          reject(r)
        }
      })
    })
  }
}

PPromise.prototype.catch = function (onRejected) {
  return this.then(null, onRejected)
}

PPromise.resolve = function (value) {
  return new PPromise(function (resolve) {
    resolve(value)
  })
}

PPromise.reject = function (value) {
  return new PPromise(function (resolve, reject) {
    reject(value)
  })
}

PPromise.prototype.all = function (promiseArr) {
  return new PPromise(function (resolve, reject) {
    if (!isArray(promiseArr)) {
      return reject(new TypeError('arguments must be an array'));
    }
    var resolvedCounter = 0;
    var promiseNum = promiseArr.length;
    var resolvedValues = new Array(promiseNum);
    for (var i = 0; i < promiseNum; i++) {
      (function (i) {
        PPromise.resolve(promiseArr[i]).then(function (value) {
          resolvedCounter++
          resolvedValues[i] = value
          if (resolvedCounter == promiseNum) {
            return resolve(resolvedValues)
          }
        }, function (reason) {
          return reject(reason)
        })
      })(i)
    }
  })
}

PPromise.prototype.race = function (promiseArr) {
  return new PPromise(function (resolve, reject) {
    if (!isArray(promiseArr)) {
      return reject(new TypeError('arguments must be an array'));
    }

    for (var i = 0; i < promiseNum; i++) {
      (function (i) {
        PPromise.resolve(promiseArr[i]).then(function (value) {
          return resolve(value)
        }, function (reason) {
          return reject(reason)
        })
      })(i)
    }
  })
}


module.exports = PPromise