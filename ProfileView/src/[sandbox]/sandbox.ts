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
import "..";
import styles from "./sandbox.scss";
import { sampleTemplate } from "./sandbox.mock";

/**
 * devus2
 */
 const tapeRead = "SET SAS TOKEN HERE"
const profileWrite = "SET SAS TOKEN HERE"
const stream = "SET SAS TOKEN HERE"
const baseURL = "https://cjaas-devus2.azurewebsites.net";
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
    return html`
      <div class="toggle">
        ${this.themeToggle()}
      </div>
      <md-theme ?darkTheme=${this.darkTheme}>
        <div class="container">
          <h2 class="sandbox-header">Profile</h2>
          <div
            style=${`width: ${this.containerWidth}; height: ${this.containerHeight}; overflow: auto;`}
            class="widget-container"
          >
            <!-- ONLY TEST USING THE EDGE SERVER, NEVER PRODUCTION SERVER, IT WILL MESS UP THE WALKING -->
            <cjaas-profile-view-widget
              id="view"
              template-id="second-template"
              customer="30313-Carl"
              profile-token=${profileWrite}
              tape-read-token=${tapeRead}
              stream-read-token=${stream}
              base-url=${baseURL}
            ></cjaas-profile-view-widget>
          </div>
          <!-- <div
            style=${`width: ${this.containerWidth}; height: ${this.containerHeight}; overflow: auto;`}
            class="widget-container"
          >
            <cjaas-profile-view-widget
              id="view"
              customer="560021-Venki"
              .template=${sampleTemplate}
              timelineType="journey-and-stream"
              base-url="https://cjaas-devus1-edge.azurewebsites.net"
            >
              <h3 slot="l10n-header-text">Texto de encabezado personalizado</h3>
              <h4 slot="l10n-no-data-message">No hay datos para mostrar</h4>
              <h4 slot="l10n-no-profile-message">No hay perfil disponible</h4>
            </cjaas-profile-view-widget>
          </div> -->
        </div>
      </md-theme>
    `;
  }
}
