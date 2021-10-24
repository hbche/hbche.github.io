## setState函数的异步性

### 简述

在某些情况下，React框架出于性能优化考虑，可能会将多次 state 更新合并成一次更新。正因为如此，`setState` 实际上是一个**异步**的函数。 但是，有一些行为也会阻止React框架本身对于多次 state 更新的合并，从而让 state 的更新变得**同步化**。 比如: *eventListeners*, *Ajax*, *setTimeout* 等等。

### 详述
当 `setState` 函数执行时，函数会创建一个暂态的 state 作为过度 state，而不是直接修改 this.state。如果在调用 setState() 函数之后尝试去访问 this.state，你得到的可能还是 setState() 函数执行之前的状态值。在使用 setState() 的情况下，看起来同步执行的代码其执行顺序是得不到保证的。原因是 React 可能会将多次 state 更新合并成一次更新来优化性能。

运行下面这段代码，你会发现当和 addEventListener , setTimeout 函数或者发出 AJAX call 的时候，调用 setState() 函数, state 会发生改变。并且render函数会在setState()函数被触发之后马上被调用。那么到底发生了什么呢？事实上，类似 setTimeout() 函数或者发出 ajax call 的 fetch 函数属于调用浏览器层面的 API ，这些函数的执行并不存在于 React 的上下文中，所以 React 并不能够像控制其他存在于 React 上下文中的函数一样，将多次state更新合并成一次。React 对待这些不在其上下文中的函数，采用的策略就是及时更新，确保在这些函数执行之后的其他代码能拿到正确的数据（即更新过的state)。

``` jsx
import React from 'react';

export class TestAsyncState extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      dollars: 10,
    };
  }

  handleClick = () => {
    console.log(
      'State before (_onClickHandler): ' + JSON.stringify(this.state)
    );
    this.setState(
      {
        dollars: this.state.dollars + 10,
      },
      () => {
        console.log(
          'State after (_onClickHandler): ' + JSON.stringify(this.state)
        );
      }
    );
  };

  handleTimeout = () => {
    console.log('State before (timeout): ' + JSON.stringify(this.state));
    this.setState({
      dollars: this.state.dollars + 30,
    });
    console.log('State after (timeout): ' + JSON.stringify(this.state));
  };

  handleAjax = () => {
    fetch('https://api.github.com/users')
      .then((res) => res.json())
      .then((res) => {
        console.log('State after (AJAX call): ' + JSON.stringify(this.state));
        this.setState({
          dollars: this.state.dollars + 10,
        });
        console.log('State after (AJAX call): ' + JSON.stringify(this.state));
      });
  };

  handleMouseLeave = () => {
    document.getElementById('testButton').addEventListener('mouseleave', () => {
      console.log('State after (eventListener): ' + JSON.stringify(this.state));
      this.setState({
        dollars: this.state.dollars + 20,
      });
      console.log('State after (eventListener): ' + JSON.stringify(this.state));
    });
  };

  componentDidMount() {
    setTimeout(this.handleTimeout, 10000);
    this.handleAjax();
    this.handleMouseLeave();
  }

  render() {
    return (
      <button id="testButton" onClick={this.handleClick}>
        Click Me
      </button>
    );
  }
}
```

### 解决setState函数异步的方法

根据React官方文档，setState函数实际上接收两个参数，其中第二个参数类型是一个函数，作为setState函数执行后的回调。通过传入回调函数的方式，React可以保证传入的回调函数一定是在setState成功更新this.state之后再执行。

``` js
_onClickHandler: function _onClickHandler() {
   console.log('State before (_onClickHandler): ' + JSON.stringify(this.state));
   this.setState({
   dollars: this.state.dollars + 10
   }, () => {
   console.log('Here state will always be updated to latest version!');
   console.log('State after (_onClickHandler): ' + JSON.stringify(this.state));
   });
}
```

### setState函数异步的本质
其实setState作为一个函数，本身是**同步**的。只是因为在setState的内部实现中，使用了 `React updater` 的 `enqueueState` 或者 `enqueueCallback` 方法，才造成了异步。

下面这段是React源码中setState的实现:
``` ts
/**
 * Sets a subset of the state. Always use this to mutate
 * state. You should treat `this.state` as immutable.
 *
 * There is no guarantee that `this.state` will be immediately updated, so
 * accessing `this.state` after calling this method may return the old value.
 *
 * There is no guarantee that calls to `setState` will run synchronously,
 * as they may eventually be batched together.  You can provide an optional
 * callback that will be executed when the call to setState is actually
 * completed.
 *
 * When a function is provided to setState, it will be called at some point in
 * the future (not synchronously). It will be called with the up to date
 * component arguments (state, props, context). These values can be different
 * from this.* because your function may be called after receiveProps but before
 * shouldComponentUpdate, and this new state, props, and context will not yet be
 * assigned to this.
 *
 * @param {object|function} partialState Next partial state or function to
 *        produce next partial state to be merged with current state.
 * @param {?function} callback Called after state is updated.
 * @final
 * @protected
 */
Component.prototype.setState = function(partialState, callback) {
  if (
    typeof partialState !== 'object' &&
    typeof partialState !== 'function' &&
    partialState != null
  ) {
    throw new Error(
      'setState(...): takes an object of state variables to update or a ' +
        'function which returns an object of state variables.',
    );
  }

  this.updater.enqueueSetState(this, partialState, callback, 'setState');
};
```
而updater的这两个方法，又和React底层的Virtual Dom(虚拟DOM树)的diff算法有紧密的关系，所以真正决定同步还是异步的其实是Virtual DOM的diff算法。
