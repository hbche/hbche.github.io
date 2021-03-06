const path = require("path");

module.exports = {
  // 打包模式
  mode: "development",
  // 入口文件
  entry: "./src/index.js",
  // 出口配置
  output: {
    // 输出目录(输出目录必须是绝对路径)
    path: path.resolve(__dirname, "./dist"),
    // 输出文件名称
    filename: "main.js",
  },
  //   模块配置
  module: {
    rules: [
      // 指定多个配置规则
    ],
  },
  // 开发服务器
  devServer: {},
  // 模块配置
  plugins: [
    //
  ],
};
