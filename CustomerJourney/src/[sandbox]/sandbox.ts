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
        expiration: 1000
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
        expiration: 1000
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
        expiration: 1000
      };
      return generateSasToken(tapeArgs);
    }
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
    const {getTToken, getSToken, getPToken} = getTokens();
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
              customer="30313-Carl"
              user-search
              .eventIconTemplate=${iconData}
              profile-read-token="so=demoassure&sn=sandbox&ss=profile&sp=r&se=2024-07-03T17:12:28.082618200Z&sk=sandbox&sig=NiOhZ13iRNK6h1wkdNXfHSZ6abo%2FKhvVj7LE60a%2F7Lg%3D"
              profile-write-token="so=demoassure&sn=sandbox&ss=profile&sp=w&se=2049-02-22T16:45:11.988Z&sk=sandbox&sig=KLtI6vyZXMvvymFjqSR2EOJzeULzm43T6y3HTf63qus%3D"
              tape-token="so=demoassure&sn=sandbox&ss=tape&sp=r&se=2049-02-22T16:44:19.899Z&sk=sandbox&sig=zfaMLDT15AoCvrWle0HSezBwgETtXs5JMTMQDaIkWkQ%3D"
              stream-token="so=demoassure&sn=sandbox&ss=stream&sp=r&se=2049-02-22T16:45:54.572Z&sk=sandbox&sig=Ao2mLkSfBmnQH%2B87LvkIrulx61Bpb5fxFch6lwOLu78%3D"
              base-url="https://cjaas-devus1-edge.azurewebsites.net"
            ></customer-journey-widget>
          </div>
        </div>
      </md-theme>
    `;
  }
}