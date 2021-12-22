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
//@ts-ignore
const PRIVATE_KEY = process.env.DOTENV.PRIVATE_KEY;
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
              tape-token="so=demoassure&sn=sandbox&ss=tape&sp=r&se=2022-11-23T20:33:44.019Z&sk=journeyUi&sig=Msa4zTsNmkeDHJcmQuXUVHTTzs1KATCQ%2FDNrVR2O7eU%3D"
              stream-token="so=demoassure&sn=sandbox&ss=stream&sp=r&se=2022-11-23T20:30:20.765Z&sk=journeyUi&sig=76cI1nBPkA0HdQved8YHiTQbOThPOR8W5UdwZzeUuPc%3D"
              profile-read-token="so=demoassure&sn=sandbox&ss=profile&sp=rw&se=2022-11-23T20:34:23.108Z&sk=journeyUi&sig=JydFx80vys0KNr8JwwgsUSPrj3y5fnLpj5afX9h2Hxc%3D"
              identity-read-sas-token="so=demoassure&sn=sandbox&ss=idmt&sp=r&se=2024-09-09T16:11:06.254855600Z&sk=venkitest&sig=CTlbxZuc2FeWSlzT38SUYlEYqBz0UROqCAXQPDPaoiQ%3D"
              identity-write-sas-token="so=demoassure&sn=sandbox&ss=idmt&sp=w&se=2024-09-09T18:29:51.574147700Z&sk=venkitest&sig=%2BPRGATu1qEvll6N1I3PdIHCKcyRlFwjJQ3aTf32Vl6o%3D"
            ></customer-journey-widget>
          </div>
        </div>
      </md-theme>
    `;
  }
}
