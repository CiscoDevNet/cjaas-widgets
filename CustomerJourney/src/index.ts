/**
 * Copyright (c) Cisco Systems, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { html, internalProperty, property, LitElement, PropertyValues, query } from "lit-element";
import { classMap } from "lit-html/directives/class-map.js";
import { customElementWithCheck } from "./mixins/CustomElementCheck";
import styles from "./assets/styles/View.scss";
import * as iconData from "@/assets/icons.json";
import { Profile, ServerSentEvent, IdentityResponse, IdentityData } from "./types/cjaas";
import { EventSourceInitDict } from "eventsource";
import "@cjaas/common-components/dist/comp/cjaas-timeline";
import "@cjaas/common-components/dist/comp/cjaas-profile";
import "@cjaas/common-components/dist/comp/cjaas-identity";
import { Timeline } from "@cjaas/common-components/dist/types/components/timeline/Timeline";
import { DateTime } from "luxon";

function sortEventsbyDate(events: Timeline.CustomerEvent[]) {
  events.sort((previous, current) => {
    if (previous.time > current.time) {
      return -1;
    } else if (previous.time < current.time) {
      return 1;
    } else {
      return 0;
    }
  });

  return events;
}

@customElementWithCheck("customer-journey-widget")
export default class CustomerJourneyWidget extends LitElement {
  /**
   * Path to the proper Customer Journey API deployment
   * @attr base-url
   */
  @property({ type: String, attribute: "base-url" }) baseUrl: string | undefined = undefined;
  /**
   * Customer ID used for Journey lookup
   * @attr customer
   */
  @property({ type: String, reflect: true }) customer: string | null = null;
  /**
   * SAS Token that provides read permissions to Journey API (used for Profile retrieval)
   * @attr profile-read-token
   */

  @property({ type: String, attribute: "profile-read-token" })
  profileReadToken: string | null = null;
  /**
   * SAS Token that provides write permissions to Journey API (used for POST data template in Profile retrieval)
   * @attr profile-write-token
   */
  @property({ type: String, attribute: "profile-write-token" })
  profileWriteToken: string | null = null;

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

  /**
   * SAS Token that provides read permissions for Historical Journey
   * @attr tape-token
   */
  @property({ type: String, attribute: "tape-read-token" }) tapeReadToken: string | null = null;
  /**
   * SAS Token that provides read permissions for Journey Stream
   * @attr stream-token
   */
  @property({ type: String, attribute: "stream-read-token" }) streamReadToken: string | null = null;
  /**
   * Toggles display of field to find new Journey profiles
   * @attr user-search
   */
  @property({ type: Boolean, attribute: "user-search" }) userSearch = false;
  /**
   * Set the number of Timeline Events to display
   * @attr limit
   */
  @property({ type: Number }) limit = 20;
  /**
   * Property to pass in WxCC Global state about current interaction
   * @prop interactionData
   * @type Interaction
   */
  @property({ attribute: false }) interactionData: Interaction | undefined;
  /**
   * Property to set the data template to retrieve customer Profile in desired format
   * @attr template-id
   */
  @property({ type: String, attribute: "template-id" }) templateId = "journey-default-template";
  /**
   * Property to pass in JSON template to set color and icon settings
   * @prop eventIconTemplate
   */
  @property({ attribute: false }) eventIconTemplate: Timeline.TimelineCustomizations = iconData;
  /**
   * @prop badgeKeyword
   * set badge icon based on declared keyword from dataset
   */
  @property({ type: String, attribute: "badge-keyword" }) badgeKeyword = "channelType";
  /**
   * Data pulled from Journey Profile retrieval (will match shape of provided Template)
   * @prop profileData
   */
  @internalProperty() profileData: Profile | undefined;
  /**
   * Timeline data fetched from journey history
   * @prop events
   */
  @internalProperty() events: Array<Timeline.CustomerEvent> = [];
  /**
   * Queue array of incoming events via Stream
   * @prop newestEvents
   */
  @internalProperty() newestEvents: Array<Timeline.CustomerEvent> = [];
  /**
   * Store for Stream event source
   * @prop eventSource
   */
  @internalProperty() eventSource: EventSource | null = null;
  /**
   * Internal toggle to either queue or immediately load new events occurring in the stream
   * @prop liveStream
   */
  @internalProperty() liveStream = false;
  /**
   * Internal toggle of loading state for timeline section
   * @prop timelineLoading
   */
  @internalProperty() getEventsInProgress = false;
  /**
   * Internal toggle of loading state for profile section
   * @prop profileLoading
   */
  @internalProperty() getProfileDataInProgress = false;

  /**
   * Internal store for error message
   * @prop errorMessage
   */
  // @internalProperty() errorMessage = "";

  /**
   * Internal toggle for responsive layout
   * @prop expanded
   */
  @internalProperty() expanded = false;

  /**
   * Memoize pollingstatus so that there are not multiple intervals
   */
  @internalProperty() pollingActive = false;

  @internalProperty() aliasAddInProgress = false;

  @internalProperty() aliasGetInProgress = false;

  @internalProperty() aliasDeleteInProgress: { [key: string]: boolean } = {};

  @internalProperty() identityData: IdentityData | undefined;

  @internalProperty() identityID: string | null = null;

  /**
   * Hook to HTML element <div class="container">
   * @query container
   */
  @query(".container") container!: HTMLElement;
  /**
   * Hook to HTML element <md-input id="customerInput">
   * @query customerInput
   */
  @query("#customer-input") customerInput!: HTMLInputElement;
  @query(".profile") widget!: Element;

  // async firstUpdated(changedProperties: PropertyValues) {
  //   super.firstUpdated(changedProperties);

  //   const resizeObserver = new ResizeObserver((entries: ResizeObserverEntry[]) => {
  //     if (entries[0].contentRect.width > 780) {
  //       this.expanded = true;
  //     } else {
  //       this.expanded = false;
  //     }
  //   });

  //   resizeObserver.observe(this.widget);
  // }

  async update(changedProperties: PropertyValues) {
    super.update(changedProperties);

    if (changedProperties.has("interactionData")) {
      if (this.interactionData) {
        this.customer = this.interactionData["ani"];
      } else {
        this.customer = null;
      }
    }

    if ((changedProperties.has("customer") || changedProperties.has("templateId")) && this.customer && this.templateId) {
        this.getProfileFromTemplateId(this.customer, this.templateId);
    }

    if (changedProperties.has("customer")) {
      this.newestEvents = [];
      this.getExistingEvents(this.customer || null);
      this.subscribeToStream(this.customer || null);
      this.identityData = await this.getAliasesByAlias(this.customer || null);
      this.identityID = this.identityData?.id || null;
    }
  }

  baseUrlCheck() {
    if (this.baseUrl === undefined) {
      console.error("[JDS Widget] You must provide a Base URL");
      throw new Error("[JDS Widget] You must provide a Base URL");
    }
  }

  encodeCustomer(customer: string | null): string | null {
    const encodedCustomer = customer ? btoa(customer) : null;
    return encodedCustomer;
  }

  getProfileFromTemplateId(customer: string | null, templateId: string) {
    this.profileData = undefined;
    this.getProfileDataInProgress = true;

    const url = `${this.baseUrl}/v1/journey/views?templateId=${templateId}&personId=${this.encodeCustomer(customer)}`

    const options: RequestInit = {
      method: "GET",
      headers: {
        Authorization: "SharedAccessSignature " + this.profileReadToken,
      },
    };

    fetch(url, options)
      .then(x => x.json())
      .then(response => {
        this.pollingActive = false;
        this.profileData = this.parseResponse(response?.data?.attributeView, response?.data?.personId);
      })
      .catch(err => {
        this.getProfileDataInProgress = false;
        this.profileData = undefined;
        console.error("[JDS Widget] Unable to fetch the Profile", customer, templateId, err);
      });
  }

  parseResponse(attributes: any, personId: string) {
    const profileTablePayload = attributes.map((attribute: any) => {
      const _query = {
        ...attribute.queryTemplate,
        widgetAttributes: {
          type: attribute.queryTemplate?.widgetAttributes.type,
          tag: attribute.queryTemplate?.widgetAttributes.tag,
        },
      };
      this.getProfileDataInProgress = false;
      return {
        query: _query,
        journeyEvents: attribute.journeyEvents?.map((value: string) => value && JSON.parse(value)),
        result: [attribute.result],
      };
    });

    profileTablePayload.personId = personId;
    return profileTablePayload;
  }

  async getExistingEvents(customer: string | null) {
    this.events = [];

    this.getEventsInProgress = true;
    this.baseUrlCheck();
    const url = `${this.baseUrl}/v1/journey/streams/historic/${this.encodeCustomer(customer)}`;
    return fetch(url, {
      headers: {
        "content-type": "application/json; charset=UTF-8",
        accept: "application/json",
        Authorization: `SharedAccessSignature ${this.tapeReadToken}`
      },
      method: "GET",
    })
      .then((x: Response) => {
        return x.json();
      })
      .then((data: any) => {
        // TODO: any type to be changed to Timeline.CustomerEvent
        data.events = data.events.map((event: any) => {
          event.time = DateTime.fromISO(event.time);
          return event;
        });
        this.events = sortEventsbyDate(data.events);
        this.getEventsInProgress = false;
        return data.events;
      })
      .catch((err: Error) => {
        console.error(`[JDS Widget] Could not fetch Customer Journey events for customer (${customer})`, err);
        // this.errorMessage = `Failure to fetch Journey for ${this.customer}. ${err}`;
      }).finally(() => {
        this.getEventsInProgress = false;
      });
  }

  subscribeToStream(customer: string | null) {
    if (this.eventSource) {
      this.eventSource.close();
    }

    this.baseUrlCheck();
    if (this.streamReadToken) {
      const header: EventSourceInitDict = {
        headers: {
          "content-type": "application/json; charset=UTF-8",
          accept: "application/json",
          Authorization: `SharedAccessSignature ${this.streamReadToken}`
        },
      };
      const encodedCustomer = this.encodeCustomer(customer);
      const url = `${this.baseUrl}/streams/v1/journey/person/${encodedCustomer}?${this.streamReadToken}`;
      this.eventSource = new EventSource(url, header);
    }

    if (this.eventSource) {
      this.eventSource.onopen = (event) => {
        console.log(`[JDS Widget] The Journey stream connection has been established for customer \'${customer}\'.`);
      };

      this.eventSource.onmessage = (event: ServerSentEvent) => {
        let data;

        try {
          data = JSON.parse(event.data);
          data.time = DateTime.fromISO(data.time);

          // sort events
          this.newestEvents = sortEventsbyDate([data, ...this.newestEvents]);
        } catch (err) {
          console.error("[JDS Widget] journey/stream: No parsable data fetched");
        }
      };

      this.eventSource!.onerror = (error) => {
        console.error(`[JDS Widget] There was an EventSource error: `, error);
      }; // TODO: handle this error case
    } else {
      console.error(`[JDS Widget] No event source is active for ${customer}`);
    }
  }

  updateComprehensiveEventList() {
    this.events = sortEventsbyDate([...this.newestEvents, ...this.events]);
    this.newestEvents = [];
  }

  handleKey(e: CustomEvent) {
    const { srcEvent } = e?.detail;
    if (srcEvent.key === "Enter") {
      e.composedPath()[0].blur();
    }

    this.handleBackspace(srcEvent);
  }

  renderEvents() {
    return html`
      <cjaas-timeline
        ?getEventsInProgress=${this.getEventsInProgress}
        .timelineItems=${this.events}
        .newestEvents=${this.newestEvents}
        .eventIconTemplate=${this.eventIconTemplate}
        .badgeKeyword=${this.badgeKeyword}
        @new-event-queue-cleared=${this.updateComprehensiveEventList}
        limit=${this.limit}
        event-filters
        ?live-stream=${this.liveStream}
      ></cjaas-timeline>
    `;
  }

  renderLoader() {
    return html`
      <div class="spinner-container small">
        <md-spinner size="18"></md-spinner>
      </div>
    `;
  }

  renderEventList() {
    return html`
      <section class="sub-widget-section" id="events-list">
        ${this.renderEvents()}
      </section>
    `;
  }

  renderProfile() {
    return html`
      <section class="sub-widget-section">
        <cjaas-profile .profileData=${this.profileData} ?getProfileDataInProgress=${this.getProfileDataInProgress}></cjaas-profile>
      </section>
    `;
  }

  renderIdentity() {
    return html`
      <section class="sub-widget-section">
        <cjaas-identity
          .customer=${this.customer}
          .identityData=${this.identityData}
          .aliasDeleteInProgress=${this.aliasDeleteInProgress}
          ?aliasGetInProgress=${this.aliasGetInProgress}
          ?aliasAddInProgress=${this.aliasAddInProgress}
          @deleteAlias=${(ev: CustomEvent) => this.deleteAliasById(this.identityID, ev.detail.alias)}
          @addAlias=${(ev: CustomEvent) => this.addAliasById(this.identityID, ev.detail.alias)}
          .minimal=${true}
        ></cjaas-identity>
      </section>
    `;
  }

  private get classes() {
    return { expanded: this.expanded };
  }

  static get styles() {
    return styles;
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

  handleBackspace(event: KeyboardEvent) {
    if (event?.key === "Backspace") {
      event.stopPropagation();
    }
  }

  refreshUserSearch() {
    this.customer = null;
    this.customer = this.customerInput.value;
  }

  renderMainInputSearch() {
    return html`
      <div class="flex-inline">
        <span class="custom-input-label">Lookup User</span>
        <div class="input-wrapper">
            <md-input
              searchable
              class="customer-journey-search-input"
              id="customer-input"
              placeholder="examples: Jon Doe, (808) 645-4562, jon@gmail.com"
              value=${this.customer || ""}
              shape="pill"
              @input-keydown=${(event: CustomEvent) => this.handleKey(event)}
              @blur=${(e: FocusEvent) => {
                this.customer = e.composedPath()[0].value;
              }}>
            </md-input>
            <div class="reload-icon">
              <md-tooltip message="Reload Widget">
                <md-button circle @click=${this.refreshUserSearch}>
                  <md-icon name="icon-refresh_12"></md-icon>
                </md-button>
              </md-tooltip>
            </div>
        </div>
      </div>
    `;
  }


  renderEmptyStateView() {
    return html`
      <div class="empty-state-container">
        <!-- <img src="./assets/images/flashlight-search-192.svg" alt="search-illustration" /> -->
        <!-- TODO: Add Illustrations to empty state view -->
        <p class="empty-state-text">Enter a user to search for a Journey</p>
      </div>
    `;
  }

  renderSubWidgets() {
    const tooltipMessage = `Aliases are alternate ways to identify a customer. Adding aliases can help you form a more complete profile of your customer.`;

    return html`
      <div class="sub-widget-flex-container${classMap(this.classes)}">
        <div class="column left-column">
          <details class="sub-widget-detail-container" open>
            <summary><span class="sub-widget-header">Profile</span><md-icon name="icon-arrow-up_12"></md-icon> </summary>
            ${this.renderProfile()}
          </details>
          <details class="grid-identity sub-widget-detail-container">
            <summary>
              <span class="sub-widget-header">Aliases</span>
              <md-tooltip class="alias-info-tooltip" .message=${tooltipMessage}>
                <md-icon name="info_14"></md-icon>
              </md-tooltip>
              <md-icon class="alias-expand-icon" name="icon-arrow-up_12"></md-icon>
            </summary>
            ${this.renderIdentity()}
          </details>
        </div>
        <div class="column right-column">
          <details class="grid-timeline sub-widget-detail-container" open>
            <summary>
              <span class="sub-widget-header">Journey</span>
              <md-icon name="icon-arrow-up_12"></md-icon>
            </summary>
            <div class="container">
              ${this.renderEventList()}
            </div>
          </details>
        </div>
      </div>
    `;
  }

  renderFunctionalWidget() {
    return html`
      <div class="customer-journey-widget-container">
        <div class="top-header-row">
          ${this.renderMainInputSearch()}
        </div>
        ${this.customer ? this.renderSubWidgets() : this.renderEmptyStateView()}
      </div>
    `;
  }

  render() {
    return this.renderFunctionalWidget();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "customer-journey-widget": CustomerJourneyWidget;
  }
}
