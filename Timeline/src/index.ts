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
  PropertyValues,
} from "lit-element";
import { nothing } from "lit-html";
import { customElementWithCheck } from "./mixins/CustomElementCheck";
import styles from "./assets/styles/View.scss";
import { DateTime } from "luxon";

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

export interface ServerSentEvent {
  data: string;
  events: [];
}

@customElementWithCheck("cjaas-timeline-widget")
export default class CjaasTimelineWidget extends LitElement {
  @property({ type: Array }) timelineItems: TimelineItem[] = [];
  @property({ type: String, attribute: "base-url" }) baseURL:
    | string
    | undefined = undefined;
  @property({ type: String, attribute: "base-stream-url" }) baseStreamURL:
    | string
    | undefined = undefined;
  @property() filter: string | undefined;

  @property({ type: String, attribute: "tape-read-token" }) tapeReadToken:
    | string
    | undefined;
  @property({ type: String, attribute: "stream-read-token" }) streamReadToken:
    | string
    | undefined;
  @property({ reflect: true }) pagination = "$top=15";
  @property({ type: Number }) limit = 5;
  @property({ reflect: true }) type:
    | "journey"
    | "livestream"
    | "journey-and-stream" = "livestream";

  @property({ attribute: "person-id" }) personId: string | undefined;
  @internalProperty() eventSource: EventSource | null = null;
  @internalProperty() showSpinner = false;
  @internalProperty() errorMessage = "";

  updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);

    if (
      this.tapeReadToken &&
      (changedProperties.has("tapeReadToken") ||
        changedProperties.has("filter") ||
        changedProperties.has("personId"))
    ) {
      this.timelineItems = [];
      this.requestUpdate();
      this.subscribeToStream();
    }
  }

  baseUrlCheck() {
    if (this.baseURL === undefined) {
      console.error("You must provide a Base URL");
      throw new Error("You must provide a Base URL");
    }
  }

  getSASTokenForQueryParams(token: string | undefined): string | undefined {
    return token?.replace(/sig=(.*)/, (...matches) => {
      return "sig=" + encodeURIComponent(matches[1]);
    });
  }
  // defaults to top 10 for journey
  getAPIQueryParams(forJourney = false) {
    // signature needs to be URI encoded for it to work
    // as query strings
    "so=demoassure&sn=sandbox&ss=tape&sp=r&se=2022-06-16T19:11:33.176Z&sk=sandbox&sig=7G8UdEipQHnWOV3hRbTqkNxxjQNHkkQYGDlCrgEhK0k=";
    const signature = this.getSASTokenForQueryParams(this.tapeReadToken);

    let url = signature;

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
    this.showSpinner = true;
    this.baseUrlCheck();
    let url;
    if (this.personId) {
      url = `${this.baseURL}/v1/journey/streams/historic/${this.personId}`;
    } else {
      url = `${this.baseURL}/v1/journey/streams/historic`;
    }

    // gets historic journey
    fetch(`${url}?${this.getAPIQueryParams(true)}`, {
      headers: {
        "content-type": "application/json; charset=UTF-8",
        Authorization: `SharedAccessSignature ${this.tapeReadToken}`,
      },
      method: "GET",
    })
      .then((x: Response) => x.json())
      .then((x: ServerSentEvent) => {
        x?.events
          ?.map((y: ServerSentEvent) => this.getTimelineItemFromMessage(y))
          .map((z: TimelineItem) => this.enqueueItem(z));
      })
      .then(() => {
        this.showSpinner = false;
      })
      .catch((err) => {
        this.showSpinner = false;
        this.errorMessage = `Failure to fetch Journey ${err}`;
      });
  }

  subscribeToStream() {
    if (this.eventSource) {
      this.eventSource.close();
    }

    if (this.type === "journey" || this.type === "journey-and-stream") {
      this.getJourney();
    }

    if (this.type !== "journey") {
      this.baseUrlCheck();

      let url;
      if (this.personId) {
        url = `${this.baseStreamURL || this.baseURL}/v1/journey/streams/${
          this.personId
        }`;
      } else {
        url = `${this.baseStreamURL || this.baseURL}/v1/journey/streams`;
      }

      this.eventSource = new EventSource(
        `${url}?${this.getSASTokenForQueryParams(this.streamReadToken)}`
      );

      // @ts-ignore
      this.eventSource.onmessage = (event: ServerSentEvent) => {
        let data;
        try {
          data = JSON.parse(event.data);
        } catch (err) {
          console.error(err);
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
  }

  public enqueueItem(item: TimelineItem) {
    while (
      this.timelineItems.length >= this.limit &&
      this.type === "livestream"
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
    }
  }

  dequeuePastOneItem() {
    this.timelineItems.shift();
  }

  static get styles() {
    return styles;
  }

  renderTimeline() {
    return html`
      <cjaas-timeline
        id="cjaas-timeline-component"
        .timelineItems=${this.timelineItems}
        limit=${this.limit}
        type=${this.type}
      ></cjaas-timeline>
    `;
  }

  render() {
    return html`
      <div class="outer-container">
        ${this.timelineItems?.length
          ? this.renderTimeline()
          : this.getEmptyStateTemplate()}
      </div>
    `;
  }

  getEmptyStateTemplate() {
    return html`
      <div class="empty-state">
        ${this.showSpinner ? this.getSpinner() : this.getEmptyStateMessage()}
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

  getEmptyStateMessage() {
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
}

declare global {
  interface HTMLElementTagNameMap {
    "cjaas-timeline-widget": CjaasTimelineWidget;
  }
}
