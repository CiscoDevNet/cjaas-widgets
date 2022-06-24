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
const TAPE_READ_TOKEN = process.env.DOTENV.TAPE_READ_TOKEN;
// @ts-ignore
const STREAM_READ_TOKEN = process.env.DOTENV.STREAM_READ_TOKEN;
// @ts-ignore
const PROFILE_READ_TOKEN = process.env.DOTENV.PROFILE_READ_TOKEN;
// @ts-ignore
const PROFILE_WRITE_TOKEN = process.env.DOTENV.PROFILE_WRITE_TOKEN;
// @ts-ignore
const IDENTITY_READ_TOKEN = process.env.DOTENV.IDENTITY_READ_TOKEN;
// @ts-ignore
const IDENTITY_WRITE_TOKEN = process.env.DOTENV.IDENTITY_WRITE_TOKEN;

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
    ani: "egiere@cisco.com"
  };

  /**
   * Using Elena's Resource Group
   * API - https://jds-elenatst-westus-api.azurewebsites.net
   * Data sink (Posting Events, Walk in) - https://jds-elenatst-westus-ds.azurewebsites.net
   * Data stream (ReadStreamByPerson) - https://jds-elenatst-westus-st.azurewebsites.net
   * example keyVault, not for this RS: https://devdeploytest-kv.vault.azure.net/
   */
  renderElenaResourceGroupVersion() {
    const containerStyle = `width: ${this.containerWidth}; height: ${this.containerHeight};`;
    return html`
      <div class="toggle">
        ${this.themeToggle()}
      </div>
      <md-theme ?darkTheme=${this.darkTheme} lumos>
        <div class="container">
          <h2 class="sandbox-header">Customer Journey Widget </br><span style="font-size: 12px; font-weight: 100">Dev Version: using dev API endpoints & sasTokens</span></h2>
          <div style=${containerStyle} class="widget-container">
            <customer-journey-widget
              limit="20"
              customer="foobar"
              user-search
              .eventIconTemplate=${iconData}
              base-url="https://jds-elenatst-westus-api.azurewebsites.net"
              .tapeReadToken=${TAPE_READ_TOKEN}
              .streamReadToken=${STREAM_READ_TOKEN}
              .profileReadToken=${PROFILE_READ_TOKEN}
              .profileWriteToken=${PROFILE_WRITE_TOKEN}
              .identityReadToken=${IDENTITY_READ_TOKEN}
              .identityWriteToken=${IDENTITY_WRITE_TOKEN}
            ></customer-journey-widget>
          </div>
        </div>
      </md-theme>
    `;
  }

  /**
   * Another Prod Test environment (https://cjaas-proddeploytest-api.azurewebsites.net)
   */
  renderProdTestVersion() {
    const containerStyle = `width: ${this.containerWidth}; height: ${this.containerHeight};`;
    return html`
      <div class="toggle">
        ${this.themeToggle()}
      </div>
      <md-theme ?darkTheme=${this.darkTheme} lumos>
        <div class="container">
          <h2 class="sandbox-header">Customer Journey Widget </br><span style="font-size: 12px; font-weight: 100">Dev Version: using dev API endpoints & sasTokens</span></h2>
          <div style=${containerStyle} class="widget-container">
            <customer-journey-widget
              limit="20"
              customer="foobar"
              user-search
              .eventIconTemplate=${iconData}
              base-url="https://cjaas-proddeploytest-api.azurewebsites.net"
              template-id="journey-default-template"
              .tapeReadToken=${TAPE_READ_TOKEN}
              .streamReadToken=${STREAM_READ_TOKEN}
              .profileReadToken=${PROFILE_READ_TOKEN}
              .profileWriteToken=${PROFILE_WRITE_TOKEN}
              .identityReadToken=${IDENTITY_READ_TOKEN}
              .identityWriteToken=${IDENTITY_WRITE_TOKEN}
            ></customer-journey-widget>
          </div>
        </div>
      </md-theme>
    `;
  }

  /**
   * http://localhost:5192
   * keyVault: "https://proddeploytest-kv.vault.azure.net/"
   */
   renderLocalProdTestVersion() {
    const containerStyle = `width: ${this.containerWidth}; height: ${this.containerHeight};`;
    return html`
      <div class="toggle">
        ${this.themeToggle()}
      </div>
      <md-theme ?darkTheme=${this.darkTheme} lumos>
        <div class="container">
          <h2 class="sandbox-header">Customer Journey Widget </br><span style="font-size: 12px; font-weight: 100">Dev Version: using dev API endpoints & sasTokens</span></h2>
          <div style=${containerStyle} class="widget-container">
            <customer-journey-widget
              limit="20"
              customer="foobar"
              user-search
              .eventIconTemplate=${iconData}
              base-url="http://localhost:5192"
              .tapeReadToken=${TAPE_READ_TOKEN}
              .streamReadToken=${STREAM_READ_TOKEN}
              .profileReadToken=${PROFILE_READ_TOKEN}
              .profileWriteToken=${PROFILE_WRITE_TOKEN}
              .identityReadToken=${IDENTITY_READ_TOKEN}
              .identityWriteToken=${IDENTITY_WRITE_TOKEN}
            ></customer-journey-widget>
          </div>
        </div>
      </md-theme>
    `;
  }

  /**
   * http://localhost:5192
   * keyVault: "https://devdeploytest-kv.vault.azure.net/"
   */
  renderLocalDevTestVersion() {
    const containerStyle = `width: ${this.containerWidth}; height: ${this.containerHeight};`;
    return html`
      <div class="toggle">
        ${this.themeToggle()}
      </div>
      <md-theme ?darkTheme=${this.darkTheme} lumos>
        <div class="container">
          <h2 class="sandbox-header">Customer Journey Widget </br><span style="font-size: 12px; font-weight: 100">Dev Version: using dev API endpoints & sasTokens</span></h2>
          <div style=${containerStyle} class="widget-container">
            <customer-journey-widget
              limit="20"
              customer="foobar"
              user-search
              .eventIconTemplate=${iconData}
              base-url="http://localhost:5192"
              .tapeReadToken=${TAPE_READ_TOKEN}
              .streamReadToken=${STREAM_READ_TOKEN}
              .profileReadToken=${PROFILE_READ_TOKEN}
              .profileWriteToken=${PROFILE_WRITE_TOKEN}
              .identityReadToken=${IDENTITY_READ_TOKEN}
              .identityWriteToken=${IDENTITY_WRITE_TOKEN}
            ></customer-journey-widget>
          </div>
        </div>
      </md-theme>
    `;
  }

  renderOldDevVersion() {
    const containerStyle = `width: ${this.containerWidth}; height: ${this.containerHeight};`;
    // TODO: Verify that the JavaScript SAS Token script is still working. Below are keys made using Java from Srini
    return html`
      <div class="toggle">
        ${this.themeToggle()}
      </div>
      <md-theme ?darkTheme=${this.darkTheme} lumos>
        <div class="container">
          <h2 class="sandbox-header">Customer Journey Widget </br><span style="font-size: 12px; font-weight: 100">Dev Version: using dev API endpoints & sasTokens</span></h2>
          <div style=${containerStyle} class="widget-container">
            <customer-journey-widget
              limit="20"
              customer="foobar"
              user-search
              .eventIconTemplate=${iconData}
              base-url="https://cjaas-devus2.azurewebsites.net"
              .tapeReadToken=${TAPE_READ_TOKEN}
              .streamReadToken=${STREAM_READ_TOKEN}
              .profileReadToken=${PROFILE_READ_TOKEN}
              .profileWriteToken=${PROFILE_WRITE_TOKEN}
              .identityReadToken=${IDENTITY_READ_TOKEN}
              .identityWriteToken=${IDENTITY_WRITE_TOKEN}
            ></customer-journey-widget>
          </div>
        </div>
      </md-theme>
    `;
  }

  /**
   * Old Prod Version used within QA agent desktop environment
   * */
   renderOldProductionVersion() {
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
            limit="20"
            user-search
            customer="v3nki@cisco.com"
            .interactionData=${this.mockedInteractionData}
            .eventIconTemplate=${iconData}
            base-url="https://uswest-nonprod.cjaas.cisco.com"
            .tapeReadToken=${TAPE_READ_TOKEN}
            .streamReadToken=${STREAM_READ_TOKEN}
            .profileReadToken=${PROFILE_READ_TOKEN}
            .profileWriteToken=${PROFILE_WRITE_TOKEN}
            .identityReadToken=${IDENTITY_READ_TOKEN}
            .identityWriteToken=${IDENTITY_WRITE_TOKEN}
          ></customer-journey-widget>
        </div>
      </div>
    </md-theme>
  `;
  }

  /**
   * New Production Version coming soon
   * BaseUrl      https://jds-prod-pf-westus-apim.azure-api.net
   * Data sink    https://jds-prod-pf-westus-apim.azure-api.net/events
   * Data stream  https://jds-prod-pf-westus-apim.azure-api.net/streams
   * KeyVault     https://jds-prod-pf-westus-kv.vault.azure.net/
   *
   * OrgName      testorg
   * Namespace    sandbox
   * KeyName      testorg
   * */
  renderOfficialProductionVersion() {
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
            limit="20"
            user-search
            customer="foobar"
            base-url="https://jds-us1.cjaas.cisco.com"
            .tapeReadToken=${TAPE_READ_TOKEN}
            .streamReadToken=${STREAM_READ_TOKEN}
            .profileReadToken=${PROFILE_READ_TOKEN}
            .profileWriteToken=${PROFILE_WRITE_TOKEN}
            .identityReadToken=${IDENTITY_READ_TOKEN}
            .identityWriteToken=${IDENTITY_WRITE_TOKEN}
          ></customer-journey-widget>
        </div>
      </div>
    </md-theme>
  `;
  }
  // icon-data-path="https://cjaas.cisco.com/widgets/iconMaps/custom-icons.json"

  /**
   * Official Dev Environment
   * https://jds-dev-pf-westus2-kv.vault.azure.net/
   * wxccmailinator
   * sandbox
   * webexcontactcenter
   */
   renderOfficialDevVersion() {
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
            limit="20"
            user-search
            customer="foobar"
            .eventIconTemplate=${iconData}
            base-url="https://jds-prod-pf-westus2-apim.azure-api.net"
            .tapeReadToken=${TAPE_READ_TOKEN}
            .streamReadToken=${STREAM_READ_TOKEN}
            .profileReadToken=${PROFILE_READ_TOKEN}
            .profileWriteToken=${PROFILE_WRITE_TOKEN}
            .identityReadToken=${IDENTITY_READ_TOKEN}
            .identityWriteToken=${IDENTITY_WRITE_TOKEN}
          ></customer-journey-widget>
        </div>
      </div>
    </md-theme>
  `;
  }

  render() {
    /** You need to make sure you have the sasTokens appropriately defined in your .env file that are associated with dev or prod
      TAPE_TOKEN
      PROFILE_READ_TOKEN
      PROFILE_WRITE_TOKEN
      STREAM_TOKEN
      IDENTITY_READ_SAS_TOKEN
      IDENTITY_WRITE_SAS_TOKEN
    */

    // return this.renderDevVersion();
    // return this.renderProductionVersion();
    // return this.renderProdTestVersion();
    // return this.renderDevTestVersion();
    // return this.renderLocalDevTestVersion();
    // return this.renderLocalProdTestVersion();
    // return this.renderElenaResourceGroupVersion();

    // return this.renderOfficialDevVersion();
    return this.renderOfficialProductionVersion();
  }
}
