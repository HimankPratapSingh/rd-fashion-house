const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const appDirectory = path.resolve(__dirname);

// Packages that need to be transpiled by Babel for web
const compileNodeModules = [
  'react-native-safe-area-context',
  'react-native-screens',
  'react-native-uuid',
  '@react-navigation/native',
  '@react-navigation/native-stack',
  '@react-navigation/bottom-tabs',
  '@react-navigation/elements',
  '@react-navigation/routers',
  '@react-navigation/stack',
  'react-native-web',
  '@react-native-async-storage/async-storage',
].map(m => path.resolve(appDirectory, `node_modules/${m}`));

const babelLoaderConfig = {
  test: /\.(js|jsx|ts|tsx)$/,
  include: [
    path.resolve(appDirectory, 'index.js'),
    path.resolve(appDirectory, 'App.tsx'),
    path.resolve(appDirectory, 'src'),
    ...compileNodeModules,
  ],
  use: {
    loader: 'babel-loader',
    options: {
      cacheDirectory: true,
      presets: [
        ['@babel/preset-env', { targets: { browsers: ['last 2 versions'] } }],
        ['@babel/preset-react', { runtime: 'automatic' }],
        ['@babel/preset-typescript'],
      ],
      plugins: [
        'react-native-web',
        '@babel/plugin-transform-runtime',
      ],
    },
  },
};

const imageLoaderConfig = {
  test: /\.(gif|jpe?g|png|svg)$/,
  use: {
    loader: 'url-loader',
    options: { name: '[name].[ext]' },
  },
};

const fontLoaderConfig = {
  test: /\.(ttf|otf|woff|woff2|eot)$/,
  use: {
    loader: 'file-loader',
    options: { name: 'fonts/[name].[ext]' },
  },
};

module.exports = {
  entry: path.join(appDirectory, 'index.web.js'),
  output: {
    path: path.resolve(appDirectory, 'web-build'),
    publicPath: process.env.CRM_PUBLIC_PATH || '/',
    filename: 'bundle.[contenthash].js',
  },
  resolve: {
    extensions: [
      '.web.tsx', '.web.ts', '.web.js',
      '.tsx', '.ts', '.jsx', '.js',
    ],
    alias: {
      // Map react-native to react-native-web
      'react-native$': 'react-native-web',
      // Stub out native-only modules not needed on web
      'react-native-image-picker': path.resolve(appDirectory, 'src/web-stubs/image-picker.js'),
      'react-native-share': path.resolve(appDirectory, 'src/web-stubs/share.js'),
      'react-native-date-picker': path.resolve(appDirectory, 'src/web-stubs/date-picker.js'),
      'react-native-vector-icons': path.resolve(appDirectory, 'src/web-stubs/vector-icons.js'),
    },
  },
  module: {
    rules: [babelLoaderConfig, imageLoaderConfig, fontLoaderConfig],
  },
  ignoreWarnings: [/loose.*class-properties/],
  plugins: [
    new HtmlWebpackPlugin({
      template: path.join(appDirectory, 'public/index.html'),
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      __DEV__: process.env.NODE_ENV !== 'production',
    }),
    // Shim Node.js globals for browser
    new webpack.ProvidePlugin({
      process: 'process/browser',
    }),
  ],
  devServer: {
    port: 3000,
    hot: true,
    historyApiFallback: true,
    static: {
      directory: path.join(appDirectory, 'public'),
    },
  },
};
