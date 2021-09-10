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
            <!-- We might need this read token very soon -->
            <!-- profile-read-token="so=demoassure&sn=sandbox&ss=profile&sp=r&se=2022-06-17T23:47:34.409Z&sk=sandbox&sig=61BLCJ5+vZtOOvut/7khUQyg0N9KlvbPrJWrYa9lf28=" -->
            <cjaas-profile-view-widget
              id="view"
              customer="30313-Carl"
              .template=${sampleTemplate}
              profile-write-token="so=demoassure&sn=sandbox&ss=profile&sp=w&se=2022-06-17T21:36:08.050Z&sk=sandbox&sig=gm%2FXQ%2Bjtu8uWPrUtpRfR6P4DHwrJV2CJokIH3BcgzdE%3D"
              tape-read-token="so=demoassure&sn=sandbox&ss=tape&sp=r&se=2022-06-16T19:11:33.176Z&sk=sandbox&sig=7G8UdEipQHnWOV3hRbTqkNxxjQNHkkQYGDlCrgEhK0k%3D"
              stream-read-token="so=demoassure&sn=sandbox&ss=stream&sp=r&se=2022-06-17T19:18:05.538Z&sk=sandbox&sig=nJOri1M66leDMnfL93UlufHegDf3hAwoQ%2FMj37ReQBs%3D"
              timelineType="journey-and-stream"
              base-url="https://uswest-nonprod.cjaas.cisco.com"
            ></cjaas-profile-view-widget>
          </div>
          <div
            style=${`width: ${this.containerWidth}; height: ${this.containerHeight}; overflow: auto;`}
            class="widget-container"
          >
            <cjaas-profile-view-widget
              id="view"
              customer="560021-Venki"
              .template=${sampleTemplate}
              timelineType="journey-and-stream"
              base-url="https://uswest-nonprod.cjaas.cisco.com"
            >
              <h3 slot="l10n-header-text">Texto de encabezado personalizado</h3>
              <h4 slot="l10n-no-data-message">No hay datos para mostrar</h4>
              <h4 slot="l10n-no-profile-message">No hay perfil disponible</h4>
            </cjaas-profile-view-widget>
          </div>
        </div>
      </md-theme>
    `;
  }
}
