# [你可能不需要使用派生的 state](https://react.docschina.org/blog/2018/06/07/you-probably-dont-need-derived-state.html)

在很长一段时间内，生命周期函数 `componentWillReceiveProps` 是响应 Props 变化之后进行更新的唯一方式。16.3 版本里，新增了替代版的生命周期函数：`getDerivedStateFromProps`，尝试使用一个更安全的方式达到通向的目的。

## 什么时候使用派生 state
`getDerivedStateFromProps` 的存在只有一个目的：让组件在 **props变化** 时更新 state。

**保守使用派生 state**。大部分使用派生 state 导致的问题不外乎以下两类：
1. 直接复制 props 到 state
2. 如果 props 和 state 不一致就更新 state

## 派生 state 的常见 bug
名词“受控”和“非受控”通常用来指代表单的 inputs，但是也可以用来描述数据频繁更新的组件。
- 受控组件：使用 props 传入数据，组件被父级传入的 props 控制
- 非受控组件：数据只保存在组件内部的 state 中，外部没办法直接控制 state

常见错误：
1. 当一个派生 state 值也被 `setState` 方法更新时，这个值就不是一个单一来源的值

### 直接复制 prop 到 state
`getDerivedStateFromProps` 和 `componentWillReceiveProps` 不只是在组件的 props 更新时被调用，实际上只要上层组件重新渲染时，这两个生命周期函数就会被重新调用，不管 props 有没有“变化”。所以在这两个方法中直接复制 props 到 state 是不安全的。**这样做会导致 state 没有被正确渲染**。
示例：
``` tsx
interface EmailInputProps {
  email: string;
}
interface EmailInputState {
  email: string;
}
class EmailInput extends Component<EmailInputProps, EmailInputState> {
  constructor(props: EmailInputProps) {
    super(props);
    this.state = {
      email: this.props.email,
    };
  }

  render() {
    return (
      <input
        value={this.state.email}
        onChange={(e) => this.setState({ email: e.target.value })}
      />
    );
  }

  componentWillReceiveProps(nextProps) {
    // 这会覆盖所有组件内的 state 更新
    // 不要这样做
    this.setState({ email: nextProps.email });
  }
}

interface TimerProps {}
interface TimerState {
  count: number;
}
class Timer extends Component<TimerProps, TimerState> {
  timerID: number;

  constructor(props: TimerProps) {
    super(props);
    this.state = {
      count: 0,
    };
  }

  updateCount = () => {
    this.setState((prevState: TimerState) => ({
      count: prevState.count + 1,
    }));
  };

  componentDidMount() {
    this.timerID = setInterval(this.updateCount, 1000);
  }

  componentWilUnmount() {
    if (this.timerID) {
      clearInterval(this.timerID);
    }
  }

  render() {
    return (
      <div>
        <EmailInput email="example@google.com" />
        <p>Current count: {this.state.count}</p>
      </div>
    );
  }
}
```
> 问题描述：在修改输入框内容时，输入框的内容马上又被重置为默认值了

> 问题的根源：父组件频繁更新，导致子组件中 state 被 props "重置"，子组件的 state 依赖于父组件的 props，同时子组件又通过 setState 函数更新 state
### 在 props 变化后修改 state
修改上述示例中的 EmailInput 组件
``` tsx
class EmailInput extends Component {
  state = {
    email: this.props.email
  };

  componentWillReceiveProps(nextProps) {
    // 只要 props.email 改变，就改变 state
    if (nextProps.email !== this.props.email) {
      this.setState({
        email: nextProps.email
      });
    }
  }
  
  // ...
}
```
> 示例中使用了 componentWillReceiveProps ，使用 getDerivedStateFromProps 也是一样。

虽然 state 的更新做了改进，但是仍然存在相同的问题。避免该问题的关键是: **任何数据，都要保证只有一个数据来源，而且避免直接复制它**。

## 建议的模式

### 完全可控的组件
将子组件的状态控制逻辑提升至上层组件，将子组件换成一个轻量的函数组件：
``` tsx
interface EmailInputProps {
  email: string;
  onChange: (e: SyntheticEvent) => void;
}
function EmailInput({ email, onChange }: EmailInputProps) {
  return <input value={email} onChange={onChange} />;
}

interface TimerProps {}
interface TimerState {
  count: number;
  email: string;
}
class Timer extends Component<TimerProps, TimerState> {
  timerID: number;

  constructor(props: TimerProps) {
    super(props);
    this.state = {
      count: 0,
      email: 'example@google.com',
    };
  }

  onChange = (e: SyntheticEvent) => {
    this.setState({
      // @ts-ignore
      email: e.target.value,
    });
  };

  updateCount = () => {
    this.setState((prevState: TimerState) => ({
      count: prevState.count + 1,
    }));
  };

  componentDidMount() {
    this.timerID = setInterval(this.updateCount, 1000);
  }

  componentWilUnmount() {
    if (this.timerID) {
      clearInterval(this.timerID);
    }
  }

  render() {
    return (
      <div>
        <EmailInput email={this.state.email} onChange={this.onChange} />
        <p>Current count: {this.state.count}</p>
      </div>
    );
  }
}
```

### 有 key 的非可控组件
另外一个选择是让组件自己存储临时的 email state。在这种情况下，组件仍然可以从 prop 接收“初始值”，但是更改之后的值就和 prop 没关系了，不要再使用 `componentWillReceiveProps` 或 `getDeviredStateFromProps` 来"重置"子组件的 state 了。

### 总结
设计组件时，重要的是确定组件是受控组件还是非受控组件。

对于不受控的组件，当你想在 prop 变化（通常是 ID ）时重置 state 的话，可以选择以下几种方式：
- 建议：重置内部所有的初始 state，使用 key 属性
- 选项一：仅更改某些字段，观察特殊属性的变化(比如 `props.userID`)
- 选项二：在父组件中使用 ref 调用子组件的实例方法子组件的更新状态，**建议谨慎使用**。

## 尝试一下 memoization
仅在输入变化时，重新计算 `render` 需要使用的值--这个技术就叫 `memoizataion`。

示例：需求是根据用户输入的条件过滤显示结果

实现一：使用派生 state
``` tsx
import React, { PureComponent, SyntheticEvent } from 'react';

interface MemoiztionDemoProps {
  dataList: [];
}

interface MemoiztionDemoState {
  filterText: string;
  prevFilterText: string;
  prevPropsList: [];
  filteredList: [];
}

// PureComponents 只会在 state 或者 prop 的值修改时才会再次渲染。
// 通过对 state 和 prop 的 key 做浅比较（ shallow comparison ）来确定有没有变化。
export default class MemoiztionDemo extends PureComponent<
  MemoiztionDemoProps,
  MemoiztionDemoState
> {
  state = {
    filterText: '',
  };

  handleFilterText = (e: SyntheticEvent) => {
    // @ts-ignore
    this.setState({ filterText: e.target.value });
  };

  static getDerivedStateFromProps(props, state) {
    console.log(props);
    console.log(state);
    // 列表变化或者过滤文本变化时都重新过滤。
    // 注意我们要存储 prevFilterText 和 prevPropsList 来检测变化。
    if (
      props.list !== state.prevPropsList ||
      state.prevFilterText !== state.filterText
    ) {
      return {
        prevPropsList: props.list,
        prevFilterText: state.filterText,
        filteredList: props.dataList.filter((item) =>
          item.name.includes(state.filterText)
        ),
      };
    }
    return null;
  }

  render() {
    // PureComponent 的 render 只有
    // 在 props.list 或 state.filterText 变化时才会调用
    // const filteredList = this.props.dataList.filter((item: any) =>
    //   item.name.includes(this.state.filterText)
    // );
    return (
      <>
        <input onChange={this.handleFilterText} value={this.state.filterText} />
        <ul>
          {this.state.filteredList.map((item) => (
            <li key={item.id}>{item.name}</li>
          ))}
        </ul>
      </>
    );
  }
}

```
这个实现避免了重复计算 filteredList，但是过于复杂。因为它必须单独追踪并检测 prop 和 state 的变化，才能及时地更新过滤后的 list。我们可以使用 PureComponent，把过滤操作放到 render 方法里来简化这个组件。

实现二：使用 PureComponent
``` tsx
import React, { PureComponent, SyntheticEvent } from 'react';

interface MemoiztionDemoProps {
  dataList: [];
}

interface MemoiztionDemoState {
  filterText: string;
}

// PureComponents 只会在 state 或者 prop 的值修改时才会再次渲染。
// 通过对 state 和 prop 的 key 做浅比较（ shallow comparison ）来确定有没有变化。
export default class MemoiztionDemo extends PureComponent<
  MemoiztionDemoProps,
  MemoiztionDemoState
> {
  state = {
    filterText: '',
  };

  handleFilterText = (e: SyntheticEvent) => {
    // @ts-ignore
    this.setState({ filterText: e.target.value });
  };

  render() {
    // PureComponent 的 render 只有
    // 在 props.list 或 state.filterText 变化时才会调用
    const filteredList = this.props.dataList.filter((item: any) =>
      item.name.includes(this.state.filterText)
    );
    return (
      <>
        <input onChange={this.handleFilterText} value={this.state.filterText} />
        <ul>
          {filteredList.map((item) => (
            <li key={item.id}>{item.name}</li>
          ))}
        </ul>
      </>
    );
  }
}
```
上面的方法比派生 state 版本更加清晰明了。只有在过滤很大的列表时，这样做的效率不是很好。当有 prop 改变时 PureComponent 不会阻止再次渲染。为了解决这两个问题，我们可以添加 `memoization` 帮助函数来阻止非必要的过滤.

方式三：使用 memoize 
``` tsx
import memoize from "memoize-one";

class Example extends Component {
  // state 只需要保存当前的 filter 值：
  state = { filterText: "" };

  // 在 list 或者 filter 变化时，重新运行 filter：
  filter = memoize(
    (list, filterText) => list.filter(item => item.text.includes(filterText))
  );

  handleChange = event => {
    this.setState({ filterText: event.target.value });
  };

  render() {
    // 计算最新的过滤后的 list。
    // 如果和上次 render 参数一样，`memoize-one` 会重复使用上一次的值。
    const filteredList = this.filter(this.props.list, this.state.filterText);

    return (
      <Fragment>
        <input onChange={this.handleChange} value={this.state.filterText} />
        <ul>{filteredList.map(item => <li key={item.id}>{item.text}</li>)}</ul>
      </Fragment>
    );
  }
}
```
在使用 memoization 时，请记住这些约束：
- 大部分情况下， **每个组件内部都要引入 memoized 方法**，已免实例之间相互影响
- 一般情况下，我们会**限制 memoization 帮助函数的缓存空间**，以免内存泄漏。（上面的例子中，使用 memoize-one 只缓存最后一次的参数和结果）
- 如果每次父组件都传入新的 props.list ，那本文提到的问题都不会遇到。在大多数情况下，这种方式是可取的。

## 总结
在实际应用中，组件一般都会有受控组件和非受控组件。这是正常的！不过如果每个值都有明确的来源，就可以避免上面提到的反面模式。

`getDerivedStateFromProps` （以及其他派生 state）是一个高级复杂的功能，应该保守使用，这个再怎么重申也不过分。