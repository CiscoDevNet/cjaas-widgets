/**
 * Copyright (c) Cisco Systems, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// This file imports all of the webcomponents from "components" folder

import { html, internalProperty, property, LitElement, PropertyValues } from "lit-element";
import { customElementWithCheck } from "./mixins/CustomElementCheck";
import styles from "./assets/styles/identity-alias.scss";

import "@momentum-ui/web-components/dist/comp/md-alert-banner";
import "@momentum-ui/web-components/dist/comp/md-button";
import "@momentum-ui/web-components/dist/comp/md-input";
import "@momentum-ui/web-components/dist/comp/md-tooltip";
import "@cjaas/common-components/dist/comp/cjaas-timeline-item";

import { nothing } from "lit-html";
import { IdentityData, IdentityResponse } from "./types/cjaas";

@customElementWithCheck("cjaas-identity-alias")
export default class CjaasIdentityAlias extends LitElement {
  /**
  * SAS Token to with read permission for fetching identity details
  */
   @property({ attribute: "identity-read-token" })
   identityReadToken: string | null = null;
   /**
   * SAS Token to with write permission for updating alias to identity
   */
   @property({ attribute: "identity-write-token" })
   identityWriteToken: string | null = null;

  @property({ type: String, attribute: "base-url" }) baseUrl: string | undefined = undefined;

  /**
  * Customer ID used for Journey lookup
  * @attr customer
  */
  @property({ type: String, reflect: true }) customer: string | null = null;

  @property({ type: Boolean, reflect: true }) minified = false;

  @internalProperty() alias: IdentityResponse["data"] | undefined;
  @internalProperty() newUser = false;
  // @internalProperty() lastSeenEvent: JourneyEvent | null = null;

  @internalProperty() aliasAddInProgress = false;
  @internalProperty() aliasGetInProgress = false;
  @internalProperty() aliasDeleteInProgress: { [key: string]: boolean } = {};

  @internalProperty() identityData: IdentityData | undefined;

  @internalProperty() identityID: string | null = null;

  async updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);

    if (changedProperties.has("customer")) {
      this.identityData = await this.getAliasesByAlias(this.customer || null);
      this.identityID = this.identityData?.id || null;
    }
  }

  static get styles() {
    return styles;
  }

  encodeCustomer(customer: string | null): string | null {
    const encodedCustomer = customer ? btoa(customer) : null;
    return encodedCustomer;
  }

  /**
   * Search for an Identity of an individual via aliases. This will return one/more Identities.
   * The Provided aliases belong to one/more Persons.
   * This is where we gather the ID of the individual for future alias actions
   * @param customer
   * @returns Promise<IdentityData | undefined>
   */
   async getAliasesByAlias(customer: string | null): Promise<IdentityData | undefined> {
    const url = `${this.baseUrl}/v1/journey/identities?aliases=${this.encodeCustomer(customer)}`;
    this.aliasGetInProgress = true;

    return fetch(url, {
      method: "GET",
      headers: {
        Authorization: `SharedAccessSignature ${this.identityReadToken}`
      },
    }).then(response => response.json())
    .then((response: IdentityResponse) => {
      return response?.data?.length ? response.data[0] : undefined;
    }).catch((err) => {
      // TODO: Handle fetch alias error case (err.key === 404)
      console.error("[JDS Widget] Failed to fetch Aliases by Alias ", err);
      return undefined;
    }).finally(() => {
      this.aliasGetInProgress = false;
    });
  }

  /**
   *
   * @param identityId
   * @returns Promise<IdentityData | undefined>
   */
  async getAliasesById(identityId: string | null): Promise<IdentityData | undefined> {
    const url = `${this.baseUrl}/v1/journey/identities/${identityId}`;
    this.aliasGetInProgress = true;

    return fetch(url, {
      method: "GET",
      headers: {
        Authorization: `SharedAccessSignature ${this.identityReadToken}`
      },
    })
    .then(response => response.json())
    .then((identityData: IdentityData) => {
      return identityData;
    }).catch((err) => {
      // TODO: Handle fetch alias error case (err?.key === 404)
      return undefined;
    }).finally(() => {
      this.aliasGetInProgress = false;
    });
  }

  /**
   * Add one or more aliases to existing Individual
   * @param customer
   * @param alias
   * @returns void
   */
  async addAliasById(identityId: string | null, alias: string) {
    const trimmedAlias = alias.trim();

    if (!trimmedAlias) {
      console.error('[JDS Widget] You cannot add an empty value as a new alias');
      return;
    }

    const url = `${this.baseUrl}/v1/journey/identities/${identityId}/aliases`;

    this.aliasAddInProgress = true;
    return fetch(url, {
      method: "POST",
      headers: {
        Authorization: `SharedAccessSignature ${this.identityWriteToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        aliases: [trimmedAlias],
      }),
    }).then(response => {
      return response.json();
    }).then(async () => {
      this.identityData = await this.getAliasesById(identityId);
    }).catch((err) => {
      // TODO: handle add alias error
      console.error(`[JDS Widget] Failed to add AliasById: (${identityId})`, err);
    }).finally(() => {
      this.aliasAddInProgress = false;
    })
  }

  async deleteAliasById(identityId: string | null, alias: string) {
    this.setAliasLoader(alias, true);
    const url = `${this.baseUrl}/v1/journey/identities/${identityId}/aliases`;

    return fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: `SharedAccessSignature ${this.identityWriteToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        aliases: [alias],
      }),
    }).then(async (response) => {
      this.identityData = await this.getAliasesById(identityId);
      return response.json();
    }).catch((err) => {
      // TODO: handle delete alias error
    }).finally(() => {
      this.setAliasLoader(alias, false);
    });
  }

  setAliasLoader(alias: string, state: boolean) {
    const duplicate = Object.assign({}, this.aliasDeleteInProgress);
    duplicate[alias] = state;
    this.aliasDeleteInProgress = duplicate;
  }

  render() {
    const avatar = this.customer
      ? html`
          <md-avatar .title=${this.customer} type="active" color="cyan"></md-avatar>
        `
      : nothing;

    let lastSeen = nothing;

    // if (this.alias?.lastSeen) {
    //   const date = new Date(this.alias.lastSeen.time);
    //   lastSeen = html`
    //     <i>Last seen at</i> ${date.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "2-digit" })}
    //   `;
    // }

    const headerBlock = this.minified
      ? nothing
      : html`
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
        .customer=${this.customer}
        .identityData=${this.identityData}
        .aliasDeleteInProgress=${this.aliasDeleteInProgress}
        ?aliasGetInProgress=${this.aliasGetInProgress}
        ?aliasAddInProgress=${this.aliasAddInProgress}
        @deleteAlias=${(ev: CustomEvent) => this.deleteAliasById(this.identityID, ev.detail.alias)}
        @addAlias=${(ev: CustomEvent) => this.addAliasById(this.identityID, ev.detail.alias)}>
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
