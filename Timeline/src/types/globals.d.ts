/**
 * Copyright (c) Cisco Systems, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import * as lit from "lit-element";

declare global {
  interface Window {
    Webex: any;
  }
  type CSSResult = lit.CSSResult;
}
