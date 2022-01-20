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
  @property({ attribute: false })
  eventIconTemplate: Timeline.TimelineCustomizations = iconData;
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
  @internalProperty() timelineLoading = true;
  /**
   * Internal toggle of loading state for profile section
   * @prop profileLoading
   */
  @internalProperty() profileLoading = true;
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
  @internalProperty() isAPIInProgress = false;
  @internalProperty() getAPIInProgress = false;
  @internalProperty() lastSeenEvent: JourneyEvent | null = null;
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
  @query("#customerInput") customerInput!: HTMLInputElement;

  @query(".profile") widget!: Element;

  async lifecycleTasks() {
    this.reloadOtherWidgets();
    this.reloadAliasWidget();
    this.requestUpdate();
  }

  reloadOtherWidgets() {
    this.getExistingEvents().then((events: Timeline.CustomerEvent[]) => {
      this.timelineLoading = false;

      // sort events
      this.events = sortEventsbyDate(events);
    });

    this.getProfile();
    this.subscribeToStream();
  }
  async connectedCallback() {
    super.connectedCallback();
    await this.lifecycleTasks();
    if (this.interactionData) {
      this.customer = this.interactionData["ani"];
    }
  }

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

    if (changedProperties.has("customer")) {
      this.newestEvents = [];
      await this.lifecycleTasks();
      if (this.customer && this.customerInput) {
        this.customerInput.value = this.customer;
      }
    }
  }

  baseUrlCheck() {
    if (this.baseURL === undefined) {
      console.error("You must provide a Base URL");
      throw new Error("You must provide a Base URL");
    }
  }

  getProfile() {
    this.profileLoading = true;
    if (this.templateId) {
      this.getProfileFromTemplateId();
    }
  }

  getProfileFromTemplateId() {
    const url = `${this.baseURL}/v1/journey/views:build?templateId=${this.templateId}&personId=${this.customer}`;

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
          throw new Error(response.error.message[0]);
        }
        this.setOffProfileLongPolling(response.data.getUriStatusQuery);
      })
      .catch(err => {
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
            this.profileData = this.parseResponse(response.data.output.attributeView);
          }
        })
        .catch(err => {
          console.log(err);
        });
    }, 1500);
  }

  parseResponse(attributes: any) {
    return attributes.map((attribute: any) => {
      const _query = {
        ...attribute.queryTemplate,
        widgetAttributes: {
          type: attribute.queryTemplate?.widgetAttributes.type,
          tag: attribute.queryTemplate?.widgetAttributes.tag,
        },
      };
      this.profileLoading = false;
      return {
        query: _query,
        journeyEvents: attribute.journeyEvents?.map((value: string) => value && JSON.parse(value)),
        result: [attribute.result],
      };
    });
  }

  async getExistingEvents() {
    this.timelineLoading = true;
    this.baseUrlCheck();
    return fetch(`${this.baseURL}/v1/journey/streams/historic/${this.customer}`, {
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
        // any to be changed to Timeline.CustomerEvent
        data.events = data.events.map((event: any) => {
          event.time = DateTime.fromISO(event.time);
          return event;
        });
        return data.events;
      })
      .catch((err: Error) => {
        console.error("Could not fetch Customer Journey events. ", err);
        this.errorMessage = `Failure to fetch Journey for ${this.customer}. ${err}`;
      });
  }

  subscribeToStream() {
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
        `${this.baseURL}/v1/journey/streams/${this.customer}?${this.streamToken}`,
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

      this.eventSource!.onerror = () => {
        this.timelineLoading = false;
      };
    } else {
      console.error(`No event source is active for ${this.customer}`);
    }
  }

  updateComprehensiveEventList() {
    this.events = sortEventsbyDate([...this.newestEvents, ...this.events]);
    this.newestEvents = [];
  }

  handleKey(e: KeyboardEvent) {
    if (e.key === "Enter") {
      e.composedPath()[0].blur();
    }
  }

  renderEvents() {
    return html`
      <cjaas-timeline
        .apiInProgress=${this.timelineLoading}
        .timelineItems=${this.events}
        .newestEvents=${this.newestEvents}
        .eventIconTemplate=${this.eventIconTemplate}
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
      <section id="events-list">
        ${this.renderEvents()}
      </section>
    `;
  }

  renderProfile() {
    return html`
      <cjaas-profile .profileData=${this.profileData}></cjaas-profile>
    `;
  }

  renderIdentity() {
    return html`
      <section>
        <cjaas-identity
          .customer=${this.customer}
          .alias=${this.alias}
          .aliasDeleteInProgress=${this.aliasDeleteInProgress}
          .getAPIInProgress=${this.getAPIInProgress}
          .isAPIInProgress=${this.isAPIInProgress}
          @deleteAlias=${(ev: CustomEvent) => this.deleteAlias(ev.detail.alias)}
          @addAlias=${(ev: CustomEvent) => this.addAlias(ev.detail.alias)}
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

  async deleteAliasAPI(alias: string) {
    const url = `${this.baseURLAdmin}/v1/journey/identities/${this.customer}/aliases/${alias}`;

    this.setAliasLoader(alias, true);

    return fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: `SharedAccessSignature ${this.identityWriteSasToken}`,
      },
    });
  }

  async deleteAlias(alias: string) {
    const response = await this.deleteAliasAPI(alias);

    this.removeAliasFromList(alias);

    this.setAliasLoader(alias, false);

    this.reloadOtherWidgets();

    return response.json();
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

  async reloadAliasWidget() {
    const response = await this.getAliases();

    if ((response as IdentityErrorResponse).error) {
      this.alias = undefined;
      // if ((response as IdentityErrorResponse).error?.key === 404) {
      // }
      return;
    }

    this.alias = (response as IdentityResponse).data;
  }

  async addAlias(input: string) {
    if (input?.trim()) {
      const response = await this.postAlias(input);

      if (response) {
        this.lifecycleTasks();
      }
    }
  }

  renderHeader() {
    return html`
      <div class="flex-inline">
        <div class="input">
          <md-tooltip message="Click to search new journey" ?disabled=${!this.userSearch}>
            <input
              class="header"
              value=${this.customer || "Customer Journey"}
              @keydown=${(e: KeyboardEvent) => this.handleKey(e)}
              @blur=${(e: FocusEvent) => {
                this.customer = e.composedPath()[0].value;
              }}
            />
          </md-tooltip>
        </div>
        <div class="reload-icon">
          <md-tooltip message="Reload Widget">
            <md-button circle @click="${() => this.lifecycleTasks()}">
              <md-icon name="icon-refresh_16"></md-icon>
            </md-button>
          </md-tooltip>
        </div>
      </div>
    `;
  }
  render() {
    return html`
      <div class="profile${classMap(this.classes)}">
        ${this.renderHeader()}
        <div class="grid-profile">
          <details ?open=${this.profileData !== undefined}>
            <summary>Profile<md-icon name="icon-arrow-down_12"></md-icon> </summary>
            ${this.profileLoading ? this.renderLoader() : this.renderProfile()}
          </details>
          <details class="grid-identity" ?open=${this.identityAlias !== undefined}>
            <summary>Identity Alias<md-icon name="icon-arrow-down_12"></md-icon></summary>
            ${this.renderIdentity()}
          </details>
        </div>
        <details class="grid-timeline" open>
          <summary
            >Journey
            <md-icon name="icon-arrow-down_12"></md-icon>
          </summary>
          <div class="container">
            ${this.timelineLoading ? this.renderLoader() : this.renderEventList()}
          </div>
        </details>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "customer-journey-widget": CustomerJourneyWidget;
  }
}
