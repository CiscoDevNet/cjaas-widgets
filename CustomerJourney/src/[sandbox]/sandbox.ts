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
const ENV: any = process.env.DONTENV;
const PRIVATE_KEY = ENV.PRIVATE_KEY;
const TAPE_TOKEN = ENV.TAPE_TOKEN;
const STREAM_TOKEN = ENV.STREAM_TOKEN;
const PROFILE_READ_TOKEN = ENV.PROFILE_READ_TOKEN;
const IDENTITY_READ_SAS_TOKEN = ENV.IDENTITY_READ_SAS_TOKEN;
const IDENTITY_WRITE_SAS_TOKEN = ENV.IDENTITY_WRITE_SAS_TOKEN;

const ORGANIZATION = "demoassure";
const NAMESPACE = "sandbox";
const APP_NAME = "journeyUi";

import "@momentum-ui/web-components";
import "@cjaas/common-components";
import { customElement, html, internalProperty, LitElement } from "lit-element";
import styles from "./sandbox.scss";
import * as iconData from "@/assets/icons.json";
import "..";
import { generateSasToken, TokenArgs } from "../generatesastoken";
/**
 * Private SAS Tokens generated and stored in component instance
 */

function getTokens() {
  return {
    getTToken: function() {
      const tapeArgs: TokenArgs = {
        secret: PRIVATE_KEY!,
        organization: ORGANIZATION!,
        namespace: NAMESPACE!,
        service: "tape",
        permissions: "r",
        keyName: APP_NAME!,
        expiration: 1000,
      };
      return generateSasToken(tapeArgs);
    },

    getSToken: function() {
      const tapeArgs: TokenArgs = {
        secret: PRIVATE_KEY!,
        organization: ORGANIZATION!,
        namespace: NAMESPACE!,
        service: "stream",
        permissions: "r",
        keyName: APP_NAME!,
        expiration: 1000,
      };
      return generateSasToken(tapeArgs);
    },

    getPToken: function() {
      const tapeArgs: TokenArgs = {
        secret: PRIVATE_KEY!,
        organization: ORGANIZATION!,
        namespace: NAMESPACE!,
        service: "profile",
        permissions: "rw",
        keyName: APP_NAME!,
        expiration: 1000,
      };
      return generateSasToken(tapeArgs);
    },
  };
}

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
    const { getTToken, getSToken, getPToken } = getTokens();
    return html`
      <div class="toggle">
        ${this.themeToggle()}
      </div>
      <md-theme ?darkTheme=${this.darkTheme} lumos>
        <div class="container">
          <h2 class="sandbox-header">Customer Journey Widget</h2>
          <div
            style=${`width: ${this.containerWidth}; height: ${this.containerHeight};`}
            class="widget-container"
          >
            <!-- CHANGE TO PRODUCTION SERVER WHEN SHIPPING TO WXCC DESKTOP -->
            <customer-journey-widget
              limit="20"
              customer="sample"
              user-search
              .eventIconTemplate=${iconData}
              base-url="https://cjaas-devus2.azurewebsites.net"
              base-url-admin="http://cjaas-devus2-admin.azurewebsites.net"
              tape-token=${TAPE_TOKEN}
              stream-token=${STREAM_TOKEN}
              profile-read-token=${PROFILE_READ_TOKEN}
              identity-read-sas-token=${IDENTITY_READ_SAS_TOKEN}
              identity-write-sas-token=${IDENTITY_WRITE_SAS_TOKEN}
            ></customer-journey-widget>
          </div>
        </div>
      </md-theme>
    `;
  }
}
