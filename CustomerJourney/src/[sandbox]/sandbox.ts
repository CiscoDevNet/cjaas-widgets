/**
 * Copyright (c) Cisco Systems, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import "@momentum-ui/web-components";
import "@cjaas/common-components";
import { customElement, html, internalProperty, LitElement } from "lit-element";
import { sampleTemplate } from "./sandbox.mock";
import styles from "./sandbox.scss";
import * as iconData from "@/assets/icons.json";
import "..";

const tapeWrite =
  "so=demoassure&sn=sandbox&ss=tape&sp=w&se=2049-02-22T16:43:50.607Z&sk=sandbox&sig=%2F6FXalQwJeMHF8vpelI4Hr1rBCnMADmSVEr2CULVvPk%3D";
const tapeRead =
  "so=demoassure&sn=sandbox&ss=tape&sp=r&se=2049-02-22T16:44:19.899Z&sk=sandbox&sig=zfaMLDT15AoCvrWle0HSezBwgETtXs5JMTMQDaIkWkQ%3D ";
const profileWrite =
  "so=demoassure&sn=sandbox&ss=profile&sp=w&se=2049-02-22T16:45:11.988Z&sk=sandbox&sig=KLtI6vyZXMvvymFjqSR2EOJzeULzm43T6y3HTf63qus%3D ";
const stream =
  "so=demoassure&sn=sandbox&ss=stream&sp=r&se=2049-02-22T16:45:54.572Z&sk=sandbox&sig=Ao2mLkSfBmnQH%2B87LvkIrulx61Bpb5fxFch6lwOLu78%3D";

@customElement("cjaas-component-sandbox")
export class Sandbox extends LitElement {
  @internalProperty() darkTheme = false;
  @internalProperty() containerWidth = "80vw";
  @internalProperty() containerHeight = "80vh";
  @internalProperty() selectedComponent = "Activity Item";
  static get styles() {
    return styles;
  }

  themeToggle() {
    return html`
      <div class="toggle-container">
        <md-checkbox
          type="checkbox"
          id="theme-switch"
          class="theme-switch"
          data-aspect="darkTheme"
          label="Dark Mode"
          @checkbox-change=${(e: MouseEvent) => this.toggleSetting(e)}
          ?checked=${this.darkTheme}
          >Dark Mode</md-checkbox
        >
        <div class="switch-container">
          <md-label class="switch" text="Responsive">
            Widget Boundary
          </md-label>
          <md-input
            type="text"
            id="width-switch"
            class="theme-switch"
            data-aspect="responsive-width"
            @click=${(e: MouseEvent) => this.toggleSetting(e)}
            @input-change=${(e: MouseEvent) => this.toggleSetting(e)}
            value=${this.containerWidth}
          ></md-input>
          <md-label>x</md-label>
          <md-input
            type="text"
            id="height-switch"
            class="theme-switch"
            data-aspect="responsive-height"
            @click=${(e: MouseEvent) => this.toggleSetting(e)}
            @input-change=${(e: MouseEvent) => this.toggleSetting(e)}
            value=${this.containerHeight}
          ></md-input>
        </div>
      </div>
    `;
  }

  toggleSetting(e: MouseEvent) {
    const composedPath = e.composedPath();
    const target = (composedPath[0] as unknown) as HTMLInputElement;
    const aspect: string = target.dataset.aspect!;
    if (aspect === "responsive-width") {
      this.containerWidth = target.value;
    } else if (aspect === "responsive-height") {
      this.containerHeight = target.value;
    } else if (aspect === "darkTheme") {
      this.darkTheme = !this.darkTheme;
    } else return console.error("Invalid data-aspect input");
  }

  render() {
    return html`
      <div class="toggle">
        ${this.themeToggle()}
      </div>
      <md-theme ?darkTheme=${this.darkTheme} lumos>
        <div class="container">
          <h2 class="sandbox-header">Timeline</h2>
          <div
            style=${`width: ${this.containerWidth}; height: ${this.containerHeight};`}
            class="widget-container"
          >
            <customer-journey-widget
              id="timeline-widget"
              customer="98126-Kevin"
              .template=${sampleTemplate}
              .eventIconTemplate=${iconData}
              write-token=${profileWrite}
              tape-token=${tapeRead}
              stream-token=${stream}
              base-url="https://uswest-nonprod.cjaas.cisco.com"
              limit="20"
            ></customer-journey-widget>
          </div>
        </div>
      </md-theme>
    `;
  }
}
