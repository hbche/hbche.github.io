---
# layout: page
title: Promise详解
date: 2023-01-31 11:46:20
categories: [前端]
tags: [ES6, Promise]
toc: true
---

## 前言

Promise 是 ES6 异步编程的核心，很多库的异步都从回调向 Promise 转变，Promise 在前端领域发挥着越来越重要的作用；掌握 Promise 的正确使用、理解 Promise 的实现成为了现代前端开发者不可或缺的技能。

<!--
### Promise 是什么

### Promise 如何使用

### Promise 什么场景|时候使用
-->

## Promise 的核心原理实现

首先我们从 Promise 的定义和使用方式开始分析 Promise。

### Promise 的使用分析

Promise 是一个类，在执行这个类的时候，需要传递一个执行器参数，执行器会立即执行。

#### Promise 的三个状态

- pending → 等待
- fulfilled → 成功
- rejected → 失败

#### 状态切换

- pending → fulfilled
- pending → rejected

#### 一旦状态发生改变，状态将不可变

- 执行器中的两个参数，分别是 resolve 和 reject，其实就是两个回调函数，调用 resolve 是从 pending 状态转变为 fulfilled 状态，调用 reject 是从 pending 状态转变为 rejected 状态。传递给这两个回调函数的参数会作为成功或失败的值。
- Promise 实例对象具有一个 then 方法，该方法接受两个回调函数，分别来处理成功与失败的状态，then 方法内部会进行判断，然后根据当前的状态调用对应的回调函数。then 方法应该是被定义在原型对象中的。
- then 的回调函数中都包含一个值，如果是成功，表示成功后返回的值；如果是失败，就表示失败的原因。

### MyPromise 的实现

根据上述分析，我们可以给出如下实现：

```js
// 所有状态
const PENDING = 'pending';
const FULFILLED = 'fulfilled';
const REJECTED = 'rejected';

// Promise 本质上是一个类
class MyPromise {
  constructor(executor) {
    // 实例化Promise时需要一个执行器回调，该回调立即执行
    executor(this.resolve, this.reject);
  }

  //   Promise 的初始状态;
  status = PENDING;
  // 记录成功与失败的值
  value = undefined;
  reason = undefined;

  // 此处使用箭头函数为了解决resolve调用中this的指向问题
  resolve = (value) => {
    // 如果状态不是 PENDING 直接跳出该逻辑
    if (this.status !== PENDING) return;
    // 将状态修改为 成功
    this.status = FULFILLED;

    // 将 resolve 回调的参数进行保存
    this.value = value;
  };

  reject = (reason) => {
    if (this.status !== PENDING) return;

    // 将状态修改为失败
    this.status = REJECTED;

    // 保存失败的原因
    this.reason = reason;
  };

  then = (onFulfilled, onRejected) => {
    // 根据当前状态指定回调
    if (this.status === FULFILLED) {
      // 将成功的值作为回调函数的参数返回
      onFulfilled(this.value);
    } else if (this.status === REJECTED) {
      // 将失败的值作为回调函数的参数返回
      onRejected(this.reason);
    }
  };
}
```

接下来我们给出一段验证代码：

**验证 resolve**

```js
const MyPromise = require('./my-promise');

const promise = new MyPromise((resolve, reject) => {
  resolve('Hello Promise Resolve~');
});
promise.then(
  (value) => {
    console.log(value);
  },
  (reason) => {
    console.log(reason);
  }
);

// Hello Promise Resolve~
```

**验证 reject**

```js
const MyPromise = require('./my-promise');

const promise = new MyPromise((resolve, reject) => {
  reject('Hello Promise Reject~');
});
promise.then(
  (value) => {
    console.log(value);
  },
  (reason) => {
    console.log(reason);
  }
);

// Hello Promise Reject~
```

**验证状态不可变**

```js
const MyPromise = require('./my-promise');

const promise = new MyPromise((resolve, reject) => {
  resolve('Hello Promise Resolve~');
  reject('Hello Promise Reject~');
});
promise.then(
  (value) => {
    console.log(value);
  },
  (reason) => {
    console.log(reason);
  }
);

// Hello Promise Resolve~
```

**测试异步**

上述简易版 Promise 中如果存在异步操作将无法正确处理

```js
const MyPromise = require('./my-promise');
const promise = new MyPromise((resole, reject) => {
  setTimeout(resolve, 2000, 'Hello Promise Resolve~');
});

promise.then(
  (value) => {
    console.log(value);
  },
  (reason) => {
    console.log(reason);
  }
);
```

上述代码将不会有任何输出

**原因分析**

- MyPromise 的实现中没有考虑异步的实现，在异步函数中修改 Promise 的状态后没有调用 then 回调
- then 回调先于 resolve/reject 执行，此时 Promise 的状态还处于 PENDING，将不会执行任何操作[MyPromise 中未对该阶段进行处理]

### 在 Promise 中加入异步操作

根据 `原因分析` 给出如下解决办法：

1. 创建 `onFulfilled` 和 `onRejected` 两个属性用来存储 then 中的回调
2. 为 `then` 方法添加状态为 `PENDING` 的处理逻辑，及时将 onFulfilled 和 onRejected 回调进行存储，便于在异步方法中调用 resolve/reject 变更状态时及时触发对应的 then 中的回调
3. 在成功或失败时及时调用对应的 onFulfilled 或者 onRejected 回调

增加异步操作的 Promise 实现如下：

```js
class MyPromise {
  constructor(executor) {
    // 实例化Promise时需要一个执行器回调，该回调立即执行
    executor(this.resolve, this.reject);
  }

  //   Promise 的初始状态;
  status = PENDING;
  // 记录成功与失败的值
  value = undefined;
  reason = undefined;

  // then中的onFulfilled和onRejected回调
  onFulfilled = undefined;
  onRejected = undefined;

  // 此处使用箭头函数为了解决resolve调用中this的指向问题
  resolve = (value) => {
    // 如果状态不是 PENDING 直接跳出该逻辑
    if (this.status !== PENDING) return;
    // 将状态修改为 成功
    this.status = FULFILLED;

    // 将 resolve 回调的参数进行保存
    this.value = value;

    // 如果状态变更为 成功，调用成功的回调
    this.onFulfilled && this.onFulfilled(this.value);
  };

  reject = (reason) => {
    if (this.status !== PENDING) return;

    // 将状态修改为失败
    this.status = REJECTED;

    // 保存失败的原因
    this.reason = reason;

    // 如果状态变更为 失败，调用失败的回调
    this.onRejected && this.onRejected(this.reason);
  };

  then = (onFulfilled, onRejected) => {
    // 根据当前状态指定回调
    if (this.status === FULFILLED) {
      // 将成功的值作为回调函数的参数返回
      onFulfilled(this.value);
    } else if (this.status === REJECTED) {
      // 将失败的值作为回调函数的参数返回
      onRejected(this.reason);
    } else {
      // 既不是成功也不是失败。这个时候保存传递进来的两个回调，便于 异步操作中 更新 Promise 状态时，触发对应的回调
      this.onFulfilled = onFulfilled;
      this.onRejected = onRejected;
    }
  };
}
```

**验证多次 then 调用**

```js
const promise = new MyPromise((resolve) => {
  setTimeout(resolve, 2000, 'Hello Promise Resolve~');
});
promise.then(
  (value) => {
    console.log(value + ' first.');
  },
  (reason) => {
    console.log(reason);
  }
);
promise.then(
  (value) => {
    console.log(value + ' second.');
  },
  (reason) => {
    console.log(reason);
  }
);
promise.then(
  (value) => {
    setTimeout(() => {
      console.log(value + ' third.');
    }, 1000);
  },
  (reason) => {
    console.log(reason);
  }
);
// 3s后输出： Hello Promise Resolve~ third.
```

**原因分析**

如果执行器中存在**异步逻辑**，`then 函数又先于 异步逻辑 执行`，导致多次 `then` 调用存在覆盖 bug，即在后面的 then 调用会覆盖前面的 `then` 回调

### 实现 then 方法的多次调用

根据 `原因分析` 给出如下解决方案：

1. 将保存 `then` 回调的 onFulfilled 和 onRejected 属性改为数组形式，便于存储多个 `then` 回调.

增加存储多次 then 回调的实现如下：

```js
/**
 * 定义所有状态常量
 */
const PENDING = 'pending';
const FULFILLED = 'fulfilled';
const REJECTED = 'rejected';

/**
 * Promise是一个类
 */
class MyPromise {
  constructor(executor) {
    executor(this.resolve, this.reject);
  }

  status = PENDING;
  value = undefined;
  reason = undefined;

  onFulfilled = [];
  onRejected = [];

  resolve = (value) => {
    if (this.status !== PENDING) {
      return;
    }

    this.status = FULFILLED;
    this.value = value;

    while (this.onFulfilled.length) {
      this.onFulfilled.shift()(this.value);
    }
  };

  reject = (reason) => {
    if (this.status !== PENDING) {
      return;
    }

    this.status = REJECTED;
    this.reason = reason;

    while (this.onRejected.length) {
      this.onRejected.shift()(this.reason);
    }
  };

  then = (onFulfilled, onRejected) => {
    if (this.status === FULFILLED) {
      onFulfilled(this.value);
    }

    if (this.status === REJECTED) {
      onRejected(this.reason);
    }

    if (this.status === PENDING) {
      // 表示既不是成功，也不是失败。这个时候保存传递进来的两个回调
      this.onFulfilled.push(onFulfilled);
      this.onRejected.push(onRejected);
    }
  };
}
```

**验证多次 then 调用**

```js
const promise = new MyPromise((resolve) => {
  resolve('Hello Promise Resolve~');
});
promise.then(
  (value) => {
    console.log(value + ' first.');
  },
  (reason) => {
    console.log(reason);
  }
);
promise.then(
  (value) => {
    console.log(value + ' second.');
  },
  (reason) => {
    console.log(reason);
  }
);
promise.then(
  (value) => {
    setTimeout(() => {
      console.log(value + ' third.');
    }, 1000);
  },
  (reason) => {
    console.log(reason);
  }
);
// 输出
// 立即输出：
// Hello Promise Resolve~ first.
// Hello Promise Resolve~ second.
// 1s后输出
// Hello Promise Resolve~ third.

const promise = new MyPromise((resolve) => {
  setTimeout(resolve, 2000, 'Hello Promise Resolve~');
});
promise.then(
  (value) => {
    console.log(value + ' first.');
  },
  (reason) => {
    console.log(reason);
  }
);
promise.then(
  (value) => {
    console.log(value + ' second.');
  },
  (reason) => {
    console.log(reason);
  }
);
promise.then(
  (value) => {
    setTimeout(() => {
      console.log(value + ' third.');
    }, 1000);
  },
  (reason) => {
    console.log(reason);
  }
);
// 输出
// 2s后输出：
// Hello Promise Resolve~ first.
// Hello Promise Resolve~ second.
// 3s后输出
// Hello Promise Resolve~ third.
```

### <text style="color: red;">实现 then 方法的链式调用[难点]</text>

**要想实现 then 的链式调用，主要需要解决两个问题：**

1. 返回的是一个新的 `MyPromise` 的实例；
2. `then` 的返回值作为下一次的链式调用的参数。

**这里分为两种情况：**

1. 直接返回一个值，可以直接作为值使用；
2. 返回一个新的 `MyPromise` 实例，此时就需要判断其状态；

**代码实现**：

```js
/**
 * 定义所有状态常量
 */
const PENDING = 'pending';
const FULFILLED = 'fulfilled';
const REJECTED = 'rejected';

/**
 * Promise是一个类
 */
class MyPromise {
  constructor(executor) {
    executor(this.resolve, this.reject);
  }

  status = PENDING;
  value = undefined;
  reason = undefined;

  onFulfilled = [];
  onRejected = [];

  resolve = (value) => {
    if (this.status !== PENDING) {
      return;
    }

    this.status = FULFILLED;
    this.value = value;

    while (this.onFulfilled.length) {
      this.onFulfilled.shift()(this.value);
    }
  };

  reject = (reason) => {
    if (this.status !== PENDING) {
      return;
    }

    this.status = REJECTED;
    this.reason = reason;

    while (this.onRejected.length) {
      this.onRejected.shift()(this.reason);
    }
  };

  then = (onFulfilled, onRejected) => {
    // then 方法返回一个 MyPromise 实例
    return new MyPromise((resolve, reject) => {
      if (this.status === FULFILLED) {
        const result = onFulfilled(this.value);

        // 如果result是一个普通值，直接resolve(result)
        // 如果是一个 MyPromise 实例，根据返回的解决来决定时调用 resolve 还是 reject
        resolvePromise(result, resolve, reject);
      }

      if (this.status === REJECTED) {
        onRejected(this.reason);
      }

      if (this.status === PENDING) {
        // 表示既不是成功，也不是失败。这个时候保存传递进来的两个回调
        this.onFulfilled.push(onFulfilled);
        this.onRejected.push(onRejected);
      }
    });
  };
}

function resolvePromise(result, resolve, reject) {
  if (result instanceof MyPromise) {
    result.then(resolve, reject);
  } else {
    resolve(result);
  }
}
```

**验证链式调用**

```js
const promise1 = new MyPromise((resolve) => {
  resolve('Hello Promise Resolve~');
});
const promise2 = promise1.then(
  (value) => {
    console.log(value + ' promise1.');
    // 当前 Promise 的 resolve 回调函数的返回值将作为下一个链式调用的 then 中的 onFulfilled 回调函数的参数值
    return 'Hello Promise2 Resolve~';
  },
  (reason) => {
    console.log(reason);
  }
);

promise2.then(
  // 此处的 value 即为 'Hello Promise2 Resolve~'
  (value) => {
    console.log(value + ` promise2.`);
  },
  (reason) => {
    console.log(reason + ` promise2.`);
  }
);

// 输出：
// Hello Promise Resolve~ promise1.
// Hello Promise2 Resolve~ promise2.
```

### then 方法链式调用识别 Promise 对象自返回 [难点]

在 Promise 中，如果 `then` 方法返回的是自己的 `Promise` 对象，则会发生 `Promise` 的嵌套，这个时候程序会报错。

**测试代码**

```js
const p1 = new Promise((resolve, reject) => {
  resolve(12);
});
const p2 = p1.then((v) => {
  console.log(v);
  return p2;
});
p2.then((v) => console.log(v));

// 输出：
// 12
// Promise {<rejected>: TypeError: Chaining cycle detected for promise #<Promise>}
// Uncaught (in promise) TypeError: Chaining cycle detected for promise #<Promise>
```

**解决办法**

只需判断 `then` 返回的 Promise 实例与 then 中回调函数返回的实例是否是同一个即可，如果是引用的同一个实例，那么就抛出错误

**实现代码**

```js
/**
 * 定义所有状态常量
 */
const PENDING = 'pending';
const FULFILLED = 'fulfilled';
const REJECTED = 'rejected';

/**
 * Promise是一个类
 */
class MyPromise {
  constructor(executor) {
    executor(this.resolve, this.reject);
  }

  status = PENDING;
  value = undefined;
  reason = undefined;

  onFulfilled = [];
  onRejected = [];

  resolve = (value) => {
    if (this.status !== PENDING) {
      return;
    }

    this.status = FULFILLED;
    this.value = value;

    while (this.onFulfilled.length) {
      this.onFulfilled.shift()(this.value);
    }
  };

  reject = (reason) => {
    if (this.status !== PENDING) {
      return;
    }

    this.status = REJECTED;
    this.reason = reason;

    while (this.onRejected.length) {
      this.onRejected.shift()(this.reason);
    }
  };

  then = (onFulfilled, onRejected) => {
    // then 方法返回一个 MyPromise 实例
    const promise = new MyPromise((resolve, reject) => {
      if (this.status === FULFILLED) {
        // 如果不用异步是拿不到 then 中生成的新 Promise 实例的
        setTimeout(() => {
          const result = onFulfilled(this.value);

          resolvePromise(promise, result, resolve, reject);
        }, 0);
      }

      if (this.status === REJECTED) {
        onRejected(this.reason);
      }

      if (this.status === PENDING) {
        // 表示既不是成功，也不是失败。这个时候保存传递进来的两个回调
        this.onFulfilled.push(onFulfilled);
        this.onRejected.push(onRejected);
      }
    });

    return promise;
  };
}

function resolvePromise(promise, result, resolve, reject) {
  // 如果 promise 和 then 的返回值是同一个实例的话，需要抛出异常
  if (promise === result) {
    // 这里调用reject，并抛出一个Error
    // return 是必须的，阻止程序向下执行
    return reject(
      new TypeError('Chaining cycle detected for promise #<Promise>')
    );
  } else {
    // 判断 result 是不是 MyPromise 实例
    if (result instanceof MyPromise) {
      // 如果 result 是 MyPromise 实例的话，需要根据 result 的状态调用 resolve 或者 reject
      result.then(resolve, reject);
    } else {
      resolve(result);
    }
  }
}
```

> 这里 then 方法中的 setTimeout 的作用并不是延迟执行，而是为了调用 resolvePromise 函数时，保证创建的 promise 存在。

**验证代码**

```js
const promise1 = new MyPromise((resolve) => {
  resolve('Hello Promise Resolve~');
});
const promise2 = promise1.then(
  (value) => {
    console.log(value + ' promise1.');
    return promise2;
  },
  (reason) => {
    console.log(reason);
  }
);

promise2.then(
  (value) => {
    console.log(value + ` promise2.`);
  },
  (reason) => {
    console.log(reason + ` promise2.`);
  }
);
// 输出：
// Hello Promise Resolve~ promise1.
// TypeError: Chaining cycle detected for promise #<Promise> promise2.
```

## 捕捉错误及 then 链式调用其他状态代码补充

到目前为止我们实现的 Promise 并没有对异常做任何处理，为了保证代码的健壮性，我们需要对异常做一些处理。

### 捕捉执行器报错

如果执行器函数在执行过程中发生了异常，需要捕获异常并且在捕获逻辑中调用 reject 将异常传出去

**关键实现代码**

```js
constructor(executor) {
  try {
    executor(this.resolve, this.reject);
  } catch (error) {
    this.reject(error);
  }
}
```

**测试代码**

```js
const promise1 = new MyPromise((resolve) => {
  throw new Error('执行器异常');
});
promise1.then(console.log, console.log);

// 输出：
// Error: 执行器异常
//     at E:\blog\source\_posts\my-promise.js:100:11
//     at new MyPromise (E:\blog\source\_posts\my-promise.js:14:13)
//     at Object.<anonymous> (E:\blog\source\_posts\my-promise.js:99:18)
//     at Module._compile (node:internal/modules/cjs/loader:1126:14)
//     at Object.Module._extensions..js (node:internal/modules/cjs/loader:1180:10)
//     at Module.load (node:internal/modules/cjs/loader:1004:32)
//     at Function.Module._load (node:internal/modules/cjs/loader:839:12)
//     at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:81:12)
//     at node:internal/main/run_main_module:17:47
```

### 捕捉 then 中的报错

如果需要捕获 `then` 中的异常，与执行器中同理，需要在 then 中将捕获到的异常通过 reject 传递出去，异常需要通过 `try...catch` 捕获。

**关键实现代码**

```js
then = (onFulfilled, onRejected) => {
  // then 方法返回一个 MyPromise 实例
  const promise = new MyPromise((resolve, reject) => {
    if (this.status === FULFILLED) {
      // 如果不用异步是拿不到 then 中生成的新 Promise 实例的
      setTimeout(() => {
        try {
          // 将成功的值作为参数返回
          // 保存执行回调函数的结果
          const result = onFulfilled(this.value);

          // 如果返回的是一个普通的值，直接调用resolve
          // 如果是一个MyPromise实例，根据返回的promise实例状态来决定是调用resolve，还是reject
          resolvePromise(promise, result, resolve, reject);
        } catch (error) {
          reject(error);
        }
      }, 0);
    }

    // 将失败的原因作为参数返回
    if (this.status === REJECTED) {
      onRejected(this.reason);
    }

    if (this.status === PENDING) {
      // 表示既不是成功，也不是失败。这个时候保存传递进来的两个回调
      this.onFulfilled.push(onFulfilled);
      this.onRejected.push(onRejected);
    }
  });

  return promise;
};
```

**测试代码**

```js
const promise1 = new MyPromise((resolve) => {
  resolve(Math.PI);
});
promise1
  .then((pi) => console.log(2 * pi * r), console.log)
  .then(console.log, console.log);

// 输出：
// ReferenceError: r is not defined
//     at E:\blog\source\_posts\my-promise.js:112:40
//     at Timeout._onTimeout (E:\blog\source\_posts\my-promise.js:64:40)
//     at listOnTimeout (node:internal/timers:559:17)
//     at processTimers (node:internal/timers:502:7)
```

### 错误与异步状态的链式调用

目前只对成功状态的 then 进行了链式调用以及错误处理，错误与异步状态未进行处理，参照成功状态下的错误处理进行实现

**关键实现代码**

```js
then = (onFulfilled, onRejected) => {
  // then 方法返回一个 MyPromise 实例
  const promise = new MyPromise((resolve, reject) => {
    if (this.status === FULFILLED) {
      // 如果不用异步是拿不到 then 中生成的新 Promise 实例的
      setTimeout(() => {
        try {
          // 将成功的值作为参数返回
          // 保存执行回调函数的结果
          const result = onFulfilled(this.value);

          // 如果返回的是一个普通的值，直接调用resolve
          // 如果是一个MyPromise实例，根据返回的promise实例状态来决定是调用resolve，还是reject
          resolvePromise(promise, result, resolve, reject);
        } catch (error) {
          reject(error);
        }
      }, 0);
    }

    // 将失败的原因作为参数返回
    if (this.status === REJECTED) {
      // 失败的处理同成功处理，只是调用的回调函数不同
      setTimeout(() => {
        try {
          const result = onRejected(this.reason);
          resolvePromise(promise, result, resolve, reject);
        } catch (error) {
          reject(error);
        }
      }, 0);
    }

    if (this.status === PENDING) {
      // 表示既不是成功，也不是失败。这个时候保存传递进来的两个回调
      this.onFulfilled.push((value) => {
        setTimeout(() => {
          try {
            const result = onFulfilled(value);
            resolvePromise(promise, result, resolve, reject);
          } catch (error) {
            reject(error);
          }
        }, 0);
      });
      this.onRejected.push((reason) => {
        setTimeout(() => {
          try {
            const result = onRejected(reason);
            resolvePromise(promise, result, resolve, reject);
          } catch (error) {
            reject(error);
          }
        }, 0);
      });
    }
  });

  return promise;
};
```

**测试代码**

```js
const MyPromise = require('./myPromise');
let promise = new MyPromise((resolve, reject) => {
  setTimeout(resolve, 2000, '成功');
});
// 第一个then方法中的错误要在第二个then方法中捕获到
promise
  .then((value) => {
    console.log('resolve', value);
    throw new Error('then的执行过程中遇到异常');
  })
  .then(null, (reason) => {
    console.log(reason.message);
  });
/* 输出
    resolve 成功
    then的执行过程中遇到异常
*/
```

## 将 then 方法的参数变成可选参数

Promise 中的 then 方法其实是两个*可选参数*，如果我们不传递任何参数的话，里面的结果是向下传递的，直到捕获为止。

**示例代码**

```js
new Promise((resolve, reject) => {
  resolve(100);
})
  .then()
  .then()
  .then()
  .then((value) => console.log(value));
// 最后一个then输入100
```

**这段代码可以理解为**

```js
new Promise((resolve, reject) => {
  resolve(100);
})
  .then((value) => value)
  .then((value) => value)
  .then((value) => value)
  .then((value) => console.log(value));
```

**关键实现**

```js
// then方法的实现
then (onFulfilled, onRejected) {
    // 如果传递函数，就是用传递的函数，否则指定一个默认值，用于参数传递
    onFulfilled = onFulfilled ? onFulfilled : value => value
    // 同理
    onRejected = onRejected ? onRejected : reason => { throw reason }
    // then 方法返回一个MyPromise实例
    const promise = new MyPromise((resolve, reject) => {
        // 判断当前状态,根据状态调用指定回调
        if (this.status === FULFILLED) {...
        } else if (this.status === REJECTED) {...
        } else {...
        }
    })
    return promise
}
```

## Promise.all 方法的实现

简单的说 `Promise.all()` 会将多个 Promise 实例包装为一个 Promise 实例，且顺序与调用顺序一致:
**示例代码**

```js
function p1() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve('p1');
    }, 2000);
  });
}
function p2() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve('p2');
    }, 0);
  });
}
Promise.all(['a', 'b', p1(), p2(), 'c']).then((result) => {
  console.log(result);
  // ["a", "b", "p1", "p2", "c"]
});
```

在这段代码中，我们的 p1 的执行是延迟了 2s 的，这里如果不使用 Promise.all()的话最终顺序是与我们调用不同的。

**分析 Promise.all 的实现思路**

- `all()` 方法是通过类直接调用的，所以是一个静态方法
- `all()` 方法接收一个数组，数组中的值可以是一个普通值，也可以是一个 MyPromise 实例
- return 一个新的 MyPromise 实例
- 遍历数组中的每一个值，判断值的类型，如果是一个普通值就直接将值存入一个结果数组；如果是一个 MyPromise 实例对象，会调用其 then 方法，然后根据执行后的状态，如果失败的话调用 MyPromise 的 reject 方法，如果成功的话将值存入结果数组；
- 存入数组时计数，如果存入的数量达到传入的数组长度，说明调用完毕，执行 `resolve` 并将最终的结果数组作为参数返回。

**关键实现**

```js
MyPromise.all = (array) => {
  // 用于存放最终结果的数组
  let result = [];
  // 用于计算当前已经执行完的实例的数量，用于指定当前数据项结果在 result 中的索引位置
  let count = 0;

  // 返回一个 MyPromise 实例
  return new MyPromise((resolve, reject) => {
    function addResult(result, index, value, resolve) {
      // 根据索引值，将结果推入数组中
      result[index] = value;

      // 执行完毕一个 count+1，如果当前值等于总长度的话说明已经执行结束了，可以直接调用resolve，说明已经成功执行完毕了
      if (++count === array.length) {
        // 将执行结果返回
        resolve(result);
      }
    }

    // 遍历传入的数组
    array.forEach((item, index) => {
      // 如果是 MyPromise 实例，则调用 then 方法，获取该实例的值，并将值存入到 result数组的 index 指定索引中
      if (item instanceof MyPromise) {
        item.then(
          (value) => {
            addResult(result, index, value, resolve);
          },
          // 如果失败直接返回失败原因
          (reason) => {
            reject(reason);
          }
        );
      } else {
        addResult(result, index, item, resolve);
      }
    });
  });
};
```

**测试示例**

```js
function p1() {
  return new MyPromise((resolve, reject) => {
    setTimeout(() => {
      resolve('p1');
    }, 2000);
  });
}
function p2() {
  return new MyPromise((resolve, reject) => {
    setTimeout(() => {
      resolve('p2');
    }, 0);
  });
}
MyPromise.all(['a', 'b', p1(), p2(), 'c']).then((result) => {
  console.log(result);
  // ["a", "b", "p1", "p2", "c"]
});
```

## Promise.resolve 方法的实现

关于 Promise.resolve()方法的用法可以参考 Promise.resolve()与 Promise.reject()。
**直线思路分析**

- 该方法是一个静态方法
- 该方法接收的如果是一个值就直接将该值包装为一个 MyPromise 实例对象返回,如果是一个 MyPromise 实例对象,则直接返回

**关键实现**

```js
MyPromise.resolve = (value) => {
  // 如果是MyPromise的实例，就直接返回这个实例
  if (value instanceof MyPromise) {
    return value;
  } else {
    // 如果不是的话创建一个MyPromise实例，并返回传递的值
    return new MyPromise((resolve) => resolve(value));
  }
};
```

**测试代码**

```js
function p1() {
  return new MyPromise((resolve, reject) => {
    reject('p1');
  });
}
function p2() {
  return new MyPromise((resolve, reject) => {
    setTimeout(() => {
      resolve('p2');
    }, 2000);
  });
}
MyPromise.resolve(p1()).then(console.log, console.log);
MyPromise.resolve(3.1415926).then(console.log);
MyPromise.resolve(p2()).then(console.log, console.log);
// 输出
// p1
// 3.1415926
// 2s后输出
// p2
```

## finally 方法的实现

**实现思路分析**

- 不管 Promise 是 Fulfilled 还是 Rejected 状态,都会调用 finally 函数中的回调参数
- 返回一个新的 Promise 实例

**关键实现**

```js
finally(callback) {
    return this.then(
        value => new MyPromise.resolve(callback()).then(() => value),
        reason => new MyPromise.resolve(callback()).then(() => { throw reason })
    );
}
```

**测试代码**

```js
function p1() {
  return new MyPromise((resolve, reject) => {
    setTimeout(() => {
      resolve('p1');
    }, 2000);
  });
}
function p2() {
  return new MyPromise((resolve, reject) => {
    reject('p2 reject');
  });
}
p2()
  .finally(() => {
    console.log('finally p2');
    return p1();
  })
  .then(
    (value) => {
      console.log(value);
    },
    (reason) => {
      console.log(reason);
    }
  );
// finally p2
// 两秒之后执行p2 reject
```

## catch 方法的实现

关于 catch 方法可以参考 catch()，实现该方法其实非常简单，只需要在内部调用 then 方法，不传递第一个回调函数即可

**关键实现**

```js
catch(callback) {
    return this.then(null, callback);
}
```

**测试代码**

```js
function p() {
  return new MyPromise((resolve, reject) => {
    reject(new Error('reject'));
  });
}
p()
  .then((value) => {
    console.log(value);
  })
  .catch((reason) => console.log(reason));
// 输出
// Error: reject
```

## 完整代码

```js
/**
 * 定义所有状态常量
 */
const PENDING = 'pending';
const FULFILLED = 'fulfilled';
const REJECTED = 'rejected';

/**
 * Promise是一个类
 */
class MyPromise {
  constructor(executor) {
    try {
      executor(this.resolve, this.reject);
    } catch (error) {
      this.reject(error);
    }
  }

  status = PENDING;
  value = undefined;
  reason = undefined;

  onFulfilled = [];
  onRejected = [];

  resolve = (value) => {
    if (this.status !== PENDING) {
      return;
    }

    this.status = FULFILLED;
    this.value = value;

    while (this.onFulfilled.length) {
      this.onFulfilled.shift()(this.value);
    }
  };

  reject = (reason) => {
    if (this.status !== PENDING) {
      return;
    }

    this.status = REJECTED;
    this.reason = reason;

    while (this.onRejected.length) {
      this.onRejected.shift()(this.reason);
    }
  };

  then = (onFulfilled, onRejected) => {
    // 如果传递函数，就是用传递的函数，否则指定一个默认值，用于参数传递
    onFulfilled = onFulfilled ? onFulfilled : (value) => value;
    // 同理
    onRejected = onRejected
      ? onRejected
      : (reason) => {
          throw reason;
        };

    // then 方法返回一个 MyPromise 实例
    const promise = new MyPromise((resolve, reject) => {
      if (this.status === FULFILLED) {
        // 如果不用异步是拿不到 then 中生成的新 Promise 实例的
        setTimeout(() => {
          try {
            // 将成功的值作为参数返回
            // 保存执行回调函数的结果
            const result = onFulfilled(this.value);

            // 如果返回的是一个普通的值，直接调用resolve
            // 如果是一个MyPromise实例，根据返回的promise实例状态来决定是调用resolve，还是reject
            resolvePromise(promise, result, resolve, reject);
          } catch (error) {
            reject(error);
          }
        }, 0);
      }

      // 将失败的原因作为参数返回
      if (this.status === REJECTED) {
        // 失败的处理同成功处理，只是调用的回调函数不同
        setTimeout(() => {
          try {
            const result = onRejected(this.reason);
            resolvePromise(promise, result, resolve, reject);
          } catch (error) {
            reject(error);
          }
        }, 0);
      }

      if (this.status === PENDING) {
        // 表示既不是成功，也不是失败。这个时候保存传递进来的两个回调
        this.onFulfilled.push((value) => {
          setTimeout(() => {
            try {
              const result = onFulfilled(value);
              resolvePromise(promise, result, resolve, reject);
            } catch (error) {
              reject(error);
            }
          }, 0);
        });
        this.onRejected.push((reason) => {
          setTimeout(() => {
            try {
              const result = onRejected(reason);
              resolvePromise(promise, result, resolve, reject);
            } catch (error) {
              reject(error);
            }
          }, 0);
        });
      }
    });

    return promise;
  };

  finally(callback) {
    return this.then(
      (value) => new MyPromise.resolve(callback()).then(() => value),
      (reason) =>
        new MyPromise.resolve(callback()).then(() => {
          throw reason;
        })
    );
  }

  catch(callback) {
    return this.then(null, callback);
  }

  static all(array) {
    // 用于存放最终结果的数组
    let result = [];
    // 用于计算当前已经执行完的实例的数量，用于指定当前数据项结果在 result 中的索引位置
    let count = 0;

    // 返回一个 MyPromise 实例
    return new MyPromise((resolve, reject) => {
      function addResult(result, index, value, resolve) {
        // 根据索引值，将结果推入数组中
        result[index] = value;

        // 执行完毕一个 count+1，如果当前值等于总长度的话说明已经执行结束了，可以直接调用resolve，说明已经成功执行完毕了
        if (++count === array.length) {
          // 将执行结果返回
          resolve(result);
        }
      }

      // 遍历传入的数组
      array.forEach((item, index) => {
        // 如果是 MyPromise 实例，则调用 then 方法，获取该实例的值，并将值存入到 result数组的 index 指定索引中
        if (item instanceof MyPromise) {
          item.then(
            (value) => {
              addResult(result, index, value, resolve);
            },
            // 如果失败直接返回失败原因
            (reason) => {
              reject(reason);
            }
          );
        } else {
          addResult(result, index, item, resolve);
        }
      });
    });
  }

  static resolve(value) {
    // 如果是MyPromise的实例，就直接返回这个实例
    if (value instanceof MyPromise) {
      return value;
    } else {
      // 如果不是的话创建一个MyPromise实例，并返回传递的值
      return new MyPromise((resolve) => resolve(value));
    }
  }
}

function resolvePromise(promise, result, resolve, reject) {
  // 如果 promise 和 then 的返回值是同一个实例的话，需要抛出异常
  if (promise === result) {
    // 这里调用reject，并抛出一个Error
    // return 是必须的，阻止程序向下执行
    return reject(
      new TypeError('Chaining cycle detected for promise #<Promise>')
    );
  } else {
    // 判断 result 是不是 MyPromise 实例
    if (result instanceof MyPromise) {
      // 如果 result 是 MyPromise 实例的话，需要根据 result 的状态调用 resolve 或者 reject
      result.then(resolve, reject);
    } else {
      resolve(result);
    }
  }
}
```
