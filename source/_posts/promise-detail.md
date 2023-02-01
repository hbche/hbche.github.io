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

## Promise 的核心原理实现

首先我们从 Promise 的定义和使用方式开始分析 Promise。

### Promise 是什么

### Promise 如何使用

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

### Promise 什么场景|时候使用

### MyPromise 的实现

#### 简易版

```js
// 所有状态
const PENDING = 'pending';
const FULFILLED = 'fulfilled';
const REJECTED = 'rejected';

// Promise 本质上是一个类
class MyPromise {
  constructor(executor) {
    executor(this.resolve, this.reject);
  }

  //   Promise 的初始状态;
  status = PENDING;
  value = undefined;
  reason = undefined;

  resolve = (value) => {
    if (this.status !== PENDING) return;

    this.status = FULFILLED;

    // 将 resolve 回调的参数进行保存
    this.value = value;
  };

  reject = (reason) => {
    if (this.status !== PENDING) return;

    this.status = REJECTED;

    this.reason = reason;
  };

  then = (onFulfilled, onRejected) => {
    if (this.status === FULFILLED) {
      onFulfilled(this.value);
    } else if (this.status === REJECTED) {
      onRejected(this.reason);
    }
  };
}
```

## 在 Promise 中加入异步操作

## 实现 then 方法的多次调用

## 实现 then 方法的链式调用

## then 方法链式调用识别 Promise 对象自返回

## 捕捉错误及 then 链式调用其他状态代码补充

### 捕捉执行器报错

### 捕捉 then 中的报错

### 错误与异步状态的链式调用

## 将 then 方法的参数变成可选参数

## Promise.all 方法的实现

## Promise.resolve 方法的实现

## finally 方法的实现

## catch 方法的实现

## 完整代码
