// polyfill 会对所有 es 新语法进行转义
// import "@babel/polyfill";

const showMsg = () => {
  alert("Hello");
};

const showPromise = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log("xxx");
      resolve();
    }, 1000);
  });
};

console.log(showPromise());
