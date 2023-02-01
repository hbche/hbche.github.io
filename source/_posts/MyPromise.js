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

    onFulfilled = undefined;
    onRejected = undefined;

    resolve = (value) => {
        if (this.status !== PENDING) {
            return;
        }

        this.status = FULFILLED;
        this.value = value;

        this.onFulfilled && this.onFulfilled(this.value);
    }

    reject = (reason) => {
        if (this.status !== PENDING) {
            return;
        }

        this.status = REJECTED;
        this.reason = reason;

        this.onRejected && this.onRejected(this.reason);
    }

    then = (onFulfilled, onRejected) => {
        if (this.status === FULFILLED) {
            onFulfilled(this.value);
        }

        if (this.status === REJECTED) {
            onRejected(this.reason);
        }

        if (this.status === PENDING) {
            this.onFulfilled = onFulfilled;
            this.onRejected = onRejected;
        }
    }
}

const promise = new MyPromise((resolve, reject) => {
    resolve('Hello Promise Resolve~');
    // reject('Hello Promise Reject~');
    setTimeout(() => {
        reject('Hello Promise Reject~');
    }, 1000);
});
promise.then((value) => {
    console.log(value);
}, (reason) => {
    console.log(reason);
});