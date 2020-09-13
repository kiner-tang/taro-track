const path = require('path');
const EsmWebpackPlugin = require('@purtuga/esm-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const env = process.env.NODE_ENV;

let outputPath;
if(env==='development'){
  const outputProject = '/Users/tangwenhui/iCloud/Desktop/kiner/my-github/taro-track/example';
  outputPath = `${outputProject}/plugins`;
}else{
  outputPath = path.resolve(__dirname, '../dist/plugins');
}

module.exports = {
  mode: 'development',
  target: 'node',
  devtool: "cheap-module-source-map",
  entry: {
    'plugins': './src/plugins/index.ts'
  },
  output: {
    path: outputPath,
    filename: "[name].js",
    library: 'TaroTrackPlugins',
    libraryTarget: "commonjs"
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader'
      }
    ]
  },
  plugins: [
    new CopyWebpackPlugin([
      {
        from: path.resolve(__dirname, '../src/plugins/package.json'),
        to: `${outputPath}/package.json`
      }
    ])
  ],
  resolve: {
    alias: {
      "@/src": path.resolve(__dirname, '../src'),
      "@/core": path.resolve(__dirname, '../src/core'),
      "@/common": path.resolve(__dirname, '../src/common'),
      "@/datasource": path.resolve(__dirname, '../src/datasource'),
      "@/transporter": path.resolve(__dirname, '../src/transporter'),
      "@/entry": path.resolve(__dirname, '../src/entry'),
    },
    extensions: ['.js', '.ts']
  }
};
