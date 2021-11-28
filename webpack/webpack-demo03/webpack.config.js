const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
  mode: "development",
  entry: "./src/index.js",
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "./dist"),
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: [
          // 将 css 编译到独立的 css 文件中
          MiniCssExtractPlugin.loader,
          // 2. css-loader 按照 CommonJS 规范，将样式文件输出到 js 中
          "css-loader",
          // 1. 通过 postcss-loader 给样式属性添加前缀
          "postcss-loader",
        ],
      },
    ],
  },
  plugins: [new MiniCssExtractPlugin()],
};
