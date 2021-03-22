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

export type TimelineEvent = {
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
}

@customElementWithCheck("cjaas-timeline-widget")
export default class CjaasTimelineWidget extends LitElement {
  @property({ type: Array }) timelineEvents: TimelineEvent[] = [];
  @property({ type: String }) baseURL = "https://trycjaas.exp.bz";
  @property() filter: string | undefined;
  @property({ attribute: "stream-id" }) streamId: string | null = null;
  @property({ reflect: true }) pagination: string | null = null;
  @property({ type: Number }) limit = 5;
  @property({ reflect: true }) type:
    | "journey"
    | "livestream"
    | "journey-and-stream" = "livestream";

  @internalProperty() eventSource: EventSource | null = null;
  @internalProperty() showSpinner = false;
  @internalProperty() errorMessage = "";

  updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);

    if (
      this.streamId &&
      (changedProperties.has("streamId") || changedProperties.has("filter"))
    ) {
      this.timelineEvents = [];
      this.requestUpdate();
      this.subscribeToStream();
    }
  }

  // defaults to top 10 for journey
  getAPIQueryParams(forJourney = false) {
    let url = this.streamId;
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

  getTimelineEventFromMessage(message: any) {
    const event: any = {};

    event.title = message.type;
    event.timestamp = DateTime.fromISO(message.time);
    event.id = message.id;
    if (message.person && message.person.indexOf("anon") === -1) {
      event.person = message.person;
    }

    if (message.data) {
      event.data = message.data;
    }

    return event;
  }

  getJourney() {
    this.showSpinner = true;

    // gets historic journey
    fetch(`${this.baseURL}/journey?${this.getAPIQueryParams(true)}`, {
      headers: {
        "content-type": "application/json; charset=UTF-8",
      },
      method: "GET",
    })
      .then((x: Response) => x.json())
      .then((x: Array<ServerSentEvent>) => {
        x?.map((y: ServerSentEvent) =>
          this.getTimelineEventFromMessage(y)
        ).map((z: TimelineEvent) => this.enqueueEvent(z));
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
      this.eventSource = new EventSource(
        `${this.baseURL}/real-time?${this.getAPIQueryParams()}`
      );

      this.eventSource.onmessage = (event: ServerSentEvent) => {
        let data;
        try {
          data = JSON.parse(event.data);
        } catch (err) {
          // received just the timestamp
        }

        if (data) {
          this.enqueueEvent(this.getTimelineEventFromMessage(data));
          this.showSpinner = false;
        }
      };

      this.eventSource.onerror = () => {
        this.showSpinner = false;
      };
    }
  }

  public enqueueEvent(event: TimelineEvent) {
    while (
      this.timelineEvents.length >= this.limit &&
      this.type === "livestream"
    ) {
      this.dequeuePastOneEvent();
    }

    const dataLength = this.timelineEvents.length;

    // events may not be chronologically sorted by default
    if (dataLength === 0) {
      this.timelineEvents = [event];
    } else if (this.timelineEvents[0].timestamp < event.timestamp) {
      this.timelineEvents = [event, ...this.timelineEvents];
    } else if (
      this.timelineEvents[dataLength - 1].timestamp > event.timestamp
    ) {
      this.timelineEvents = [...this.timelineEvents, event];
    } else {
      let currentIndex = 0;
      let currentItem = this.timelineEvents[currentIndex];
      while (
        currentItem.timestamp > event.timestamp &&
        currentIndex < this.timelineEvents.length
      ) {
        currentIndex = currentIndex + 1;
        currentItem = this.timelineEvents[currentIndex];
      }
      this.timelineEvents.splice(currentIndex, 0, event);
    }
  }

  dequeuePastOneEvent() {
    this.timelineEvents.shift();
  }

  static get styles() {
    return styles;
  }

  renderTimeline() {
    return html`
      <cjaas-timeline
        .timelineEvents=${this.timelineEvents}
        limit=${this.limit}
      ></cjaas-timeline>
    `;
  }

  render() {
    return html`
      <div class="outer-container">
        ${this.timelineEvents?.length
          ? this.renderTimeline()
          : html`
              <div class="empty-state">
                ${this.showSpinner
                  ? html`
                      <div class="spinner-container">
                        <md-spinner size="32"></md-spinner>
                      </div>
                    `
                  : html`
                      <div class="spinner-container">
                        <h3>No Timeline available</h3>
                        <p class="error-message">
                          ${this.errorMessage || nothing}
                        </p>
                      </div>
                    `}
              </div>
            `}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "cjaas-timeline-widget": CjaasTimelineWidget;
  }
}
