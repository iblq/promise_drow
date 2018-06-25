import test from 'ava'
import PPromise from '../lib/promise'

test('test resolve', t => {
  return PPromise.resolve(3).then(n => {
    t.is(n, 3)
  })
})

test('test reject', t => {
  return PPromise.reject('error').then().catch(err => {
    t.is(err, 'error')
  })
})

let promise1 = new PPromise(function (resolve, reject) {
  setTimeout(function () {
    resolve('success')
  }, 500)
})
let promise2 = new PPromise(function (resolve, reject) {
  setTimeout(function () {
    resolve('success2')
  }, 800)
})

test('test then', t => {
  return promise1.then(r => {
    t.is(r, 'success')
  })
})

test('test then chain', t => {
  return promise1.then(r => {
    return PPromise.resolve(r)
  }).then(r => {
    t.is(r, 'success')
  })
})

function setPromise(delay, err) {
  return new PPromise(function (resolve, reject) {
    setTimeout(function () {
      if (err) throw err
      return
      resolve(delay)
    })
  })
}

// test('test done', t => {
//   return setPromise(300).done(r => {
//     console.log(r);
//     // t.pass()
//   })
// })

// test('test done error', t => {
//   return setPromise(300, 'errmsg').done(r => {
//     console.log(r);
//   })
// })

test('test all', t => {
  let all = [promise1, promise2]

  return Promise.all(all).then(r => {
    t.is(r.length, 2)
  }).catch(err => {
  })
})
test('test all', t => {
  let all = [promise1, promise2]

  return Promise.race(all).then(r => {
    t.is(r, 'success')
  }).catch(err => {
  })
})