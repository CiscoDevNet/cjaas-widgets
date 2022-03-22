/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Copyright (c) Cisco Systems, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { CleanWebpackPlugin } from "clean-webpack-plugin";
import CopyWebpackPlugin from "copy-webpack-plugin";
import HtmlWebpackPlugin from "html-webpack-plugin";
import * as path from "path";
import RemovePlugin from "remove-files-webpack-plugin";
import * as webpack from "webpack";
import merge from "webpack-merge";
import dotenv from "dotenv";
const pSrc = path.resolve("src");
const pDist = path.resolve("dist");
export const pBuild = path.resolve("build");
const pAssets = path.resolve("src/assets");
const pCss = path.resolve("src/assets/styles");
const pImg = path.resolve("src/assets/images");
const pModules = path.resolve("node_modules");

// Copy Fonts and Icons
const copyFontsAndIcons = (prefix: string) => {
  const instructions = [
    { from: `${pModules}/@momentum-ui/core/fonts`, to: prefix + "fonts" },
    { from: `${pModules}/@momentum-ui/core/images`, to: prefix + "images" },
    {
      from: `${pModules}/@momentum-ui/core/css/momentum-ui.min.css`,
      to: prefix + "css",
    },
    {
      from: `${pModules}/@momentum-ui/core/css/momentum-ui.min.css.map`,
      to: prefix + "css",
    },
    { from: `${pModules}/@momentum-ui/icons/fonts`, to: prefix + "fonts" },
    {
      from: `${pModules}/@momentum-ui/icons/fonts`,
      to: prefix + "icons/fonts",
    },
    {
      from: `${pModules}/@momentum-ui/icons/css/momentum-ui-icons.min.css`,
      to: prefix + "css",
    },
  ];
  if (prefix === "finesse/") {
    instructions.push({
      from: `${pSrc}/finesse/CiscoJDSCustomerJourneyGadget.xml`,
      to: prefix,
    });
  }

  return new CopyWebpackPlugin(instructions);
};

const envSetup = dotenv.config({
  path: path.join(__dirname, ".env"),
});

const common: webpack.Configuration = {
  entry: {
    index: "./src/index.ts",
    "finesse/customer-journey-bootstrap": "./src/finesse/bootstrap.ts",
    "finesse/customer-journey": "./src/index.ts",
    "finesse/customer-journey-wrapper": "./src/wrapper.ts",
  },
  output: {
    publicPath: "/",
  },
  resolve: {
    extensions: [".ts", ".js", ".scss"],
    alias: {
      "@": pSrc,
      "@css": pCss,
      "@img": pImg,
    },
  },
  module: {
    rules: [
      {
        test: /\.(png|svg|jpe?g)$/,
        use: {
          loader: "file-loader",
          options: {
            name: "images-mfe-wc/[name].[hash:8].[ext]",
            esModule: false,
          },
        },
        include: pSrc,
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      "process.env.DOTENV": JSON.stringify(envSetup.parsed),
    }),
    copyFontsAndIcons(""),
    copyFontsAndIcons("finesse/"),
  ],
};

function ruleTS({ isDev }: { isDev: boolean }) {
  return {
    test: /\.ts$/,
    loader: "ts-loader",
    include: pSrc,
    options: {
      compilerOptions: {
        declarationMap: isDev,
        sourceMap: isDev,
      },
    },
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
            "@img": pImg,
          },
        },
      },
    ],
    include: pSrc,
  };
}

// DEV
// ----------

export const commonDev = merge(common, {
  name: "dev",
  mode: "development",
  devtool: "source-map",
  entry: "./src/[sandbox]/sandbox.ts",
  output: {
    path: pBuild,
  },
  module: {
    rules: [ruleTS({ isDev: true }), ruleCSS({ isDev: true })],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./src/[sandbox]/index.html",
      favicon: "./src/[sandbox]/favicon.ico",
    }),
    copyFontsAndIcons(""),
  ],
});

const dev = merge(commonDev, {
  plugins: [new CleanWebpackPlugin()],
});

// DIST
// ----------

const commonDist = merge(common, {
  output: {
    path: pDist,
    filename: "[name].js",
    libraryTarget: "umd",
  },
  plugins: [
    new CleanWebpackPlugin(),
    new RemovePlugin({
      after: {
        log: false,
        include: ["./dist/types/[sandbox]"],
        test: [
          {
            folder: "./dist/types",
            method: (p: string) => new RegExp(/\.test\.d\.ts(\.map)*$/).test(p),
            recursive: true,
          },
        ],
      },
    }) as any,
    new webpack.DefinePlugin({
      "process.env.DOTENV": JSON.stringify(envSetup.parsed),
    }),
  ],
});

const distDev = merge(commonDist, {
  name: "distDev",
  mode: "development",
  devtool: "source-map",
  module: {
    rules: [ruleTS({ isDev: true }), ruleCSS({ isDev: true })],
  },
});

const distDevWatch = merge(distDev, {
  name: "distDevWatch",
  watch: true,
});

const distProd = merge(commonDist, {
  name: "distProd",
  mode: "production",
  module: {
    rules: [ruleTS({ isDev: false }), ruleCSS({ isDev: false })],
  },
});

export default [dev, distDev, distDevWatch, distProd];
