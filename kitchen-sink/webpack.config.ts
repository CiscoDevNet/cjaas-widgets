/* eslint-disable @typescript-eslint/no-explicit-any */
import { CleanWebpackPlugin } from "clean-webpack-plugin";
import CopyWebpackPlugin from "copy-webpack-plugin";
import * as fs from "fs";
import * as path from "path";
import * as webpack from "webpack";
import merge from "webpack-merge";
import HtmlWebpackPlugin from "html-webpack-plugin";

const pSrc = path.resolve("src");
export const pBuild = path.resolve("build");
const pCss = path.resolve("src/assets/styles");
const pImg = path.resolve("src/assets/images");

const p1 = path.resolve("./node_modules/@momentum-ui");
const p2 = path.resolve("../node_modules/@momentum-ui");
const pMomentum = fs.existsSync(p1) ? p1 : fs.existsSync(p2) ? p2 : null;
if (!pMomentum) {
  throw new Error("Can't find Momentum UI");
}

const common: webpack.Configuration = {
  output: {
    publicPath: "/"
  },
  resolve: {
    extensions: [".ts", ".js", ".scss"],
    alias: {
      "@": pSrc,
      "@css": pCss,
      "@img": pImg
    }
  },
  module: {
    rules: [
      {
        test: /\.(png|svg|jpe?g)$/,
        use: {
          loader: "file-loader",
          options: {
            name: "images-cjaas-common/[name].[hash:8].[ext]",
            esModule: false
          }
        }
      }
    ]
  }
};

function ruleTS({ isDev }: { isDev: boolean }) {
  return {
    test: /\.ts$/,
    loader: "ts-loader",
    include: pSrc,
    options: {
      compilerOptions: {
        declarationMap: isDev,
        sourceMap: isDev
      }
    }
  };
}

function ruleCSS({ isDev }: { isDev: boolean }) {
  return {
    test: /\.scss$/,
    use: [
      { loader: "lit-scss-loader", options: { minify: !isDev } },
      { loader: "extract-loader" },
      { loader: "css-loader", options: { sourceMap: isDev, importLoaders: 2 } },
      { loader: "sass-loader", options: { sourceMap: isDev } },
      {
        loader: "alias-resolve-loader",
        options: {
          alias: {
            "@css": pCss,
            "@img": pImg
          }
        }
      }
    ],
    include: pSrc
  };
}

// DEV
// ----------

export const commonDev = merge(common, {
  name: "dev",
  mode: "development",
  devtool: "source-map",
  entry: "./src/index.ts",
  output: {
    path: pBuild
  },
  module: {
    rules: [ruleTS({ isDev: true }), ruleCSS({ isDev: true })]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./src/index.html"
    }),
    new CopyWebpackPlugin([
      { from: `${pMomentum}/core/fonts`, to: "fonts" },
      { from: `${pMomentum}/core/images`, to: "images" },
      { from: `${pMomentum}/icons/fonts`, to: "icons/fonts" },
      { from: `${pMomentum}/icons/fonts`, to: "fonts" },
      { from: `${pMomentum}/core/css/momentum-ui.min.css`, to: "css" },
      { from: `${pMomentum}/core/css/momentum-ui.min.css.map`, to: "css" },
      { from: `${pMomentum}/icons/css/momentum-ui-icons.min.css`, to: "css" },
      { from: `${pCss}/*.css`, to: "css", flatten: true },
    ])
  ]
});

const dev = merge(commonDev, {
  plugins: [new CleanWebpackPlugin()]
});
