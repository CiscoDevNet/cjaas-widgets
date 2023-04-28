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
const BEARER_TOKEN = process.env.DOTENV.BEARER_TOKEN;
// @ts-ignore
const BASE_URL = process.env.DOTENV.BASE_URL;
// @ts-ignore
const ORGANIZATION_ID = process.env.DOTENV.ORGANIZATION_ID;
// @ts-ignore
const WORKSPACE_ID = process.env.DOTENV.WORKSPACE_ID;
// @ts-ignore
const TEMLPATE_ID = process.env.DOTENV.TEMPLATE_ID;
// @ts-ignore
const IDENTITY = process.env.DOTENV.IDENTITY;

import "@momentum-ui/web-components";
import "@cjaas/common-components";
import { customElement, html, internalProperty, LitElement } from "lit-element";
import styles from "./sandbox.scss";
import * as iconData from "@/assets/icons.json";
import * as customIconData from "@/assets/custom-icons.json";
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

  mockedInteractionData = {
    ani: IDENTITY,
    // contactDirection: "OUTBOUND",
    // dnis: "dnis",
  };

  renderWidget() {
    const containerStyle = `width: ${this.containerWidth}; height: ${this.containerHeight};`;

    return html`
    <div class="toggle">
      ${this.themeToggle()}
    </div>
    <md-theme ?darkTheme=${this.darkTheme} lumos>
      <div class="container">
        <h2 class="sandbox-header">Customer Journey Widget </br><span style="font-size: 12px; font-weight: 100">Production Version: using prod API endpoints (same as QA Agent Desktop endpoints & sasTokens)</span></h2>
        <div style=${containerStyle} class="widget-container">
          <customer-journey-widget
            .bearerToken=${BEARER_TOKEN}
            base-url=${BASE_URL}
            .organizationId=${ORGANIZATION_ID}
            .interactionData=${this.mockedInteractionData}
            workspace-id=${WORKSPACE_ID}
            template-id=${TEMLPATE_ID}
            live-stream
            logs-on
            user-search
          ></customer-journey-widget>
        </div>
      </div>
    </md-theme>
  `;
  }

  //   `@prop bearerToken`: (<i>string</i>) - Agent Desktop bearerToken. Look at example to fetch directly from agent desktop store.

  // `@prop interactionData`: (<i>object</i>) - Agent Desktop Interaction Data. Needs to have an `ani` property within object. This allows the JDS Widget to auto-populate with the current customer that the agent is interacting with. This overrides the customer attribute.

  // `@prop organizationId`: (<i>string</i>) - Agent's organizationId. You can fetch it directly from agent desktop store. Check out examples.

  // `@attr base-url`: (<i>String</i>) - Path to the proper Customer Journey API deployment

  // `@attr workspace-id`: (<i>String</i>) - WorkspaceId sets the scope within the selected org. You can obtain this from the admin portal.

  // `@attr template-id`: (<i>String</i>) - Sets the data template to retrieve customer Profile in desired format. You can obtain this by running get All templates Api. You might need to get assistance to create a templateId initially.

  render() {
    /** Update .env file
     * PRIVATE_KEY
     * BEARER_TOKEN
     * BASE_URL
     * ORGANIZATION_ID
     * WORKSPACE_ID
     * TEMPLATE_ID
     * IDENTITY
     */

    return this.renderWidget();
  }
}
