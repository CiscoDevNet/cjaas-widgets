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

/**
 * indev2
 */
// const tapeRead =
//   "so=demoassure&sn=sandbox&ss=tape&sp=rw&se=2021-11-26T16:19:25Z&sk=sandbox&sig=Lg7pzrX0N4%2BZRe01jBtaXAilhGKo11NDyE2htctV3hQ%3D";
// const profileWrite =
//   "so=demoassure&sn=sandbox&ss=profile&sp=rw&se=2021-11-26T16:19:25Z&sk=sandbox&sig=L7Q0owQYwg7b7amsHNCSOXd25xi6oRvtnD0Vk%2BH8GM8%3D";
// const stream =
//   "so=demoassure&sn=sandbox&ss=stream&sp=rw&se=2021-11-26T16:19:25Z&sk=sandbox&sig=0SfXq7AQv%2B%2Fm2G6BpQwQgX5ma4VIrFRGsK7avjwj60I%3D";
// const baseURL =
//   "http://cjaas-indev2.azurewebsites.net";
/**
 * devus2
 */
const tapeRead =
  "so=demoassure&sn=sandbox&ss=tape&sp=rw&se=2024-07-24T21:12:36.247Z&sk=journeyUi&sig=6wEgigImeS7ARyMOQpEtfnwNRD6HudtrpWolSSqomZ0%3D";
const profileWrite =
  "so=demoassure&sn=sandbox&ss=profile&sp=rw&se=2024-07-24T21:12:46.413Z&sk=journeyUi&sig=nU5fAZt%2FhxD%2BOS0Lwihj8tbfNMw3Qo8fjQH%2F5uP3Q0M%3D";
const stream =
  "so=demoassure&sn=sandbox&ss=stream&sp=r&se=2024-07-24T21:11:22.995Z&sk=journeyUi&sig=TsOE%2BleLlocOYTU09oCp0zBdiXZDjsM79S1ajlwwoKA%3D";
const baseURL =
  "https://cjaas-devus2.azurewebsites.net";
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
          <h2 class="sandbox-header">Customer Journey Widget</h2>
          <div
            style=${`width: ${this.containerWidth}; height: ${this.containerHeight};`}
            class="widget-container"
          >
            <!-- ONLY TEST USING THE EDGE SERVER, NEVER PRODUCTION SERVER, IT WILL MESS UP THE WALKIN -->
            <!-- CHANGE TO PRODUCTION SERVER WHEN SHIPPING TO WXCC DESKTOP -->
            <customer-journey-widget
              id="timeline-widget"
              customer="30313-Carl"
              user-search
              template-id="second-template"
              .eventIconTemplate=${iconData}
              profile-token=${profileWrite}
              tape-token=${tapeRead}
              stream-token=${stream}
              base-url=${baseURL}
              limit="20"
            ></customer-journey-widget>
          </div>
        </div>
      </md-theme>
    `;
  }
}
