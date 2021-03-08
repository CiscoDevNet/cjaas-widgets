/**
 * Copyright (c) Cisco Systems, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// This file imports all of the webcomponents from "components" folder

import {  customElement } from "lit-element";
import "./components/ActivityStream/ActivityItem";
import { CJSActivityStream } from "./components/ActivityStream/ActivityStream";
import "./components/View/View";

/**
 * Please give your widget a unique name. We recommend using prefix to identify the author and help avoid naming conflict. e.g. "2ring-timer-widget"
 */
@customElement("cjaas-profile-view-widget")
export default class CjaasActivityWidget extends CJSActivityStream {
  async connectedCallback() {
    super.connectedCallback();
  }

  render() {
    return super.render();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
  }
}
