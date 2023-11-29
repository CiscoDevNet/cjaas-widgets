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
const PROJECT_ID = process.env.DOTENV.PROJECT_ID;
// @ts-ignore
const TEMLPATE_ID = process.env.DOTENV.TEMPLATE_ID;
// @ts-ignore
const IDENTITY = process.env.DOTENV.IDENTITY;

import "@momentum-ui/web-components";
import { customElement, html, internalProperty, LitElement } from "lit-element";
import styles from "./sandbox.scss";
import * as iconData from "@/assets/icons.json";
import * as customIconData from "@/assets/sandbox/custom-icons.json";
import "..";
import { mockedInteractionData } from "./sandbox.mock";

@customElement("cjaas-component-sandbox")
export class Sandbox extends LitElement {
  @internalProperty() darkTheme = false;
  @internalProperty() containerWidth = "99vw";
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
            .interactionData=${mockedInteractionData("INBOUND", IDENTITY)}
            project-id=${PROJECT_ID}
            logs-on
          ></customer-journey-widget>
        </div>
      </div>
    </md-theme>
  `;
  }

  render() {
    /** Update .env file
     * PRIVATE_KEY
     * BEARER_TOKEN
     * BASE_URL
     * ORGANIZATION_ID
     * PROJECT_ID
     * TEMPLATE_ID
     * IDENTITY
     */

    return this.renderWidget();
  }
}
