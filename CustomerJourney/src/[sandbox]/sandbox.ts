/**
 * Copyright (c) Cisco Systems, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * ATTENTION: Apps using this widget must provide the following values from the application configuration.
 * These details allow easy and discreet generation of SAS tokens with correct permissions needed to access the API.
 */
// @ts-ignore
const TAPE_TOKEN = process.env.DOTENV.TAPE_TOKEN;
// @ts-ignore
const STREAM_TOKEN = process.env.DOTENV.STREAM_TOKEN;
// @ts-ignore
const PROFILE_READ_TOKEN = process.env.DOTENV.PROFILE_READ_TOKEN;
// @ts-ignore
const PROFILE_WRITE_TOKEN = process.env.DOTENV.PROFILE_WRITE_TOKEN;
// @ts-ignore
const IDENTITY_READ_SAS_TOKEN = process.env.DOTENV.IDENTITY_READ_SAS_TOKEN;

// @ts-ignore
const IDENTITY_WRITE_SAS_TOKEN = process.env.DOTENV.IDENTITY_WRITE_SAS_TOKEN;

import "@momentum-ui/web-components";
import "@cjaas/common-components";
import { customElement, html, internalProperty, LitElement } from "lit-element";
import styles from "./sandbox.scss";
import * as iconData from "@/assets/icons.json";
import "..";

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
    // TODO: Verify that the JavaScript SAS Token script is still working. Below are keys made using Java from Srini
    return html`
      <div class="toggle">
        ${this.themeToggle()}
      </div>
      <md-theme ?darkTheme=${this.darkTheme} lumos>
        <div class="container">
          <h2 class="sandbox-header">Customer Journey Widget</h2>
          <div style=${`width: ${this.containerWidth}; height: ${this.containerHeight};`} class="widget-container">
            <!-- CHANGE TO PRODUCTION SERVER WHEN SHIPPING TO WXCC DESKTOP -->
            <customer-journey-widget
              limit="20"
              customer="sample"
              user-search
              .eventIconTemplate=${iconData}
              base-url="https://cjaas-devus2.azurewebsites.net"
              base-url-admin="http://cjaas-devus2-admin.azurewebsites.net"
              .tapeToken=${TAPE_TOKEN}
              .streamToken=${STREAM_TOKEN}
              .profileReadToken=${PROFILE_READ_TOKEN}
              .profileWriteToken=${PROFILE_WRITE_TOKEN}
              .identityReadSasToken=${IDENTITY_READ_SAS_TOKEN}
              .identityWriteSasToken=${IDENTITY_WRITE_SAS_TOKEN}
            ></customer-journey-widget>
          </div>
        </div>
      </md-theme>
    `;
  }
}
