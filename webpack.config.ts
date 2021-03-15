const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin")
const fs = require("fs");

const pSrc = path.resolve("src");
// const pDist = path.resolve("dist");
// export const pBuild = path.resolve("build");
const pAssets = path.resolve("src/assets");
const pCss = path.resolve("src/assets/styles");
// const pImg = path.resolve("src/assets/images");

const p1 = path.resolve("./node_modules/@momentum-ui");
const p2 = path.resolve("../node_modules/@momentum-ui");
const pMomentum = fs.existsSync(p1) ? p1 : fs.existsSync(p2) ? p2 : null;
if (!pMomentum) {
  throw new Error("Can't find Momentum UI");
}


module.exports = {
  devServer: {
    historyApiFallback: true,
  },
  mode: "development",
  entry: "./index.ts",
  output: {
    filename: "main.js",
    path: path.resolve(__dirname, "dist"),
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            plugins: [
              [
                "@babel/plugin-proposal-decorators",
                { decoratorsBeforeExport: true },
              ],
              ["@babel/plugin-proposal-class-properties", { loose: true }],
            ],
          },
        },
      },
      { test: /\.ts$/, loader: "ts-loader" },
      {
        test: /\.scss$/,
        use: [
          { loader: "lit-scss-loader", options: { minify: false } },
          { loader: "extract-loader" },
          { loader: "css-loader", options: { sourceMap: true, importLoaders: 2 } },
          { loader: "sass-loader", options: { sourceMap: true } },
          {
            loader: "alias-resolve-loader",
            options: {
              alias: {
                "@css": pCss,
              }
            }
          }
        ],
        include: pSrc
      }
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      chunksSortMode: "none",
      template: "./kitchen-sink/index.html",
    }),
    new CopyWebpackPlugin([
      { from: `${pMomentum}/core/fonts`, to: "fonts" },
      { from: `${pMomentum}/core/images`, to: "images" },
      { from: `${pMomentum}/core/css/momentum-ui.min.css`, to: "css" },
      { from: `${pMomentum}/core/css/momentum-ui.min.css.map`, to: "css" },
      { from: `${pMomentum}/icons/fonts`, to: "fonts" },
      { from: `${pMomentum}/icons/fonts`, to: "icons/fonts" },
      { from: `${pMomentum}/icons/css/momentum-ui-icons.min.css`, to: "css" }
    ])
  ],
};
