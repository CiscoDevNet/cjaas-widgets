import { html, LitElement } from "lit-element";
import { customElementWithCheck } from "./mixins/CustomElementCheck";
import "@momentum-ui/web-components/dist/comp/md-theme";
import styles from "./assets/styles/wrapper.scss";

@customElementWithCheck("widget-theme-wrapper")
export default class WidgetThemeWrapper extends LitElement {
  static get styles() {
    return styles;
  }

  render() {
    return html`
      <md-theme lumos>
        <slot></slot>
      </md-theme>
    `;
  }
}
declare global {
  interface HTMLElementTagNameMap {
    "widget-theme-wrapper": WidgetThemeWrapper;
  }
}
