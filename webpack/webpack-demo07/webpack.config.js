const ESLintPlugin = require('eslint-webpack-plugin');
const HtmlPlugin = require('html-webpack-plugin');
// const  = require('eslint-plugin-import');

module.exports = {
  mode: 'development',
  entry: './src/index.js',
  output: {
    path: __dirname + '/dist',
    filename: 'bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.m?js/i,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              [
                '@babel/preset-env',
                {
                  useBuiltIns: 'usage',
                  corejs: 3,
                  targets: {
                    chrome: '58',
                    firefox: '60',
                    safari: '10',
                    edge: '17',
                  },
                },
              ],
            ],
          },
        },
      },
    ],
  },
  plugins: [
    new HtmlPlugin({
      title: '学习使用 webpack 配置 eslint 校验 es 语法规则',
      template: './src/index.html',
    }),
    new ESLintPlugin({
      // 自动解决常规的不符合 airbnb 校验规则的代码
      fixed: true,
    }),
  ],
};
