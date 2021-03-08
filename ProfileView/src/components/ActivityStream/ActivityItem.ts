import { LitElement, html, customElement, property } from "lit-element";
import { nothing } from "lit-html";
import { DateTime } from "luxon";
import styles from "./ActivityItem.scss";

import { getIconData, getTimeStamp } from "../shared";

@customElement("cjs-item")
export class CJSItem extends LitElement {
  @property({ type: String }) id = "";
  @property({ type: String }) title = "";
  @property({ type: String }) timestamp: any = "";
  @property() data: any = null;
  @property({ type: String }) person: string | null = null;
  @property({ type: Boolean, reflect: true }) expanded = false;

  static get styles() {
    return styles;
  }

  createTableRecursive(data: any): any {
    if (!data) {
      return nothing;
    } else {
      return html`
        ${Object.keys(data).map((x: string) => {
          if (typeof data[x] === "string") {
            if (data[x]) {
              return html`
                <div class="row">
                  <div class="label">${x}</div>
                  <div class="value">${data[x] || "-"}</div>
                </div>
              `;
            }
          } else {
            return this.createTableRecursive(data[x]);
          }
        })}
      `;
    }
  }

  renderExpandedDetails = () => {
    if (this.data === nothing) return nothing;
    return html`
      <div class="details">
        ${this.createTableRecursive(this.data)}
      </div>
    `;
  };

  renderId() {
    return html`
      <div class="sub-title">
        <span>ID:</span>
        ${this.id || "NA"}
      </div>
    `;
  }

  expandDetails = () => {
    this.expanded = !this.expanded;
  }

  render() {
    const timeStamp = getTimeStamp(this.timestamp || DateTime.local());
    const iconData = getIconData(this.title);

    return html`
      <div
        class="item"
        @click="${() => this.expandDetails()}"
      >
        <md-badge
          class="badge"
          .circle=${true}
          size="40"
          .color=${iconData.color}
        >
          <md-icon .name=${iconData.name}></md-icon>
        </md-badge>
        <div class="info-section">
          <div class="title">${this.title}</div>
          ${this.renderId()}
          ${this.expanded ? this.renderExpandedDetails() : nothing}
        </div>
        <div class="time-stamp">${timeStamp}</div>
      </div>
    `;
  }
}
