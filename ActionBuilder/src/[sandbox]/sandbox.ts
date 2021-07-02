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
            actionName="{{
              actionNameToEdit
                ? 'demoassure_sandbox_' + actionNameToEdit
                : undefined
            }}"
            template-id="first-template"
            view-sas-token="so=demoassure&sn=sandbox&ss=action&sp=r&se=2022-06-07T21:12:12.788Z&sk=sandbox&sig=Q3JWxWIsgsPnvRwdNILRG9wYQV9m4rsEHElSYvgPe30="
            action-read-sas-token="so=demoassure&sn=sandbox&ss=action&sp=r&se=2022-06-07T21:12:12.788Z&sk=sandbox&sig=Q3JWxWIsgsPnvRwdNILRG9wYQV9m4rsEHElSYvgPe30="
            action-write-sas-token="so=demoassure&sn=sandbox&ss=action&sp=w&se=2022-06-14T16:23:02.854Z&sk=sandbox&sig=M9y4tTOzkrCaRmFOVTSGg4GCLWU6xE8knwR4k+Xrf9g="
            base-url="https://uswest-nonprod.cjaas.cisco.com"
          ></cjaas-action-builder>
          </div>
        </div>
      </md-theme>
    `;
  }
}
