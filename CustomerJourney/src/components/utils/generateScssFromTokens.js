/**
 * Copyright (c) Cisco Systems, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");
const handlebars = require("handlebars");
const colorData = require("@momentum-ui/tokens/dist/colors.json");
const fse = require("fs-extra");
const fsPath = require("fs-path");

const _generateFileFromTemplate = async (dest, fileName, data, template) => {
  const source = await fse.readFile(template, "utf8");
  const compile = handlebars.compile(source);
  const finalFile = path.join(dest, fileName);
  await fsPath.writeFile(finalFile, compile(data), err => {
    if (err) throw err;
    else console.warn(`${finalFile} written!`);
  });
};

const generateColorsFromTokens = async () => {
  await _generateFileFromTemplate(
    path.resolve(__dirname, "../wc_scss/colors/vars/"),
    "color-settings.scss",
    colorData,
    path.resolve(__dirname, "../templates/colors-settings.hbs")
  );
  await _generateFileFromTemplate(
    path.resolve(__dirname, "../wc_scss/colors/vars/"),
    "color-utilities.scss",
    colorData,
    path.resolve(__dirname, "../templates/colors.hbs")
  );
};

const _getDeepestKeys = obj => {
  let keys = [];
  for (const key in obj) {
    if (typeof obj[key] === "object") {
      const subkeys = _getDeepestKeys(obj[key]);
      keys = keys.concat(
        subkeys.map(function(subkey) {
          return subkey;
        })
      );
    } else {
      keys.push(key);
    }
  }
  return keys;
};

generateColorsFromTokens();
