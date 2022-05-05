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
import { defaultTemplate } from "./assets/default-template";
import * as iconData from "@/assets/icons.json";
import { Profile, ServerSentEvent, IdentityResponse, JourneyEvent, IdentityErrorResponse } from "./types/cjaas";
import { EventSourceInitDict } from "eventsource";
import "@cjaas/common-components/dist/comp/cjaas-timeline";
import "@cjaas/common-components/dist/comp/cjaas-profile";
import "@cjaas/common-components/dist/comp/cjaas-identity";
import { Timeline } from "@cjaas/common-components/dist/types/components/timeline/Timeline";
import ResizeObserver from "resize-observer-polyfill";
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
  @property({ type: String, attribute: "base-url" }) baseURL: string | undefined = undefined;
  /**
   * Path to the proper Customer Journey API deployment
   * @attr base-url
   */
  @property({ type: String, attribute: "base-url-admin" }) baseURLAdmin: string | undefined = undefined;
  /**
   * Customer ID used for Journey lookup
   * @attr customer
   */
  @property({ type: String, reflect: true }) customer: string | null = null;
  /**
   * SAS Token that provides read permissions to Journey API (used for Profile retrieval)
   * @attr write-token
   */
  @property({ type: String, attribute: "profile-read-token" })
  profileReadToken: string | null = null;
  /**
   * SAS Token that provides write permissions to Journey API (used for POST data template in Profile retrieval)
   * @attr write-token
   */
  @property({ type: String, attribute: "profile-write-token" })
  profileWriteToken: string | null = null;

  /**
   * SAS Token to with read permission for fetching identity details
   */
  @property({ attribute: "identity-read-sas-token" })
  identityReadSasToken: string | null = null;
  /**
   * SAS Token to with write permission for updating alias to identity
   */
  @property({ attribute: "identity-write-sas-token" })
  identityWriteSasToken: string | null = null;

  /**
   * SAS Token that provides read permissions for Historical Journey
   * @attr tape-token
   */
  @property({ type: String, attribute: "tape-token" }) tapeToken: string | null = null;
  /**
   * SAS Token that provides read permissions for Journey Stream
   * @attr stream-token
   */
  @property({ type: String, attribute: "stream-token" }) streamToken: string | null = null;
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
  @internalProperty() errorMessage = "";
  /**
   * Internal toggle for responsive layout
   * @prop expanded
   */
  @internalProperty() expanded = false;
  /**
   * A fallback template in case no template ID is provided
   * Possibly deprecated by fetching default template from API
   */
  @internalProperty() defaultTemplate = defaultTemplate;
  /**
   * Memoize pollingstatus so that there are not multiple intervals
   */
  @internalProperty() pollingActive = false;

  @internalProperty() identityAlias = false;

  @internalProperty() alias: IdentityResponse["data"] | undefined;
  @internalProperty() lastSeenEvent: JourneyEvent | null = null;

  @internalProperty() aliasAddInProgress = false;
  @internalProperty() aliasGetInProgress = false;
  @internalProperty() aliasDeleteInProgress: { [key: string]: boolean } = {};

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

  async firstUpdated(changedProperties: PropertyValues) {
    super.firstUpdated(changedProperties);

    const resizeObserver = new ResizeObserver((entries: ResizeObserverEntry[]) => {
      if (entries[0].contentRect.width > 780) {
        this.expanded = true;
      } else {
        this.expanded = false;
      }
    });

    resizeObserver.observe(this.widget);
  }

  async update(changedProperties: PropertyValues) {
    super.update(changedProperties);

    if (changedProperties.has("interactionData")) {
      if (this.interactionData) {
        this.customer = this.interactionData["ani"];
      } else {
        this.customer = null;
      }
    }

    if (changedProperties.has("customer") || changedProperties.has("templateId")) {
        this.getProfileFromTemplateId(this.customer, this.templateId);
    }

    if (changedProperties.has("customer")) {
      this.newestEvents = [];
        this.getExistingEvents(this.customer || null);
        this.subscribeToStream(this.customer || null);
        this.reloadAliasWidget(this.customer || null);
    }
  }

  baseUrlCheck() {
    if (this.baseURL === undefined) {
      console.error("You must provide a Base URL");
      throw new Error("You must provide a Base URL");
    }
  }

  getProfileFromTemplateId(customer: string | null, templateId: string) {
    this.profileData = undefined;

    this.getProfileDataInProgress = true;
    const url = `${this.baseURL}/v1/journey/views:build?templateId=${templateId}&personId=${customer}`;

    const options: RequestInit = {
      method: "POST",
      headers: {
        "Content-type": "application/json",
        Authorization: "SharedAccessSignature " + this.profileWriteToken,
        "X-CACHE-MAXAGE-HOUR": "0",
        "X-CACHE-MAXAGE-MINUTE": "10",
      },
    };

    fetch(url, options)
      .then(x => x.json())
      .then(response => {
        if (response.error) {
          this.getProfileDataInProgress = false;
          throw new Error(response.error.message[0]);
        }
        if (response.data?.runtimeStatus === "Completed") {
          this.profileData = this.parseResponse(response?.data?.output?.attributeView, response?.data?.output?.personId);
        } else {
          this.setOffProfileLongPolling(response.data.getUriStatusQuery);
        }
      })
      .catch(err => {
        this.getProfileDataInProgress = false;
        this.profileData = undefined;
        console.error("Unable to fetch the Profile", err);
      });
  }

  setOffProfileLongPolling(url: string) {
    if (this.pollingActive) return;
    this.pollingActive = true;
    const intervalId = setInterval(() => {
      fetch(url, {
        method: "GET",
        headers: {
          "Content-type": "application/json",
          Authorization: "SharedAccessSignature " + this.profileReadToken,
        },
      })
        .then(x => x.json())
        .then((response: any) => {
          if (response.data.runtimeStatus === "Completed") {
            clearInterval(intervalId);
            this.pollingActive = false;
            this.profileData = this.parseResponse(response?.data?.output?.attributeView, response?.data?.output?.personId);
          }
        })
        .catch(err => {
          this.getProfileDataInProgress = false;
          this.profileData = undefined;
          console.log(err);
        });
    }, 1500);
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
    return fetch(`${this.baseURL}/v1/journey/streams/historic/${customer}`, {
      headers: {
        "content-type": "application/json; charset=UTF-8",
        accept: "application/json",
        Authorization: `SharedAccessSignature ${this.tapeToken}`,
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
        return data.events;
      })
      .catch((err: Error) => {
        console.error("Could not fetch Customer Journey events. ", err);
        this.errorMessage = `Failure to fetch Journey for ${this.customer}. ${err}`;
      }).finally(() => {
        this.getEventsInProgress = false;
      });
  }

  subscribeToStream(customer: string | null) {
    if (this.eventSource) {
      this.eventSource.close();
    }

    this.baseUrlCheck();
    if (this.streamToken) {
      const header: EventSourceInitDict = {
        headers: {
          "content-type": "application/json; charset=UTF-8",
          accept: "application/json",
          Authorization: `SharedAccessSignature ${this.streamToken}`,
        },
      };
      this.eventSource = new EventSource(
        `${this.baseURL}/v1/journey/streams/${customer}?${this.streamToken}`,
        header
      );
    }

    if (this.eventSource) {
      this.eventSource!.onmessage = (event: ServerSentEvent) => {
        let data;
        try {
          data = JSON.parse(event.data);
          data.time = DateTime.fromISO(data.time);
          // sort events
          this.newestEvents = sortEventsbyDate([data, ...this.newestEvents]);
        } catch (err) {
          console.error("No data fetched");
        }
      };

      // this.eventSource!.onerror = () => {}; // TODO: handle this error case
    } else {
      console.error(`No event source is active for ${customer}`);
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
          .alias=${this.alias}
          .aliasDeleteInProgress=${this.aliasDeleteInProgress}
          ?aliasGetInProgress=${this.aliasGetInProgress}
          ?aliasAddInProgress=${this.aliasAddInProgress}
          @deleteAlias=${(ev: CustomEvent) => this.deleteAlias(this.customer, ev.detail.alias)}
          @addAlias=${(ev: CustomEvent) => this.addAlias(this.customer, ev.detail.alias)}
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

  async getAliases(customer: string | null): Promise<IdentityResponse | IdentityErrorResponse> {
    const url = `${this.baseURLAdmin}/v1/journey/identities/${customer}`;
    this.aliasGetInProgress = true;

    return fetch(url, {
      method: "GET",
      headers: {
        Authorization: `SharedAccessSignature ${this.identityReadSasToken}`,
      },
    }).then(response => {
      return response.json();
    }).catch((err) => {
      // TODO: Handle fetch alias error case
    }).finally(() => {
      this.aliasGetInProgress = false;
    })
  }

  async postAlias(customer: string | null, alias: string) {
    const url = `${this.baseURLAdmin}/v1/journey/identities/${customer}/aliases`;

    this.aliasAddInProgress = true;
    return fetch(url, {
      method: "POST",
      headers: {
        Authorization: `SharedAccessSignature ${this.identityWriteSasToken}`,
      },
      body: JSON.stringify({
        aliases: [alias],
      }),
    }).then(response => {
      return response.json();
    }).catch((err) => {
      // TODO: handle add alias error
    }).finally(() => {
      this.aliasAddInProgress = false;
    })
  }

  async deleteAlias(customer: string | null, alias: string) {
    this.setAliasLoader(alias, true);
    const url = `${this.baseURLAdmin}/v1/journey/identities/${customer}/aliases/${alias}`;

    return fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: `SharedAccessSignature ${this.identityWriteSasToken}`,
      },
    }).then((response) => {
      this.removeAliasFromList(alias);
      this.reloadAliasWidget(this.customer);
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

  removeAliasFromList(alias: string) {
    const index = this.alias?.aliases.findIndex(item => item === alias);

    if (this.alias && index !== undefined) {
      this.alias?.aliases.splice(index, 1);
      this.requestUpdate();
    }
  }

  async reloadAliasWidget(customer: string | null) {
    const response = await this.getAliases(customer);

    if ((response as IdentityErrorResponse).error) {
      this.alias = undefined;
      // if ((response as IdentityErrorResponse).error?.key === 404) {} // TODO: Handle this error case
      return;
    }

    this.alias = (response as IdentityResponse).data;
  }

  async addAlias(customer: string | null, input: string) {
    const addedValue = input?.trim;

    if (!addedValue) {
      console.error('You cannot add an empty value as a new alias');
      return;
    }

    this.postAlias(customer, input)
    .then(() => this.reloadAliasWidget(customer));
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
