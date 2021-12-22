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
import styles from "./sandbox.scss";
import "..";

@customElement("cjaas-component-sandbox")
export class Sandbox extends LitElement {
  @internalProperty() darkTheme = false;
  @internalProperty() containerWidth = "1000px";
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
    const identityReadToken =
      // "so=wxccmailinator&sn=sandbox&ss=idmt&sp=r&se=2022-12-15T17:13:03.648Z&sk=webexcontactcenter&sig=SBdSxp4mZujTeSDxxfJOL0hGjsExMkXERjvBc92jNEU%3D";
      "so=demoassure&sn=sandbox&ss=idmt&sp=r&se=2024-09-09T16:11:06.254855600Z&sk=venkitest&sig=CTlbxZuc2FeWSlzT38SUYlEYqBz0UROqCAXQPDPaoiQ%3D";
    const identityWriteToken =
      "so=demoassure&sn=sandbox&ss=idmt&sp=w&se=2024-09-09T18:29:51.574147700Z&sk=venkitest&sig=%2BPRGATu1qEvll6N1I3PdIHCKcyRlFwjJQ3aTf32Vl6o%3D";

    return html`
      <div class="toggle">
        ${this.themeToggle()}
      </div>
      <md-theme ?darkTheme=${this.darkTheme} .lumos=${true}>
        <div class="container">
          <h2 class="sandbox-header">Identity Alias</h2>
          <div
            style=${`width: ${this.containerWidth}; height: ${this.containerHeight}; overflow: auto;`}
            class="widget-container"
          >
            <cjaas-identity-alias
              customer="sample"
              .identityReadSasToken=${identityReadToken}
              .identityWriteSasToken=${identityWriteToken}
              base-url-admin="http://cjaas-devus2-admin.azurewebsites.net"
            ></cjaas-identity-alias>
          </div>
          <hr />
          <div
            style=${`width: ${this.containerWidth}; height: ${this.containerHeight}; overflow: auto;`}
            class="widget-container"
          >
            <cjaas-identity-alias
              customer="ninja@a.com"
              minified
              .identityReadSasToken=${identityReadToken}
              .identityWriteSasToken=${identityWriteToken}
              base-url-admin="http://cjaas-devus2-admin.azurewebsites.net"
            ></cjaas-identity-alias>
          </div>
        </div>
      </md-theme>
    `;
  }
}
