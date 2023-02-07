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
        // 如果传递函数，就是用传递的函数，否则指定一个默认值，用于参数传递
        onFulfilled = onFulfilled ? onFulfilled : value => value;
        // 同理
        onRejected = onRejected ? onRejected : reason => { throw reason };

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
    }

    finally(callback) {
        return this.then(
            value => new MyPromise.resolve(callback()).then(() => value),
            reason => new MyPromise.resolve(callback()).then(() => { throw reason })
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