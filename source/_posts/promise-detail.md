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
  resolve('Hello Promise Reject~');
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
  resolve('Hello Promise Reject~');
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

如果执行器中存在**异步逻辑**，`then 函数又先于 异步逻辑 执行`，导致多次 `then` 调用存在覆盖 bug，即在后续的 then 调用会覆盖前面的 `then` 回调

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

**验证对此 then 调用**

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

### 实现 then 方法的链式调用

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
    return 'Hello Promise2 Resolve~';
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
// Hello Promise2 Resolve~ promise2.
```

### then 方法链式调用识别 Promise 对象自返回

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

到目前为止我们现实的 Promise 并没有对异常做任何处理，为了保证代码的健壮性，我们需要对异常做一些处理。

### 捕捉执行器报错

如果执行器函数在执行过程中发生了异常，需要捕获异常并且在捕获逻辑中调用 reject 将异常传出去

**关键实现代码**

```js
constructor(executor) {
  try {
    executor(this.resolve, this.reject);
  } catch (error) {
    this.resolve(error);
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

```

## 将 then 方法的参数变成可选参数

## Promise.all 方法的实现

## Promise.resolve 方法的实现

## finally 方法的实现

## catch 方法的实现

## 完整代码
