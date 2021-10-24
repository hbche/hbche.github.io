## Fetch API 学习笔记

`fetch()` 是 [XMLHttpRequest](https://developer.mozilla.org/zh-CN/docs/Web/API/XMLHttpRequest) 的升级版，用于在 JavaScript 脚本里面发出 HTTP 请求。

浏览器原生提供了这个对象。浏览器支持情况参照[Can I use](https://caniuse.com/fetch)
![Fetch在浏览器中的支持情况](./fetch-can-i-use.png)

### 基本用法

`fetch()` 的功能与XMLHttpRequest基本相同，但有三个主要的差异。
1. `fetch()` 使用Promise，不适用回调函数，因此大大简化了写法，写起来更简洁。
2. `fetch()` 采用模块化设计，API分散在多个对象上(Request对象、Header对象、Response对象)，更合理一些；相比之下，XMLHttpRequest的API设计并不是很好，输入、输出、状态都在同一个接口管理，容易写出非常混乱的代码。
3. `fetch()` 通过数据流(Stream 对象)处理数据，可以分块读取，有利于提高网站性能表现，减少内存占用，对于请求大文件或者网速慢的场景相当有用。XMLHttpRequest对象不支持数据流，所有的数据必须放在缓存里，不支持分块读取，必须等待全部拿到后，再一次性吐出来。

在用法上，`fetch()`接受一个URL字符串作为参数，默认向该网址发出GET请求，返回一个 Promise 对象。它的基本用法如下：
``` js
fetch(url)
.then(...)
.catch(...)
```

下面是一个例子，从服务器获取 JSON 数据。
``` js
fetch('https://api.github.com/users/hbche')
.then(response => response.json())
.then(data => console.log(data))
.catch(err => colsole.log('Request Failed', err))
```

上面示例中，`fetch()`接收到的 `response` 是一个 [Stream 对象](https://developer.mozilla.org/en-US/docs/Web/API/Streams_API)，`response.json()` 是一个异步操作，取出所有内容，并将其转为 JSON 对象。

Promise 可以使用 await 语法改写，使得语义更清晰。
``` js
async function getJSON() {
    const url = 'https://api.github.com/users/hbche';
    try {
        const response = await fetch(url);
        return await response.json();
    } catch (err) {
        console.log('Request Failed', error);
    }
}
```
上面的示例中，`await` 语句必须放在 `try...catch...` 里面，这样才能捕捉异步操作中可能发生的错误。

### Response对象：处理HTTP响应

#### Response 对象的同步属性
`fetch()` 请求成功后，得到的是一个 [Response对象](https://developer.mozilla.org/zh-CN/docs/Web/API/Response)。它对应服务器的HTTP响应。
``` js
const response = await fetch(url);
```

前面说过，Response 包含的数据通过 Stream 接口异步读取，但是它还包含一些同步属性，对应 HTTP 回应的标头信息（Headers），可以立即读取。

``` js
async function fetchText() {
  let response = await fetch('/readme.txt');
  console.log(response.status); 
  console.log(response.statusText);
}
```

上面示例中，`response.status` 和 `response.textStatus` 就是 Response 的同步属性，可以立即读取。

Response对象有以下属性：

| 属性                | 说明                                                         |
| ------------------- | ------------------------------------------------------------ |
| Response.headers    | 只读，包含此Response关联的[Headers](https://developer.mozilla.org/zh-CN/docs/Web/API/Headers)对象 |
| Response.ok         | 只读，布尔值，标识该Response成功(HTTP状态码的范围在200~299)  |
| Response.redirected | 只读，表示该Response是狗来自重定向，如果是，它的URL列表将会有多个条目 |
| Response.status     | 只读，包含Response的状态码                                   |
| Response.textStatus | 只读，包含与该状态码一致的状态信息(例如，OK对应200)          |
| Response.type       | 只读，包含该Response的类型(例如，basic、cors)                |
| Response.url        | 只读，表示Response的URL                                      |
| Response.body       | 只读，一个简单的getter，用于暴露一个[ReadableStream](https://developer.mozilla.org/zh-CN/docs/Web/API/ReadableStream)类型的body内容 |
| Body.bodyUsed       | 标识该Response是否读取过Body                                 |

Response.type

- basic：标准值，同源响应，带有所有的头部信息除了"Set-Cookie"和"Set-Cookie2"
- cors：Response 接收到了一个有效的跨域请求.
- error：网络错误
- opaque：响应"no-cors"的跨域请求

Response对象有以下方法：

| 方法          | 说明                                                         |
| ------------- | ------------------------------------------------------------ |
| clone()       | 创建一个Response对象的克隆                                   |
| error()       | 返回一个绑定了网络错误的新的Response对象                     |
| redirect()    | 用另一个URL创建一个新的Response                              |
| arrayBuffer() | 读取Response对象并且将它设置为已读，并返回一个被解析为 [ArrayBuffer ](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer)格式的Promise对象 |
| blob()        | 读取Response对象并且将它设置为已读，并返回一个被解析为 [Blob](https://developer.mozilla.org/zh-CN/docs/Web/API/Blob)格式的Promise对象 |
| formData()    | 读取Response对象并且将它设置为已读，并返回一个被解析为[FormData](https://developer.mozilla.org/zh-CN/docs/Web/API/FormData)格式的Promise对象 |
| json()        | 读取Response对象并且将其设置为已读，并返回一个被解析为JSON格式的Promise对象 |
| text()        | 读取Response对象并且将其设置为已读，并返回一个被解析为[USVString](https://developer.mozilla.org/zh-CN/docs/Web/API/USVString)格式的Promise对象 |

#### 判断是否请求成功

fetch() 请求成功后，有一个很重要的注意点：只有网络错误，或者无法连接时，fetch() 才会报错，其他情况都不会报错，而是认为请求成功。

这就是说，即使服务器返回的状态码是 4xx 或者 5xx ，fetch() 也不会报错(即Promise不会变为 `reject` 状态)

只有通过 `Response.status` 属性得到HTTP回想的真实状态码，才能判断请求是成功。

``` js
async function fetchText() {
    const response = await fetch('/readme.txt');
    if (response.status >= 200 && response.status < 300) {
        return await response.text();
    } else {
        throw new Error(response.statusText);
    }
}
```

上面的示例中，`response.status` 属性只会等于 2xx(200~299)，才能认定请求成功。这里不用考虑网址跳转(3xx)，因为 `fetch()` 会将跳转的状态自动转为200。

另一种方法是判断 `response.ok` 是否为 `true`。

``` js
if (response.ok) {
    // 请求成功
} else {
    // 请求失败
}
```

#### Response.headers属性

Response对象还有一个

### fetch()的第二个参数：定制HTTP请求

### fetch()配置对象的完整API

### 取消fetch()请求

