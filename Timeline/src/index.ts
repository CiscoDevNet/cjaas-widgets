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
import * as iconData from "./assets/icons.json";
import styles from "./assets/styles/View.scss";
import { EventSourceInitDict } from "eventsource";
import { ServerSentEvent } from "./types/cjaas";
import { DateTime } from "luxon";
import { Timeline } from "@cjaas/common-components/dist/types/components/timeline/Timeline";

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
  @property({ type: String, attribute: "base-url" }) baseUrl:
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
  @property({ type: String, attribute: "stream-read-token" }) streamReadToken:
    | string
    | undefined;
  /**
   * Set number of events shown by default
   * @attr limit
   */
  @property({ type: Number }) limit = 5;
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
   * Customer ID used for Journey lookup
   * @attr customer
   */
  @property({ type: String, reflect: true }) customer: string | null = null;

  /**
   * Internal toggle of loading state for timeline section
   * @prop getEventsInProgress
   */
  @internalProperty() getEventsInProgress = false;
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
  @internalProperty() events: Array<CustomerEvent> = [];
  /**
   * @prop newestEvents
   */
  @internalProperty() newestEvents: Array<CustomerEvent> = [];

  async update(changedProperties: PropertyValues) {
    super.update(changedProperties);

    if (changedProperties.has("customer")) {
      this.newestEvents = [];
      this.getExistingEvents(this.customer || null);
      this.subscribeToStream(this.customer || null);
    }
  }

  baseUrlCheck() {
    if (this.baseUrl === undefined) {
      console.error("You must provide a Base URL");
      throw new Error("You must provide a Base URL");
    }
  }

  encodeCustomer(customer: string | null): string | null {
    const encodedCustomer = customer ? btoa(customer) : null;
    return encodedCustomer;
  }

  updateComprehensiveEventList() {
    // sort events by time
    if (this.events) {
      this.events = sortEventsbyDate([...this.newestEvents, ...this.events]);
    }
    this.newestEvents = [];
  }

  async getExistingEvents(customer: string | null) {
    this.events = [];

    this.getEventsInProgress = true;
    console.log('getEventsInProgress', this.getEventsInProgress);

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
        console.log('getEventsInProgress', this.getEventsInProgress);

        return data.events;
      })
      .catch((err: Error) => {
        console.error(`[JDS Widget] Could not fetch Customer Journey events for customer (${customer})`, err);
        // this.errorMessage = `Failure to fetch Journey for ${this.customer}. ${err}`;
      }).finally(() => {
        this.getEventsInProgress = false;
        console.log('getEventsInProgress', this.getEventsInProgress);

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

  static get styles() {
    return styles;
  }

  renderTimeline() {
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

  render() {
    return html`
      <!-- <div class="outer-container"> -->
        ${this.renderTimeline()}
      <!-- </div> -->
    `;
  }

  getSpinner() {
    return html`
      <div class="spinner-container">
        <md-spinner size="32"></md-spinner>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "cjaas-timeline-widget": CjaasTimelineWidget;
  }
}
