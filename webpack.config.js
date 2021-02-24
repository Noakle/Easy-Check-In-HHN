module.exports = {
    entry: './public/scripts/auth.js',
    output: {
        path: `${__dirname}/public/build/`,
        filename: 'bundle.js'
    },
    optimization: {
        minimize: true,
    },
    devtool: 'source-map'
}