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
    }

    reject = (reason) => {
        if (this.status !== PENDING) {
            return;
        }

        this.status = REJECTED;
        this.reason = reason;

        while (this.onRejected.length) {
            this.onRejected.shift()(this.reason);
        }
    }

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
    }
}

function resolvePromise(promise, result, resolve, reject) {
    // 如果 promise 和 then 的返回值是同一个实例的话，需要抛出异常
    if (promise === result) {
        // 这里调用reject，并抛出一个Error
        // return 是必须的，阻止程序向下执行
        return reject(new TypeError('Chaining cycle detected for promise #<Promise>'));
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

const promise1 = new MyPromise((resolve) => {
    resolve(Math.PI);
});
promise1
    .then((pi) => console.log(2 * pi * r), console.log)
    .then(console.log, console.log);