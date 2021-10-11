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
              template-id="second-template"
              customer="560021-Venki"
              profile-read-token="so=demoassure&sn=sandbox&ss=profile&sp=r&se=2024-07-03T17:12:28.082618200Z&sk=sandbox&sig=NiOhZ13iRNK6h1wkdNXfHSZ6abo%2FKhvVj7LE60a%2F7Lg%3D"
              profile-write-token="so=demoassure&sn=sandbox&ss=profile&sp=w&se=2049-02-22T16:45:11.988Z&sk=sandbox&sig=KLtI6vyZXMvvymFjqSR2EOJzeULzm43T6y3HTf63qus%3D"
              tape-read-token="so=demoassure&sn=sandbox&ss=tape&sp=r&se=2049-02-22T16:44:19.899Z&sk=sandbox&sig=zfaMLDT15AoCvrWle0HSezBwgETtXs5JMTMQDaIkWkQ%3D"
              stream-read-token="so=demoassure&sn=sandbox&ss=stream&sp=r&se=2049-02-22T16:45:54.572Z&sk=sandbox&sig=Ao2mLkSfBmnQH%2B87LvkIrulx61Bpb5fxFch6lwOLu78%3D"
              timelineType="journey-and-stream"
              base-url="https://cjaas-devus1.azurewebsites.net"
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
              base-url="https://uswest-nonprod.cjaas.cisco.com"
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
