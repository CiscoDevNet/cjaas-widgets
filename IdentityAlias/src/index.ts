/**
 * Copyright (c) Cisco Systems, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// This file imports all of the webcomponents from "components" folder

import { html, internalProperty, property, LitElement, PropertyValues, query } from "lit-element";
import { customElementWithCheck } from "./mixins/CustomElementCheck";
import styles from "./assets/styles/identity-alias.scss";

import "@momentum-ui/web-components/dist/comp/md-alert-banner";
import "@momentum-ui/web-components/dist/comp/md-button";
import "@momentum-ui/web-components/dist/comp/md-input";
import "@momentum-ui/web-components/dist/comp/md-tooltip";
import "@cjaas/common-components/dist/comp/cjaas-timeline-item";

import { nothing } from "lit-html";
import { IdentityErrorResponse, IdentityResponse, JourneyEvent } from "./types/cjaas";

@customElementWithCheck("cjaas-identity-alias")
export default class CjaasIdentityAlias extends LitElement {
  @property({ attribute: "identity-read-sas-token" })
  identityReadSasToken: SASTOKEN = null;
  @property({ attribute: "identity-write-sas-token" })
  identityWriteSasToken: SASTOKEN = null;

  @property({ type: String, attribute: "base-url" }) baseURL: string | undefined = undefined;
  @property({ type: String, attribute: "base-url-admin" }) baseURLAdmin: string | undefined = undefined;

  @property({ type: String, reflect: true }) customer: string | undefined;

  @property({ type: Boolean, reflect: true }) minified = false;

  @internalProperty() alias: IdentityResponse["data"] | undefined;
  @internalProperty() isAPIInProgress = false;
  @internalProperty() newUser = false;
  @internalProperty() getAPIInProgress = false;
  @internalProperty() lastSeenEvent: JourneyEvent | null = null;
  @internalProperty() aliasDeleteInProgress: { [key: string]: boolean } = {};

  updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);

    if (changedProperties.has("customer")) {
      this.reloadWidget().then(x => console.log("Widget Reloaded"));
    }
  }

  static get styles() {
    return styles;
  }

  async getAliases(): Promise<IdentityResponse | IdentityErrorResponse> {
    const url = `${this.baseURLAdmin}/v1/journey/identities/${this.customer}`;
    this.getAPIInProgress = true;

    return fetch(url, {
      method: "GET",
      headers: {
        Authorization: `SharedAccessSignature ${this.identityReadSasToken}`,
      },
    }).then(response => {
      this.getAPIInProgress = false;
      return response.json();
    });
  }

  async postAlias(alias: string) {
    const url = `${this.baseURLAdmin}/v1/journey/identities/${this.customer}/aliases`;

    this.isAPIInProgress = true;
    return fetch(url, {
      method: "POST",
      headers: {
        Authorization: `SharedAccessSignature ${this.identityWriteSasToken}`,
      },
      body: JSON.stringify({
        aliases: [alias],
      }),
    }).then(response => {
      this.isAPIInProgress = false;
      return response.json();
    });
  }

  async deleteAlias(alias: string) {
    const url = `${this.baseURLAdmin}/v1/journey/identities/${this.customer}/aliases/${alias}`;

    this.setAliasLoader(alias, true);

    return fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: `SharedAccessSignature ${this.identityWriteSasToken}`,
      },
    }).then(response => {
      this.removeAliasFromList(alias);

      this.setAliasLoader(alias, false);

      return response.json();
    });
  }

  setAliasLoader(alias: string, state: boolean) {
    const duplicate = Object.assign({}, this.aliasDeleteInProgress);

    duplicate[alias] = state;

    this.aliasDeleteInProgress = duplicate;
  }

  removeAliasFromList(alias: string) {
    const index = this.alias?.aliases.findIndex(item => item === alias);

    if (this.alias && index !== undefined) {
      this.alias?.aliases.splice(index, 1);
      this.requestUpdate();
    }
  }

  async reloadWidget() {
    const response = await this.getAliases();

    if ((response as IdentityErrorResponse).error) {
      this.alias = undefined;
      if ((response as IdentityErrorResponse).error?.key === 404) {
        this.newUser = true;
      }
      return;
    }

    this.alias = (response as IdentityResponse).data;
  }

  async addAlias(input: string) {
    if (input?.trim()) {
      const response = await this.postAlias(input);

      if (response) {
        await this.reloadWidget();
      }
    }
  }

  renderLastSeen() {
    if (this.alias?.lastSeen) {
      let event = this.alias.lastSeen;

      return html`
        <b>Last Seen Event at:</b>
        <cjaas-timeline-item
          .event=${event}
          .title=${event.type}
          .time=${event.time}
          .data=${event.data}
          .id=${event.id}
          .person=${event.person || null}
        ></cjaas-timeline-item>
      `;
    }

    return nothing;
  }

  render() {
    const avatar = this.customer
      ? html`
          <md-avatar .title=${this.customer} type="active" color="cyan"></md-avatar>
        `
      : nothing;

    let lastSeen = nothing;

    if (this.alias?.lastSeen) {
      const date = new Date(this.alias.lastSeen.time);
      lastSeen = html`
        <i>Last seen at</i> ${date.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "2-digit" })}
      `;
    }

    const headerBlock = this.minified
      ? nothing
      : html`
          <!-- <h2>Identity Alias</h2> -->
          <div class="avatar">
            ${avatar}
            <div>
              <h3>${this.customer}</h3>
              ${lastSeen}
            </div>
          </div>
        `;

    return html`
      ${headerBlock}
      <cjaas-identity 
        .alias=${this.alias} .aliasDeleteInProgress=${this.aliasDeleteInProgress} .getAPIInProgress=${
      this.getAPIInProgress
    } .isAPIInProgress=${this.isAPIInProgress} 
        @deleteAlias=${(ev: CustomEvent) => this.deleteAlias(ev.detail.alias)}
        @addAlias=${(ev: CustomEvent) => this.addAlias(ev.detail.alias)}
    .customer=${"Alex Ross"}>
    </cjaas-identity>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "cjaas-identity-alias": CjaasIdentityAlias;
  }
}

export type SASTOKEN = string | null | undefined;
