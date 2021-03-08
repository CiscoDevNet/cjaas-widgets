import { LitElement, html, customElement, property } from "lit-element";
import styles from "./ProfileView.scss";

@customElement("profile-view")
export class ProfileView extends LitElement {
  @property() profile: any;
  @property() presetTags: any = {};

  contactItem() {
    // accept a type parameter to render phone / email / etc.
    // TODO: This ought to be a stand-alone web component geared to provide various icons/colors
    return html`
      <div class="contact-item">
        <md-badge circle color="violet">
          <md-icon name="icon-email-active_12" size="8"></md-icon>
        </md-badge>
        <span>${this.presetTags.email}</span>
      </div>
    `;
  }

  getTopContent() {
    return html`
      <section class="top-content">
        <md-avatar
          .title="${this.presetTags["name"].join(" ")}"
          alt=${this.presetTags["name"].join(" ")}
          src=${this.profile.picture || undefined}
          .size=${48}
        ></md-avatar>
        <h5 title="Name" class="customer-name">
          ${this.presetTags["name"].join(" ")}
        </h5>
        <h5 title="Label" class="customer-label">
          ${this.presetTags["label"]
            ? this.presetTags["label"].join(" ")
            : "VIP Customer"}
        </h5>
        ${this.contactItem()}
      </section>
    `;
  }

  getTable() {
    return html`
      <table title="Profile Details">
        ${this.profile
          .filter((x: any) => x.query.type === "table")
          .map((x: any) => {
            return html`
              <tr>
                <td class="title">${x.query.DisplayName}</td>
                <td class="value">${this.getValue(x)}</td>
              </tr>
            `;
          })}
      </table>
    `;
  }
  getValue(x: any) {
    let result = null;

    if (x.query.formatValue) {
      try {
        result = x.result.map(x.query.formatValue).join(", ");
      } catch (err) {
        console.log("Unable to format value", err);
      }
    }

    if (result === null) {
      result = x.result.join(", ") || "-";
    }

    return result;
  }

  static get styles() {
    return styles;
  }

  render() {
    return html`
      <section class="profile" title="Customer Profile">
        ${this.getTopContent()}
        <hr />
        ${this.getTable()}
      </section>
    `;
  }
}
