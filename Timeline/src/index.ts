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
import { EventSourceInitDict } from "eventsource";
import { ServerSentEvent } from "./types/cjaas";
import { DateTime } from "luxon";
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
  time: any;
  type: string;
}

function sortEventsbyDate(events: CustomerEvent[]) {
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

@customElementWithCheck("cjaas-timeline-widget")
export default class CjaasTimelineWidget extends LitElement {
  /**
   * Set primary API base url
   * @attr base-url
   */
  @property({ type: String, attribute: "base-url" }) baseURL:
    | string
    | undefined = undefined;
  /**
   * @attr tape-read-token
   */
  @property({ type: String, attribute: "tape-read-token" }) tapeReadToken:
    | string
    | undefined;
  /**
   * @attr stream-read-token
   */
  @property({ type: String, attribute: "stream-read-token" }) streamToken:
    | string
    | undefined;
  /**
   * Set number of events shown by default
   * @attr limit
   */
  @property({ type: Number }) limit = 5;
  /**
   * Toggle whether new live events appear in the timeline or not
   * @attr live-stream
   */
  @property({ type: Boolean, attribute: "live-stream" }) liveStream = false;
  /**
   * Toggle visibility of the timeline filters
   * @attr show-filters
   */
  @property({ type: Boolean, attribute: "show-filters" }) showFilters = false;
  /**
   * Set the ID of the record being fetched
   * @attr person-id
   */
  @property({ attribute: "person-id" }) personId = "";
  /**
   * Store for the event source of incoming live events
   * @prop eventSource
   */
  @internalProperty() eventSource: EventSource | null = null;
  /**
   * @prop showSpinner
   */
  @internalProperty() showSpinner = false;
  /**
   * @prop errorMessage
   */
  @internalProperty() errorMessage = "";
  /**
   * Store of fetched timeline event
   * @prop events
   */
  @internalProperty() events: CustomerEvent[] = [];
  /**
   * @prop newestEvents
   */
  @internalProperty() newestEvents: Array<CustomerEvent> = [];

  async lifecycleTasks() {
    const data = await this.getExistingEvents();
    // sort events by time
    this.events = sortEventsbyDate(data.events);
    this.showSpinner = false;
    this.requestUpdate();
    this.subscribeToStream();
  }

  async firstUpdated(changedProperties: PropertyValues) {
    super.firstUpdated(changedProperties);
    await this.lifecycleTasks();
  }

  updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);

    if (
      this.tapeReadToken &&
      (changedProperties.has("tapeReadToken") ||
        changedProperties.has("personId"))
    ) {
      this.lifecycleTasks();
    }
  }

  baseUrlCheck() {
    if (this.baseURL === undefined) {
      console.error("You must provide a Base URL");
      throw new Error("You must provide a Base URL");
    }
  }

  updateComprehensiveEventList() {
    // sort events by time
    this.events = sortEventsbyDate([...this.newestEvents, ...this.events]);
    this.newestEvents = [];
  }

  async getExistingEvents() {
    this.showSpinner = true;
    this.baseUrlCheck();
    return fetch(
      `${this.baseURL}/streams/v1/journey/historic/${this.personId}`,
      {
        headers: {
          "content-type": "application/json; charset=UTF-8",
          accept: "application/json",
          Authorization: `SharedAccessSignature ${this.tapeReadToken}`,
        },
        method: "GET",
      },
    )
      .then((x: Response) => {
        return x.json();
      })
      .then((data) => {
        data.events = data.events.map((event: CustomerEvent) => {
          event.time = DateTime.fromISO(event.time);
          return event;
        });
        return data;
      })
      .catch((err) => {
        this.showSpinner = false;
        console.error("Could not fetch Customer Journey events. ", err);
        this.errorMessage = `Failure to fetch Journey for ${this.personId}. ${err}`;
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
        `${this.baseURL}/streams/v1/journey/${this.personId}?${this.streamToken}`,
        header,
      );
    }

    if (this.eventSource) {
      this.eventSource.onmessage = (event: ServerSentEvent) => {
        let data;
        try {
          data = JSON.parse(event.data);
          data.time = DateTime.fromISO(data.time);
          this.newestEvents = [data, ...this.newestEvents];
        } catch (err) {
          console.log("Event Source Ping");
        }
      };

      this.eventSource.onerror = () => {
        this.showSpinner = false;
      };
    } else {
      console.error(`No event source is active for ${this.personId}`);
    }
  }

  static get styles() {
    return styles;
  }

  renderTimeline() {
    return html`
      <cjaas-timeline
        .timelineItems=${this.events}
        .newestEvents=${this.newestEvents}
        @new-event-queue-cleared=${this.updateComprehensiveEventList}
        limit=${this.limit}
        ?event-filters=${this.showFilters}
        ?live-stream=${this.liveStream}
      ></cjaas-timeline>
    `;
  }

  render() {
    return html`
      <div class="outer-container">
        ${this.events?.length
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
