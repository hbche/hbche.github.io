const path = require('path');
const HtmlPlugin = require('html-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
    mode: 'development',
    entry: './src/index.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js',
        assetModuleFilename: 'images/[hash][ext][query]'
    },
    module: {
        rules: [
            {
                test: /\.html$/i,
                loader: 'html-loader',
            },
            {
                test: /\.css$/i,
                use: [
                    {
                        loader: MiniCssExtractPlugin.loader,
                        options: {
                            publicPath: '../'
                        }
                    },
                    'css-loader'
                ],
            },
            {
                test: /\.(png|jpe?g|gif)$/i,
                type: 'asset',
                generator: {
                    filename: 'img/[hash]'
                },
                parser: {
                    dataUrlCondition: {
                        maxSize: 8 * 1024
                    }
                }
            },
            {
                test: /\.{m}js$/i,
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
                                        ie: '9',
                                        firefox: '60',
                                        safari: '10',
                                        edge: '17'
                                    }
                                }
                            ]
                        ]
                    }
                }
            }
        ]
    },
    plugins: [
        new CleanWebpackPlugin(),
        new HtmlPlugin({
            title: '使用 webpack 编译 文件',
            template: './src/template.html'
        }),
        new MiniCssExtractPlugin({
            filename: './css/index.css',
        }),
        new ESLintPlugin(),
    ]
}
