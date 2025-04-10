const path = require("path");
const HTMLPlugin = require("html-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  entry: {
    index: "./src/index.tsx",
    options: "./src/options.tsx",
    background: "./src/scripts/background.ts",
    content: "./src/scripts/content.ts"
  },
  mode: "development", // Changed to development for easier debugging
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'js/[name].js',
    clean: true, // Clean the output directory before emit
  },
  plugins: [
    new HTMLPlugin({
      template: './src/popup.html',
      filename: 'index.html',
      chunks: ['index'],
    }),
    new HTMLPlugin({
      template: './src/options.html',
      filename: 'options.html',
      chunks: ['options'],
    }),
    new CopyPlugin({
      patterns: [
        { from: "manifest.json" },
        { from: "src/assets", to: "assets" },
        { from: "src/content.css" },
      ],
    }),
  ],
};
