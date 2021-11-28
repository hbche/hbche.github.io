const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const StylelintPlugin = require("stylelint-webpack-plugin");

module.exports = {
  mode: "development",
  entry: "./src/index.js",
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"),
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: [MiniCssExtractPlugin.loader, "css-loader", "postcss-loader"],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: "stylelint",
      text: "学习stylelint",
      template: "./index.html",
    }),
    new StylelintPlugin({
      // 指定需要格式校验的文件
      files: ["src/**/*.{css, less, sacc, scss}"],
    }),
    new MiniCssExtractPlugin({
      filename: "[name].css",
    }),
  ],
};
