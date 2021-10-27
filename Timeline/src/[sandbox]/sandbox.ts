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
  @internalProperty() containerWidth = "600px";
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
          <h2 class="sandbox-header">Timeline</h2>
          <!-- <div
            style=${`width: ${this.containerWidth}; height: ${this.containerHeight}; overflow: auto;`}
            class="widget-container"
          >
            <cjaas-timeline-widget
              id="timeline-widget"
              person-id=""
              tape-read-token="so=demoassure&sn=sandbox&ss=tape&sp=r&se=2049-02-22T16:44:19.899Z&sk=sandbox&sig=zfaMLDT15AoCvrWle0HSezBwgETtXs5JMTMQDaIkWkQ%3D"
              stream-read-token="so=demoassure&sn=sandbox&ss=stream&sp=r&se=2049-02-22T16:45:54.572Z&sk=sandbox&sig=Ao2mLkSfBmnQH%2B87LvkIrulx61Bpb5fxFch6lwOLu78%3D"
              limit="15"
              base-url="https://cjaas-devus1-edge.azurewebsites.net"
            ></cjaas-timeline-widget>
          </div> -->
          <div
            style=${`width: ${this.containerWidth}; height: ${this.containerHeight}; overflow: auto;`}
            class="widget-container"
          >
            <cjaas-timeline-widget
              secret="8UZowtVLwUiL5iLmz3E49spgNzikMhXgbT36Z9f2xdvOvVfDI3yKNRzLcKiiTz8mch351G6Sx7jbL6Z1b5urgUhcGcjscEdJmMI2ZmcnTqqL5W3Ws8m7BGa0n1ec/r8OmwL2gAEXKNdoDandr6gV3uD0/trfNfPa2ZmVmihOUk5zrEFeA1T7/JT/PJXOptZeyF4XCWKv464lxcV3dToeayT5TiWuclX+b4Yv1ZDsM8E/YnkTzekOtUOQEHYMMFT0rNog0o546aS4NFz68GiZ0sHDbFhTzLXrD4wz7AOK8ZFZ8/zi6Wm9so52DUwg8RL8JTuJR8GXw7/LrcNPkBJn0Q=="
              org="journeyUi"
              namespace="sandbox"
              limit="15"
              show-filters
              base-url="https://cjaas-devus2.azurewebsites.net"
            >
            </cjaas-timeline-widget>
          </div>
          <div
            style=${`width: ${this.containerWidth}; height: ${this.containerHeight}; overflow: auto;`}
            class="widget-container"
          >
            <cjaas-timeline-widget
              secret="8UZowtVLwUiL5iLmz3E49spgNzikMhXgbT36Z9f2xdvOvVfDI3yKNRzLcKiiTz8mch351G6Sx7jbL6Z1b5urgUhcGcjscEdJmMI2ZmcnTqqL5W3Ws8m7BGa0n1ec/r8OmwL2gAEXKNdoDandr6gV3uD0/trfNfPa2ZmVmihOUk5zrEFeA1T7/JT/PJXOptZeyF4XCWKv464lxcV3dToeayT5TiWuclX+b4Yv1ZDsM8E/YnkTzekOtUOQEHYMMFT0rNog0o546aS4NFz68GiZ0sHDbFhTzLXrD4wz7AOK8ZFZ8/zi6Wm9so52DUwg8RL8JTuJR8GXw7/LrcNPkBJn0Q=="
              org="journeyUi"
              namespace="sandbox"
              type="journey-and-stream"
              limit="15"
              show-filters
              base-url="https://cjaas-devus2.azurewebsites.net"
            >
              <h3 slot="ll10n-no-timeline-message">
                No hay línea de tiempo disponible
              </h3>
            </cjaas-timeline-widget>
          </div>
        </div>
      </md-theme>
    `;
  }
}
