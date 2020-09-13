const path = require('path');
const EsmWebpackPlugin = require('@purtuga/esm-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');


const env = process.env.NODE_ENV;

let outputPath;
if(env==='development'){
  const outputProject = '/Users/tangwenhui/iCloud/Desktop/kiner/my-github/taro-track/example';
  outputPath = `${outputProject}/es`;
}else{
  outputPath = path.resolve(__dirname, '../dist/es');
}


module.exports = {
  mode: env,
  entry: {
    'TaroTrack': './src/es/taro-track.ts'
  },
  devtool: "cheap-module-source-map",
  output: {
    // path: '/Users/tangwenhui/Desktop/kiner/learning/dolphin-wx-taro-demo/plugins',
    path: outputPath,
    filename: "[name].js",
    library:"TaroTrack",
    libraryTarget:"var",
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
    new EsmWebpackPlugin(),
    new CopyWebpackPlugin([
      {
        from: path.resolve(__dirname, '../src/es/package.json'),
        to: path.resolve(__dirname, '../dist/es/package.json')
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
