import path from 'path';
import webpack from 'webpack';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';

if (typeof process.env['NODE_ENV'] === 'undefined') {
  process.env['NODE_ENV'] = 'developement';
}

const conf = {
  entry: {
    app: [
      './src/index.ts',
    ],
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'js/[name].[hash:4].js',
    publicPath: '/',
  },
  resolve: {
    extensions: ['.ts', '.tsx', 'index.ts', 'index.tsx', '.js', '.jsx', 'index.js', 'index.jsx'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        include: path.resolve(__dirname, 'src'),
        loader: 'babel-loader',
      },
      {
        test: /\.(jpe?g|png|gif|svg)$/i,
        include: path.resolve(__dirname, 'src/assets'),
        use: [
          {
            loader: 'file-loader',
            options: {
              context: 'src/assets',
              name: 'assets/[path][name].[ext]',
            },
          },
        ],
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  optimization: {
    splitChunks: {
      cacheGroups: {
        commons: {
          test: /[\\/]node_modules[\\/]/,
          name: 'lib',
          chunks: 'all',
        },
      },
    },
  },
  plugins: [
    new CleanWebpackPlugin(),
    new webpack.EnvironmentPlugin([
      'NODE_ENV',
    ]),
    new webpack.DefinePlugin({
      env: JSON.stringify({
        NODE_ENV: process.env['NODE_ENV'],
      }),
    }),
    new HtmlWebpackPlugin({
      title: process.env['TITLE'],
      template: 'src/template.ejs',
      minify: {
        collapseBooleanAttributes: true,
        collapseInlineTagWhitespace: true,
        collapseWhitespace: true,
        decodeEntities: true,
        html5: true,
        minifyCSS: true,
        minifyJS: true,
        preventAttributesEscaping: true,
        removeComments: true,
      },
    }),
  ],
  devServer: {
    contentBase: path.join(__dirname, 'dist'),
    compress: true,
    host: '0.0.0.0',
    port: 8080,
    historyApiFallback: {
      rewrites: [
        {
          from: /^(?!\/(favicon\.ico|js|css|lib|assets)).*$/,
          to: '/index.html',
        },
      ],
    },
  },
};

export default conf;
