/**
 * Copyright (c) Cisco Systems, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { html, internalProperty, property, LitElement, PropertyValues } from "lit-element";
import { Profile, ProfileFromSyncAPI } from "./types/cjaas";
import { customElementWithCheck } from "./mixins/CustomElementCheck";
import styles from "./assets/styles/View.scss";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { DateTime } from "luxon";
import { nothing } from "lit-html";
import { defaultTemplate } from "./assets/default-template";
import "@momentum-ui/web-components/dist/comp/md-button";
import "@momentum-ui/web-components/dist/comp/md-badge";
import "@momentum-ui/web-components/dist/comp/md-icon";
import "@momentum-ui/web-components/dist/comp/md-spinner";
import "@momentum-ui/web-components/dist/comp/md-tab";
import "@momentum-ui/web-components/dist/comp/md-tabs";
import "@momentum-ui/web-components/dist/comp/md-tab-panel";
import "@cjaas/common-components/dist/comp/cjaas-timeline";
import "@cjaas/common-components/dist/comp/cjaas-profile";
import { EventSourceInitDict } from "eventsource";
import { ServerSentEvent } from "./types/cjaas";
export interface CustomerEvent {
  data: Record<string, any>;
  firstName: string;
  lastName: string;
  email: string;
  datacontenttype: string;
  id: string;
  person: string;
  source: string;
  specversion: string;
  time: string;
  type: string;
}
@customElementWithCheck("cjaas-profile-view-widget")
export default class CjaasProfileWidget extends LitElement {
  /**
   * Current customer ID to show
   * @attr customer
   */
  @property() customer: string | undefined;
  /**
   * ID of profile view template to retrieve from API
   * @attr template-id
   */
  @property({ type: String, attribute: "template-id" }) templateId: string | undefined;
  /**
   * SAS Token for reading stream API
   * @attr stream-read-token
   */
  @property({ type: String, attribute: "stream-read-token" }) streamReadToken: string | null = null;
  /**
   * SAS Token for reading tape API
   * @attr tape-read-token
   */
  @property({ type: String, attribute: "tape-read-token" }) tapeReadToken: string | null = null;
  /**
   * SAS Token for POST operations on Profile endpoint
   * @attr profile-token
   */
  @property({ type: String, attribute: "profile-token" })
  profileToken: string | null = null;
  /**
   * SAS Token for POST operations on Profile endpoint (SHOULD DEPRECATE)
   * @attr profile-write-token
   */
  @property({ type: String, attribute: "profile-write-token" })
  profileWriteToken: string | null = null;
  /**
   * SAS Token for reading profile API (SHOULD DEPRECATE)
   * @attr profile-read-token
   */
  @property({ type: String, attribute: "profile-read-token" })
  profileReadToken: string | null = null;
  /**
   * Base URL for API calls
   * @attr base-url
   */
  @property({ type: String, attribute: "base-url" }) baseURL: string | undefined = undefined;
  // Timeline properties
  /**
   * Set max number of timeline items to render by default
   * @attr limit
   */
  @property({ type: Number }) limit = 5;
  /**
   * Populate live events as they happen
   * @prop liveStream
   */
  @internalProperty() liveStream = false;
  /**
   * Store of fetched Timeline events
   * @prop events
   */
  @internalProperty() events: CustomerEvent[] = [];
  /**
   * Cache of newest incoming live events prior to updating rendered events list view
   * @prop newestEvents
   */
  @internalProperty() newestEvents: Array<CustomerEvent> = [];
  /**
   * Store of Stream event source
   * @prop eventSource
   */
  @internalProperty() eventSource: EventSource | null = null;
  /**
   * Toggle loading state
   * @prop timelineLoading
   */
  @internalProperty() timelineLoading = false;
  /**
   * Toggle loading state
   * @prop profileLoading
   */
  @internalProperty() profileLoading = false;
  /**
   * Error message text
   * @prop errorMessage
   */
  @internalProperty() errorMessage = "";
  /**
   * Store of fetched profile Data
   * @prop profile
   */
  @internalProperty() profileData: Profile | undefined;
  /**
   * Memoize pollingstatus so that there are not multiple intervals
   */
  @internalProperty() pollingActive = false;
  /**
   * Fallback template structure if templateId is not provided (deprecating soon)
   * @prop defaultTemplate
   */
  @internalProperty() defaultTemplate = defaultTemplate;

  async lifecycleTasks() {
    this.events = await this.getExistingEvents();
    this.timelineLoading = false;
    await this.getProfile();
    this.requestUpdate();
    this.subscribeToStream();
  }

  async connectedCallback() {
    super.connectedCallback();
    await this.lifecycleTasks();
  }

  updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);

    if (
      this.customer &&
      this.defaultTemplate &&
      (changedProperties.has("template") || changedProperties.has("customer") || changedProperties.has("templateId"))
    ) {
      this.lifecycleTasks();
    }
  }

  baseUrlCheck() {
    if (this.baseURL === undefined) {
      throw new Error("You must provide a Base URL");
    }
  }

  getProfile() {
    if (!this.customer) {
      return;
    }

    this.profileLoading = true;
    if (this.templateId) {
      this.getProfileFromTemplateId();
    }
  }

  getProfileFromTemplateId() {
    const url = `${this.baseURL}/v1/journey/views:build?templateId=${this.templateId}&personId=${this.customer}`;

    const options: AxiosRequestConfig = {
      url,
      method: "POST",
      headers: {
        "Content-type": "application/json",
        Authorization: "SharedAccessSignature " + this.profileToken,
        "X-CACHE-MAXAGE-HOUR": 5,
      },
    };

    axios(options)
      .then(x => x.data)
      .then(response => {
        if (response.error) {
          throw new Error(response.error.message[0]);
        }

        if (response.data?.runtimeStatus === "Completed") {
          this.profileData = this.parseResponse(response.data.output.attributeView);
        } else {
          this.setOffProfileLongPolling(response.data.getUriStatusQuery);
        }
      })
      .catch(err => {
        console.error("Unable to fetch the Profile", err);
      });
  }

  setOffProfileLongPolling(url: string) {
    if (this.pollingActive) return;
    this.pollingActive = true;
    const intervalId = setInterval(() => {
      console.log("Fetching Profile");
      axios({
        url,
        method: "GET",
        headers: {
          "Content-type": "application/json",
          Authorization: "SharedAccessSignature " + this.profileToken,
        },
      })
        .then(x => x.data)
        .then((response: any) => {
          if (response.data.runtimeStatus === "Completed") {
            clearInterval(intervalId);
            this.pollingActive = false;
            this.profileData = this.parseResponse(response.data.output.attributeView);
          }
        });
    }, 1500);
  }

  getTimelineItemFromMessage(message: any) {
    const item: any = {};

    item.title = message.type;
    item.timestamp = DateTime.fromISO(message.time);
    item.id = message.id;
    if (message.person && message.person.indexOf("anon") === -1) {
      item.person = message.person;
    }

    if (message.data) {
      item.data = message.data;
    }

    return item;
  }

  parseResponse(attributes: any) {
    return attributes.map((attribute: any) => {
      const query = {
        ...attribute.queryTemplate,
        widgetAttributes: {
          type: attribute.queryTemplate?.widgetAttributes.type,
          tag: attribute.queryTemplate?.widgetAttributes.tag,
        },
      };
      this.profileLoading = false;
      return {
        query: query,
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
        Authorization: `SharedAccessSignature ${this.tapeReadToken}`,
      },
      method: "GET",
    })
      .then((x: Response) => {
        return x.json();
      })
      .then(data => {
        return data.events;
      })
      .catch((err: any) => {
        this.timelineLoading = false;
        console.error("Could not fetch Customer Journey events. ", err);
        this.errorMessage = `Failure to fetch Journey for ${this.customer}. ${err}`;
      });
  }

  subscribeToStream() {
    if (this.eventSource) {
      this.eventSource.close();
    }

    this.baseUrlCheck();
    if (this.streamReadToken) {
      const header: EventSourceInitDict = {
        headers: {
          "content-type": "application/json; charset=UTF-8",
          accept: "application/json",
          Authorization: `SharedAccessSignature ${this.streamReadToken}`,
        },
      };
      this.eventSource = new EventSource(
        `${this.baseURL}/v1/journey/streams/${this.customer}?${this.streamReadToken}`,
        header
      );
    }

    if (this.eventSource) {
      this.eventSource!.onmessage = (event: ServerSentEvent) => {
        let data;
        try {
          data = JSON.parse(event.data);
          this.newestEvents = [data, ...this.newestEvents];
        } catch (err) {
          console.log("Event Source Ping");
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
    this.events = [...this.newestEvents, ...this.events];
    this.newestEvents = [];
  }

  renderTimeline(theTimelineItems: CustomerEvent[]) {
    if (theTimelineItems?.length) {
      return html`
        <cjaas-timeline
          .timelineItems=${this.events}
          .newestEvents=${this.newestEvents}
          @new-event-queue-cleared=${this.updateComprehensiveEventList}
          limit=${this.limit}
          event-filters
          ?live-stream=${this.liveStream}
        ></cjaas-timeline>
      `;
    } else {
      return this.getEmptyStateTemplate();
    }
  }

  getEmptyStateTemplate() {
    return html`
      <div class="empty-state">
        ${this.timelineLoading ? this.getSpinner() : this.getTimelineEmptyStateMessage()}
      </div>
    `;
  }

  getTimelineEmptyStateMessage() {
    return html`
      <div class="spinner-container">
        <slot name="ll10n-no-timeline-message">
          <h3>No Timeline available</h3>
        </slot>
        <p class="error-message">
          ${this.errorMessage || nothing}
        </p>
      </div>
    `;
  }

  getSpinner() {
    return html`
      <div class="spinner-container">
        <md-spinner size="32"></md-spinner>
      </div>
    `;
  }

  getFormattedProfile() {
    return html`
      <div class="profile-bound default-template">
        <cjaas-profile .profileData=${this.profileData}></cjaas-profile>
        <section class="customer-journey" title="Customer Journey">
          <div class="header inner-header">
            <slot name="l10n-header-text">
              <h4>Customer Journey</h4>
            </slot>
          </div>
          ${this.getTabs()}
        </section>
      </div>
    `;
  }

  getTabs() {
    // tab data should return the event as such.. Should be rendered by stream component.
    const tabs = this.profileData?.filter(
      (x: any) => x.query.type === "tab" || x.query?.widgetAttributes?.type === "tab"
    );
    // TODO: Track the selected tab to apply a class to the badge for color synching, making blue when selected
    const activityTab = this.profileData
      ? html`
          <md-tab slot="tab">
            <span>All</span>
          </md-tab>
          <md-tab-panel slot="panel">
            ${this.renderTimeline(this.events)}
          </md-tab-panel>
        `
      : html`
          <div class="center full-height">
            <slot name="l10n-no-data-message">
              <div>No data to show</div>
            </slot>
          </div>
        `;
    return html`
      <md-tabs>
        ${activityTab} ${tabs!.map((x: any) => this.getTab(x))}
      </md-tabs>
    `;
  }

  getTab(tab: any) {
    return html`
      <md-tab slot="tab">
        <span>${tab.query.DisplayName}</span
        ><md-badge small>${tab.journeyEvents ? tab.journeyEvents.length : "0"}</md-badge>
      </md-tab>
      <md-tab-panel slot="panel">
        <!-- use verbose journey events with timeline comp -->
        ${tab.journeyEvents
          ? this.renderTimeline(tab.journeyEvents.map((y: any) => this.getTimelineItemFromMessage(y)))
          : nothing}
      </md-tab-panel>
    `;
  }

  static get styles() {
    return styles;
  }

  render() {
    return html`
      <div class="outer-container" part="profile-widget-outer">
        ${this.profileData ? this.getFormattedProfile() : this.getProfileEmptyStateTemplate()}
      </div>
    `;
  }

  getProfileEmptyStateTemplate() {
    return html`
      <div class="empty-state">
        ${this.profileLoading ? this.getSpinner() : this.getProfileEmptyStateMessage()}
      </div>
    `;
  }

  getProfileEmptyStateMessage() {
    return html`
      <div class="spinner-container">
        <slot name="l10n-no-profile-message">
          No Profile available
        </slot>
      </div>
    `;
  }
}
declare global {
  interface HTMLElementTagNameMap {
    "cjaas-profile-view-widget": CjaasProfileWidget;
  }
}
