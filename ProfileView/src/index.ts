/**
 * Copyright (c) Cisco Systems, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// This file imports all of the webcomponents from "components" folder

import {
  html,
  internalProperty,
  property,
  LitElement,
  PropertyValues
} from "lit-element";
import { Profile } from "./types/cjaas";
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

export interface ServerSentEvent {
  data: string;
}

export type TimelineItem = {
  title: string;
  text?: string;
  person?: string;
  subText?: string;
  data?: any;
  footer?: string;
  timestamp?: any;
  showMore?: boolean;
  id: string;
};

@customElementWithCheck("cjaas-profile-view-widget")
export default class CjaasProfileWidget extends LitElement {
  @property() customer: string | undefined;
  @property() template: any | null | undefined = defaultTemplate;
  @property({ type: String, attribute: "stream-read-token" }) streamReadToken:
    | string
    | null = null;
  @property({ type: String, attribute: "tape-read-token" }) tapeReadToken:
    | string
    | null = null;
  @property({ type: String, attribute: "profile-write-token" })
  profileWriteToken: string | null = null;
  @property({ type: String, attribute: "base-url" }) baseURL:
    | string
    | undefined = undefined;
  @property({ type: String, attribute: "base-stream-url" }) baseStreamURL:
    | string
    | undefined = undefined;

  // timeline properties
  @property({ type: Array }) timelineItems: TimelineItem[] = [];
  @property() filter: string | undefined;
  @property({ reflect: true }) pagination = "$top=15";
  @property({ type: Number }) limit = 5;
  @property({ reflect: true }) timelineType:
    | "journey"
    | "livestream"
    | "journey-and-stream" = "livestream";

  @internalProperty() eventSource: EventSource | null = null;
  @internalProperty() showTimelineSpinner = false;
  @internalProperty() errorMessage = "";

  @internalProperty() profile: any;
  @internalProperty() showSpinner = false;

  updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);

    if (
      this.customer &&
      this.template &&
      (changedProperties.has("template") || changedProperties.has("customer"))
    ) {
      this.getProfile();
    }

    if (
      changedProperties.has("profileWriteToken") ||
      changedProperties.has("filter")
    ) {
      this.timelineItems = [];
      this.subscribeToStream();
    }

    if (
      changedProperties.has("streamToken") ||
      changedProperties.has("customer")
    ) {
      this.timelineItems = [];
      this.getJourney();
      this.subscribeToStream();
    }
  }

  baseUrlCheck() {
    if (this.baseURL === undefined) {
      throw new Error("You must provide a Base URL");
    }
  }

  getProfile() {
    this.baseUrlCheck();
    const url = `${this.baseURL}/v1/journey/profileview?personid=${this.customer}`;
    this.showSpinner = true;

    // set verbose as true for tabbed attributes
    const template = Object.assign({}, this.template);
    template.Attributes = template.Attributes.map((x: any) => {
      if (x.type === "tab") {
        x.Verbose = true;
      }
      return x;
    });

    const data = JSON.stringify(template);
    const options: AxiosRequestConfig = {
      url,
      method: "POST",
      headers: {
        "Content-type": "application/json",
        Authorization: "SharedAccessSignature " + this.profileWriteToken
      },
      data
    };
    return axios(url, options)
      .then((x: AxiosResponse) => x.data)
      .then((x: Profile) => {
        this.profile = this.template.Attributes.map((y: any, i: number) => {
          // if attribute is of tab type
          // save journey events as well
          let journeyEvents = null;
          if (y.type === "tab") {
            try {
              journeyEvents = JSON.parse(
                x.attributeView[i].journeyEvents || "null"
              );
            } catch {
              console.error("Error while parsing Journey Event");
            }
          }

          return {
            query: y,
            result: x.attributeView[i].result.split(","),
            journeyEvents
          };
        });

        this.showSpinner = false;
        this.requestUpdate();
      })
      .catch((err: Error) => {
        console.log(err);
        this.profile = undefined;
        this.showSpinner = false;
        this.requestUpdate();
      });
  }

  // Timeline Logic
  // defaults to top 10 for journey
  getTimelineAPIQueryParams(forJourney = false) {
    let url = this.tapeReadToken;

    if (this.filter) {
      url += `&$filter=${this.filter}`;
    }

    if (this.pagination) {
      url += `&${this.pagination}`;
    } else if (!this.pagination && forJourney) {
      url += "&$top=10";
    }
    return url;
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

  getJourney() {
    this.showTimelineSpinner = true;
    this.baseUrlCheck();
    // gets historic journey

    let url;

    if (this.customer) {
      url = `${this.baseURL}/v1/journey/streams/historic/${this.customer}`;
    } else {
      url = `${this.baseURL}/v1/journey/streams/historic`;
    }

    fetch(`${url}?${this.getTimelineAPIQueryParams(true)}`, {
      headers: {
        "content-type": "application/json; charset=UTF-8"
      },
      method: "GET"
    })
      .then((x: Response) => x.json())
      .then((x: { events: Array<ServerSentEvent> }) => {
        x?.events
          ?.map((y: ServerSentEvent) => this.getTimelineItemFromMessage(y))
          .map((z: TimelineItem) => this.enqueueItem(z));
      })
      .then(() => {
        this.showTimelineSpinner = false;
      })
      .catch(err => {
        this.showTimelineSpinner = false;
        this.errorMessage = `Failure to fetch Journey ${err}`;
      });
  }

  subscribeToStream() {
    if (this.eventSource) {
      this.eventSource.close();
    }

    this.baseUrlCheck();
    if (this.streamReadToken === null) {
      console.error("Please provide a Stream Read Token");
    }

    let url;

    if (this.customer) {
      url = `${this.baseURL}/v1/journey/streams/${this.customer}`;
    } else {
      url = `${this.baseURL}/v1/journey/streams`;
    }

    this.eventSource = new EventSource(`${url}?${this.streamReadToken}`);
    // @ts-ignore
    this.eventSource.onmessage = (event: ServerSentEvent) => {
      let data;
      try {
        data = JSON.parse(event.data);
      } catch (err) {
        // received just the timestamp
      }

      if (data) {
        this.enqueueItem(this.getTimelineItemFromMessage(data));
        this.showSpinner = false;
      }
    };

    this.eventSource.onerror = () => {
      this.showSpinner = false;
    };
  }

  public enqueueItem(item: TimelineItem) {
    while (
      this.timelineItems.length >= this.limit &&
      this.timelineType === "livestream"
    ) {
      this.dequeuePastOneItem();
    }
    const dataLength = this.timelineItems.length;

    // events may not be chronologically sorted by default
    if (dataLength === 0) {
      this.timelineItems = [item];
    } else if (this.timelineItems[0].timestamp < item.timestamp) {
      this.timelineItems = [item, ...this.timelineItems];
    } else if (this.timelineItems[dataLength - 1].timestamp > item.timestamp) {
      this.timelineItems = [...this.timelineItems, item];
    } else {
      let currentIndex = 0;
      let currentItem = this.timelineItems[currentIndex];
      while (
        currentItem.timestamp > item.timestamp &&
        currentIndex < this.timelineItems.length
      ) {
        currentIndex = currentIndex + 1;
        currentItem = this.timelineItems[currentIndex];
      }
      this.timelineItems.splice(currentIndex, 0, item);
      this.showTimelineSpinner = false;
    }
  }

  dequeuePastOneItem() {
    this.timelineItems.shift();
  }

  renderTimeline(theTimelineItems: TimelineItem[]) {
    if (theTimelineItems?.length) {
      return html`
        <cjaas-timeline
          id="cjaas-timeline-component"
          .timelineItems=${theTimelineItems}
          limit=${this.limit}
          type=${this.timelineType}
        ></cjaas-timeline>
      `;
    } else {
      return this.getEmptyStateTemplate();
    }
  }

  getEmptyStateTemplate() {
    return html`
      <div class="empty-state">
        ${this.showTimelineSpinner
          ? this.getSpinner()
          : this.getTimelineEmptyStateMessage()}
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
        <cjaas-profile .profileData=${this.profile}></cjaas-profile>
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

  getLoadingSpinner() {
    return this.showSpinner
      ? html`
          <div class="spinner-container">
            <md-spinner size="20"></md-spinner>
          </div>
        `
      : html`
          <md-button
            .circle=${true}
            color="white"
            size="28"
            title="Reload Profile"
            @click=${() => this.getProfile()}
          >
            <md-icon name="icon-refresh_24" size="20"></md-icon>
          </md-button>
        `;
  }

  getTabs() {
    // tab data should return the event as such.. Should be rendered by stream component.
    const tabs = this.profile.filter((x: any) => x.query.type === "tab");
    // TODO: Track the selected tab to apply a class to the badge for color synching, making blue when selected
    const activityTab = this.profileWriteToken
      ? html`
          <md-tab slot="tab">
            <span>All</span>
          </md-tab>
          <md-tab-panel slot="panel">
            ${this.renderTimeline(this.timelineItems)}
          </md-tab-panel>
        `
      : html`
          <div class="center full-height">
            <slot name="l10n-no-data-message">
              <div>No data to show</div>
            </slot>
          </div>
        `;
    if (tabs && tabs.length > 0) {
      return html`
        <md-tabs>
          ${activityTab} ${tabs.map((x: any) => this.getTab(x))}
        </md-tabs>
      `;
    } else {
      return activityTab;
    }
  }

  getTab(tab: any) {
    return html`
      <md-tab slot="tab">
        <span>${tab.query.DisplayName}</span
        ><md-badge small
          >${tab.journeyEvents ? tab.journeyEvents.length : "0"}</md-badge
        >
      </md-tab>
      <md-tab-panel slot="panel">
        <!-- use verbose journey events with timeline comp -->
        ${tab.journeyEvents
          ? this.renderTimeline(
              tab.journeyEvents.map((y: any) =>
                this.getTimelineItemFromMessage(y)
              )
            )
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
        ${this.profile
          ? this.getFormattedProfile()
          : this.getProfileEmptyStateTemplate()}
      </div>
    `;
  }

  getProfileEmptyStateTemplate() {
    return html`
      <div class="empty-state">
        ${this.showSpinner
          ? this.getSpinner()
          : this.getProfileEmptyStateMessage()}
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
