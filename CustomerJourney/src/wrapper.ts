import { html, LitElement } from "lit-element";
import { customElementWithCheck } from "./mixins/CustomElementCheck";
import "@momentum-ui/web-components/dist/comp/md-theme";
import "@cjaas/common-components";
import styles from "./assets/styles/wrapper.scss";

@customElementWithCheck("customer-journey-widget-wrapper")
export default class CustomerJourneyWidgetWrapper extends LitElement {
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
    "customer-journey-widget-wrapper": CustomerJourneyWidgetWrapper;
  }
}
