const path = require('path');
const WebpackUserscript = require('webpack-userscript');
// const dev = process.env.NODE_ENV === 'development';
let dev = false;

module.exports = {
    mode: dev ? 'development' : 'production',
    entry: path.resolve(__dirname, 'src', 'wk_v2.js'),
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'main.js'
    },
    devServer: {
        contentBase: path.join(__dirname, 'dist'),
        https: true,
        disableHostCheck: true,
        port: 9000
    },
    optimization: {
        minimize: false
    },
    module: {
        rules: [
            {
                test: /\.txt/,
                type: 'asset/source',
            }
        ]
    },
    plugins: [
        new WebpackUserscript({
            headers(data) { return {
                name: '清华社视听说 - 自动答题',
                include: ['*://www.tsinghuaelt.com/*'],
                "run-at": 'document-start',
                grant: ['GM.addStyle', 'GM.setValue', 'GM.getValue', 'GM.deleteValue'],
                version: data.version,
                description: '解放你的双手',
                author: 'Hyun',
                icon: 'https://www.tsinghuaelt.com/favicon.ico',
                require: [
                    'https://cdn.staticfile.org/jquery/3.5.1/jquery.min.js'
                ]
            }},
            proxyScript: {
                baseUrl: 'https://localhost:9000',
                filename: 'main.proxy.user.js',
                enable: () => dev
            }
        })
    ],
    resolve: {
        fallback: {
            "fs": false,
            "path": false,
            "os": false,
            "crypto": false,
            "stream": false,
            "http": false,
            "tls": false,
            "zlib": false,
            "https": false,
            "net": false,
            "worker_threads": false
        },
        modules: [path.resolve(__dirname, '/src'), 'node_modules/'],
        descriptionFiles: ['package.json'],
        extensions : ['.js', '.ts']
    },
    watch: true
}