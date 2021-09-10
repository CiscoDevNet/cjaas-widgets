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
import { nothing } from "lit-html";
import { customElementWithCheck } from "./mixins/CustomElementCheck";
import styles from "./assets/styles/View.scss";
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

@customElementWithCheck("cjaas-timeline-widget")
export default class CjaasTimelineWidget extends LitElement {
  @property({ type: Array }) events: CustomerEvent[] = [];
  @property({ type: String, attribute: "base-url" }) baseURL:
    | string
    | undefined = undefined;
  @property({ type: String, attribute: "base-stream-url" }) baseStreamURL:
    | string
    | undefined = undefined;
  @property({ type: String, attribute: "tape-read-token" }) tapeToken:
    | string
    | undefined;
  @property({ type: String, attribute: "stream-read-token" }) streamToken:
    | string
    | undefined;
  @property({ type: Number }) limit = 5;
  @property({ type: Boolean, attribute: "show-filters" }) showFilters = false;

  @property({ attribute: "person-id" }) personId = "";
  @internalProperty() eventSource: EventSource | null = null;
  @internalProperty() liveStream = false;
  @internalProperty() showSpinner = false;
  @internalProperty() errorMessage = "";
  @internalProperty() newestEvents: Array<CustomerEvent> = [];

  async lifecycleTasks() {
    const data = await this.getExistingEvents();
    this.events = data.events;
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
      this.tapeToken &&
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
    this.events = [...this.newestEvents, ...this.events];
    this.newestEvents = [];
  }

  async getExistingEvents() {
    this.showSpinner = true;
    this.baseUrlCheck();
    return fetch(
      `${this.baseURL}/v1/journey/streams/historic/${this.personId}`,
      {
        headers: {
          "content-type": "application/json; charset=UTF-8",
          accept: "application/json",
          Authorization: `SharedAccessSignature ${this.tapeToken}`
        },
        method: "GET"
      }
    )
      .then((x: Response) => {
        return x.json();
      })
      .then(data => {
        return data;
      })
      .catch(err => {
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
          Authorization: `SharedAccessSignature ${this.streamToken}`
        }
      };
      this.eventSource = new EventSource(
        `${this.baseURL}/v1/journey/streams/${this.personId}?${this.streamToken}`,
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
