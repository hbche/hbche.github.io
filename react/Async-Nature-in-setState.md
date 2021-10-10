## setState函数的异步性

### 简述

在某些情况下，React框架出于性能优化考虑，可能会将多次 state 更新合并成一次更新。正因为如此，`setState` 实际上是一个**异步**的函数。 但是，有一些行为也会阻止React框架本身对于多次 state 更新的合并，从而让 state 的更新变得**同步化**。 比如: *eventListeners*, *Ajax*, *setTimeout* 等等。

### 详述

### 解决setState函数异步的方法

### setState函数本质