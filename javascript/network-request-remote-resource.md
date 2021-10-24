# 网络请求与远程资源

1. XMLHttpRequest对象
2. 进度事件
3. 跨域资源共享
4. 替代性跨源技术
5. Fetch API
6. Beacon API
7. Web Socket
8. 安全
9. 总结

## XMLHttpRequest对象

XHR对象为发送服务器请求和捕获响应提供了合理的接口。这个接口可以实现异步从服务器获取额外数据，意味着用户不用点击不用页面刷新就可以获取数据，通过XHR对象获取数据后，可以使用DOM方法把数据插入网页。

### 使用XHR对象

使用XHR对象首先需要调用open()方法，这个方法接收三个参数：请求类型("get"、"post"等)、请求URL，以及表示请求是否是异步的布尔值。
``` js
new XMLHttpRequest().open('get', '/users/hbche', true);
```
关于open()方法存在以下几点说明：
1. 这里的URL是相对于代码所在页面的，当然也可以使用绝对URL('https://api.github.com/users/hbche')
2. 调用open()不会实际发送请求，只是为发送请求做好准备，要发送定义好的请求，必须调用send()方法
> 只能访问同源URL，也就是协议相同、域名相同、端口相同。如果请求的URL与发送请求的页面在任何方面有所不同，则会抛出安全错误。

``` js
const xhr = new XMLHttpRequest().open('get', 'https://api.github.com/users/hbche', false);
xhr.send(null);
```
send()方法接收一个参数，是作为请求体发送的数据。如果不需要发送请求体，则必须传null，因为这个参数在某些浏览器中是必须的。调用send()方法之后，请求就会发送到服务器。

收到相应后，XHR对象的以下属性会被填充上数据：
- responseText：作为响应体返回的文本
- responseXML：如果响应的内容类型是"text/xml"或"application/xml"，那就是包含响应数据的 XML DOM 文档
- status：响应的 HTTP 状态
- status：响应的HTTP状态
- statusText：响应的HTTP状态描述

收到响应后需要进行的处理：

判断status属性以确保响应成功返回。一般来说，HTTP状态码为2xx表示成功。如果状态码是304，则表示资源未修改过，是从浏览器缓存中直接拿到的。
``` js
if (xhr.status >= 200 && xhr.status < 300 || xhr.status == 304>) {
    alert(xhr.responseText);
} else {
    alert('Request was unsuccessful：' + xhr.status);
}
```
为确保下一步该执行什么操作，最好检查 `status` 而不是 `statusText` 属性，因为后者已被证明在跨浏览器的情况下不可靠。

多数情况下，我们使用XHR发送异步请求，这样可以不阻塞JavaScript代码继续执行。XHR对象有一个 **readyState** 属性，表示当前处在请求/响应过程的哪个阶段。这个属性有如下可能的值：
- 0：未初始化(Uninitialized)。尚未调用open()方法
- 1：已打开(Open)。已调用open()方法，尚未调用send()方法
- 2：已发送(Send)。已调用send()方法，尚未收到响应
- 3：接收中(Receiving)。已经收到部分响应
- 4：完成(Complete)。已经收到所有响应，可以使用了

每次 `readyState` 状态发生变化，都会触发 `readystatechange` 事件。可以借此机会检查 readyState 值。一般来说，我们唯一关心的 readyState 值是4，表示数据已就绪。为保证跨浏览器兼容性，onreadystatechange 事件处理程序应该在调用 **open()** 之前赋值。
``` js
const xhr = new XMLHttpRequest();
xhr.onreadystatechange = function() {
    if (xhr.readyState === 4) {
        if (xhr.status >= 200 && xhr.status < 300 || xhr.status === 304) {
            alert(xhr.responseText);
        } else {
            alert('Request was unsuccessful：' + xhr.status);
        }
    }
};
xhr.open('get', '');
```

### HTTP头部
每个HTTP请求和响应都会携带一些头部信息，XHR对象会通过一些方法暴露与请求响应相关的头部字段：
- Accept: 浏览器可以处理的内容类型
- Accept-Charset: 浏览器可以显示的字符集
- Accept-Encoding: 浏览器可以处理的压缩编码类型
- Accept-Language: 浏览器使用的语言
- Connection: 浏览器与服务器的连接类型
- Cookie: 页面中设置的Cookie
- Host: 发送请求的页面所在的域
- Referer: 发送请求的页面的URI。这个规范在HTTP规范中就拼写错了，考虑到浏览器兼容性必须将错就错(正确的拼写是Referrer)
- User-Agent: 浏览器的用户代理字符串

这些头部字段通常会发送给服务端，如果需要发送额外的头部信息，可以使用 setRequestHeader() 方法。这个方法接收两个参数：头部字段的名称和值。为保证请求头部被发送，必须在 **`open()` 之后** 、**`send()` 之前**调用 setRequestHeader() ，如下所示：
``` js
const xhr = new XMLHttpRequest();
xhr.onreadystatechange = function() {
    if (xhr.readyState === 4) {
        if (xhr.status >= 200 && xhr.status < 300 || xhr.status === 304) {
            alert(xhr.responseText);
        } else {
            alert('Request was unsuccessful: ' + xhr.status);
        }
    }
}
xhr.open('get', 'https://api.github.com/users/hbche');
xhr.setRequestHeader('MyHeader', 'MyValue');
xhr.send(null);
```
服务器通过读取自定义头部可以确定适当的操作。自定义头部一定要区别于浏览器正常发送的头部，否则可能影响服务器正常响应。有些浏览器允许重写默认头部，有些浏览器则不允许。

可以使用 `getResponseHeader()` 方法从XHR对象获取响应头部，只要传入需要获取的头部的名称即可。如果想获取所有响应头部，可以使用 `getAllResponseHeaders()` 方法，这个方法会返回包含所有响应头部的字符串。
``` js
const myHeader = xhr.getResponseHeader('MyHeader');
const allHeaders = xhr.getAllResponseHeaders();
```
服务端可以通过头部向浏览器传递额外的结构化数据。
```
cache-control: public, max-age=60, s-maxage=60
content-length: 470
content-type: application/json; charset=utf-8
etag: W/"e90e651430ba012b95df1a70386f32c3c6a4d843cd9a55df6d1eb579652004fc"
last-modified: Mon, 06 Sep 2021 02:24:37 GMT
x-github-media-type: github.v3; format=json
x-ratelimit-limit: 60
x-ratelimit-remaining: 43
x-ratelimit-reset: 1634396176
x-ratelimit-resource: core
x-ratelimit-used: 17
```
`express` 在获取浏览器使用的自定应请求头部数据时，`key` 需要使用其对应的全小写形式才能获取对应的值，否则将会为 `undefined`。例如浏览器中设置的自定义头部为 `Client-Type`，那么此时 express 在通过请求头获取时，需要使用 `client-type` ，req.headers['client-type']才能获取值。反之，如果 express 在响应头部中设置了自定义头部，服务端设置的key是什么，浏览器在 `xhr.getResponseHeader` 方法中获取的key就是什么，此处与浏览器传给服务器的不一样，但是服务端需要将自定义头部加入到 `Access-Control-Expose-Headers` 头部中，例如 `server-type`，此时需要在 `Access-Control-Expose-Headers` 头部加入刚刚自定义头部 `server-type`，否则自定义头部将被标记为 **unsafe header**，浏览器在获取对应的头部数据时，浏览器将会报如下错误：
```
Refused to get unsafe header "xxx"
```

### GET请求
对于 `GET` 请求的URL后面添加的查询字符串，参数必须进行正确的编码后才能添加到 URL 后面，然后再传给 open() 方法。
``` js
xhr.open('get', '/users?name=hbche&componeny=fiberhome', true);
```
可以编写如下发放对查询字符串进行正确的编码
``` js
function addURLParam(url, name, value) {
    url += (url.indexOf('?') !== -1 ? '?' : '&');
    url += `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
    return url;
}
```
响应的服务端在解析查询参数时，需要使用 `decodeURIComponent()` 方法进行解码。

### POST请求
每个 POST 请求应该在请求体中携带提交的数据，而 GET 请求则不然。POST 请求的请求体可以包含非常多的数据，而且数据可以是任意格式。

默认情况下，对服务端而言，POST 请求与提交表单是不一样的。服务端逻辑需要读取原始 POST 数据才能取得浏览器发送的数据。不过可以使用 XHR 模拟表单提交。
1. 将请求头中 `Content-Type` 设置为 `application/x-www-formurlencoded`，这是提交表单时使用的内容类型。
2. 创建对应格式的字符串，POST 数据此时与 **查询字符串** 相同的格式。
3. 如果网页中确实需要一个表单需要序列化并通过 XHR 发送放到服务器，则可以使用 `serialize()` 函数来创建相应的字符串

``` js
const xhr = new XMLHttpRequest();
xhr.onreadystatechange = function() {

}
xhr.open('post', '/users', true);
xhr.setRequestHeader('Content-Type', 'application/x-www-formurlencoded');
const form = document.getElementById('user-info');
xhr.send(serialize(form));
```

- Content-Type: 1.application/json 2.multipart/x-www-formurlencoded 3.application/form-data
- preflight请求是什么？ preflight请求的状态码为204

> POST请求比GET请求占用更多资源，从性能方面说，发送相同数量的数据，GET请求比POST请求要快两倍

### XMLHttpRequest Level2
XMLHttpRequest Level1 只是把已经存在的XHR对象的实现细明确了一下。XHRHTTPRequest Level2 又进一步发展了XHR对象。并非所有浏览器都实现了 XMLHttpRequest Level2 的所有部分，但是所有浏览器都实现了其中部分功能。

1. FormData 类型
现代 Web 应用中经常需要对表单数据进行序列化，因此 XMLHttpRequest Level2 新增加了 FormData 类型。FormData便于表格序列化，也便于创建与表单类似格式的数据然后通过 XHR 发送。下面是创建 FormData 对象，并填充了一些数据：
``` js
let data = new FormData();
data.apend('name', 'hbche');
```
append() 方法接收两个参数：键和值，相当于表单字段名称和该字段的值。可以添加任意多个键/值对数据。此外，通过直接给 FormData 构造函数传入一个表单元素，也可以将表单中的数据作为键/值对填充进去：
``` js
let data = new FormData(document.forms[0]);
```
有了 FormData 示例，可以像下面这样直接传给 XHT 对象的 send() 方法：
``` js
let xhr = new XMLHttpRequest();
xhr.onreadystatechange = function() {
    if (xhr.readyState === 4) {
        if (xhr.status >= 200 && xhr.status < 300 || status === 304) {
            alert(xhr.responseText);
        } else {
            alert('Request was unsuccessful: ' + xhr.status);
        }
    }
}
xhr.open('post', '/users', true);
let formData = new FormData(document.getElementById('user-info'));
xhr.send(formData);
```
使用 FormData 的另一个方便之处是不再需要给 XHR 对象显示设置任何请求头部了。XHR 对象能够识别作为 FormData 实例传入的数据类型并自动设置相应的头部。

2. 超时
在给 timeout 属性设置了一个时间且在该时间过后没有收到响应时，XHR 对象就会触发 timeout 事件，调用 timeout 事件处理程序。
``` js
let xhr = new XMLHttpRequest();
xhr.onreadystatechange = function() {
    if (xhr.readyState === 4) {
        try {
            if (xhr.status >= 200 && xhr.status < 300 || status === 304) {
                alert(xhr.responseText);
            } else {
                alert('Request was unsuccessful: ' + xhr.status);
            }
        } catch (ex) {
            // 假设由 ontimeout 处理
        }
    }
}
xhr.open('post', 'timeout', true);
// 设置 1 秒超时
xhr.timeout = 1000;
xhr.ontimeout = function() {
    alert('Request did not return in a second.');
};
xhr.send(null);
```
给 timeout 设置 1000 毫秒意味着，如果请求没有在 1 秒钟内返回则会中断。此时则会触发 ontimeout 事件处理程序，readyState 仍然会变成4，因此也会调用 onreadystatechange 事件处理程序。不过，如果在超时之后访问 status 属性则会发生错误，为做好防护，可以把检查 statu s属性的代码封装在 try/catch 语句中。

3. overrideMimeType()方法


## 进度事件
ProgressEvent 定义了客户端-服务器通信。有以下6个进度相关的事件：
- loaderstart: 在接收到响应的第一个字节时触发
- progress: 在接收响应期间反复触发
- error: 在请求出错时触发
- abort: 在调用 abort() 终止连接时触发
- load: 在成功接收完响应时触发
- loadend: 在通信完成时，且在error、abort或load之后触发

### onload事件
load事件用于替代readystatechange事件。load事件在响应接收完成后立即触发，这样就不用检查 readyState 属性了。onload事件处理程序会收到一个 event 对象，其 target 属性设置为 XHR 实例，在这个实例上可以访问所有 XHR 所有属性和方法。不过，并不是所有浏览器都实现了这个事件的 event 对象。考虑到跨浏览器兼容，还是需要像下面这样使用 XHR 对象变量：
``` js
const xhr = new XMLHttpRequest();
xhr.onload = function() {
    if (xhr.status >= 200 && xhr.status < 300 || xhr.status === 304) {
        alert(xhr.responseText);
    } else {
        alert('Resposne was unsuccessful: ' + xhr.status);
    }
}
xhr.open('get', 'altevents', true);
xhr.send(null);
```
> 只要从服务端收到响应，无论状态码是什么，都会触发 load 事件。这意味着还需要检查 status 属性才能确定数据是否有效。

### onprogress事件
在浏览器接收数据期间，progress 事件会反复触发。每次触发时，onprogress 事件处理程序都会收到 event 对象，其 target 属性是 XHR 对象，且包含3个额外属性：lengthComputable、loaded 和 total。其中，lengthComputable 是一个布尔值，表示进度信息是否可用；loaded是接收到的字节数；total 是响应的 Content-Length 头部定义的总字节数。有了这些信息后就可以给用户提供进度条了。
``` js
const xhr = new XMLHttpRequest();
xhr.onload = function() {
    if (xhr.status >= 200 && xhr.status < 300 || xhr.status === 304) {
        alert(xhr.responseText);
    } else {
        alert('Request was unsuccessful: ' + xhr.status);
    }
}
const divStatus = document.getElementById('status');
xhr.onprogress = function(event) {
    if (event.lengthComputable) {
        divStatus.innerHTML = 'Received ' + event.loaded + ' of ' + event.total + ' bytes'
    }
}
xhr.open('get', 'altevents', true);
xhr.send(null);
```

## 跨域资源共享

## 替代性跨源技术

## Fetch API

## Beacon API

## Web Socket

## 安全

## 总结