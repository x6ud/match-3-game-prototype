const path = require('path');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const VueLoaderPlugin = require('vue-loader/lib/plugin');

module.exports = {
    entry: './src/main.js',
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'dist'),
        publicPath: ''
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loader: ['babel-loader']
            },
            {
                test: /\.ts$/,
                loader: ['awesome-typescript-loader']
            },
            {
                test: /\.vue$/,
                loader: ['vue-loader']
            },
            {
                test: /\.css$/,
                loader: [
                    'style-loader',
                    'css-loader'
                ]
            },
            {
                test: /\.scss$/,
                loader: [
                    'vue-style-loader',
                    'css-loader',
                    'sass-loader'
                ]
            },
            {
                test: /\.(wav|png)$/,
                loader: ['arraybuffer-loader']
            }
        ]
    },
    devServer: {
        contentBase: './dist',
        hot: true
    },
    plugins: [
        new CleanWebpackPlugin(),
        new HtmlWebpackPlugin({
            filename: 'index.html',
            title: 'Game',
            template: './index.html',
        }),
        new VueLoaderPlugin()
    ],
    resolve: {
        extensions: ['.ts', '.js', '.vue', '.json'],
        alias: {
            'vue$': 'vue/dist/vue.esm.js',
            '@': path.resolve(__dirname, './src'),
        }
    }
};
