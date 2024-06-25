const path = require('path');
const webpack = require('webpack');
const childProcess = require('child_process');
const HardSourceWebpackPlugin = require('hard-source-webpack-plugin');

let commitHash = childProcess.execSync('git rev-parse --short HEAD').toString();

module.exports = {
  mode: 'production',
  entry: {
    landing: './deployment/scripts/landing.ts',
    editor: './deployment/scripts/editor.ts',
    dashboard: './deployment/scripts/dashboard.ts',
  },
  output: {
    path: path.resolve(__dirname, 'dist', 'Neon', 'Neon-gh'),
    filename: '[name].js',
  },
  node: {
    fs: 'empty',
  },
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: ['ts-loader'],
        exclude: /node_modules/,
      },
      {
        test: /Worker\.js$/,
        use: [
          {
            loader: 'worker-loader',
            options: { publicPath: '/Neon/Neon-gh/' },
          },
        ],
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  externals: {
    d3: 'd3',
  },
  plugins: [
    new HardSourceWebpackPlugin(),
    new webpack.DefinePlugin({
      __LINK_LOCATION__: JSON.stringify('https://ddmal.music.mcgill.ca/Neon'),
      __NEON_VERSION__: JSON.stringify(commitHash),
      __ASSET_PREFIX__: JSON.stringify('/Neon/Neon-gh/'),
    }),
  ],
};
