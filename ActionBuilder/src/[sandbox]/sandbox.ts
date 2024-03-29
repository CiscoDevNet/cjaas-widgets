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
import { mockAction, mockTemplate } from "./sandbox.mock";

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
    const actionWriteToken =
      "so=demoassure&sn=sandbox&ss=action&sp=w&se=2022-05-11T13:22:08.805233600Z&sk=journeyUi&sig=hJdP4WxKLF1fb49mX1%2BRYGjDvgRiv0dOaBbjR48PVj8%3D";
    const actionReadToken =
      "so=demoassure&sn=sandbox&ss=action&sp=r&se=2022-05-11T13:22:08.806142200Z&sk=journeyUi&sig=4Bq8ZMkj9qXZDkiiVLOWwD29KoXZBAHU7HawFyW8J1M%3D";
    const profileReadToken =
      "so=demoassure&sn=sandbox&ss=profile&sp=r&se=2022-05-11T13:22:08.799987400Z&sk=journeyUi&sig=6TrHnhzW74AZFqXDAV9DZHC1CcV7cn2rAF3Q4tCkIOs%3D";
    return html`
      <div class="toggle">
        ${this.themeToggle()}
      </div>
      <md-theme ?darkTheme=${this.darkTheme}>
        <div class="container">
          <h2 class="sandbox-header">Action Builder</h2>
          <div
            style=${`width: ${this.containerWidth}; height: ${this.containerHeight}; overflow: auto;`}
            class="widget-container"
          >
            <cjaas-action-builder
              .mockTemplate=${mockTemplate}
              template-id="first-template"
              .viewSasToken=${profileReadToken}
              .actionReadSasToken=${actionReadToken}
              .actionWriteSasToken=${actionWriteToken}
              base-url="https://uswest-nonprod.cjaas.cisco.com"
            ></cjaas-action-builder>
          </div>
          <hr />
          <div
            style=${`width: ${this.containerWidth}; height: ${this.containerHeight}; overflow: auto;`}
            class="widget-container"
          >
            <cjaas-action-builder
              action-name="test Nested"
              template-id="first-template"
              .viewSasToken=${profileReadToken}
              .actionReadSasToken=${actionReadToken}
              .actionWriteSasToken=${actionWriteToken}
              base-url="https://cjaas-devus1-edge.azurewebsites.net"
            ></cjaas-action-builder>
          </div>
        </div>
      </md-theme>
    `;
  }
}
