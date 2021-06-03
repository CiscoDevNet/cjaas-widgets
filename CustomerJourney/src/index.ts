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
  query
} from "lit-element";
import { nothing } from "lit-html";
import { customElementWithCheck } from "./mixins/CustomElementCheck";
import styles from "./assets/styles/View.scss";
import { DateTime } from "luxon";
import { Button, ButtonGroup } from "@momentum-ui/web-components";

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

@customElementWithCheck("customer-journey-widget")
export default class CustomerJourneyWidget extends LitElement {
  @property({ type: String, attribute: "base-url" }) baseURL:
    | string
    | undefined = undefined;
  @property({ type: String }) customer: string | null = null;
  @property({ type: String, attribute: "sas-token" }) sasToken:
    | string
    | null = null;
  @property({ reflect: true }) pagination = "$top=15";
  // @property({ type: Number }) limit = 5;

  @internalProperty() events: Array<CustomerEvent> = [];
  @internalProperty() eventTypes: Array<string> = [];
  @internalProperty() activeTypes: Array<string> = [];
  @internalProperty() activeDateRange!: string;
  @internalProperty() loading = true;
  @internalProperty() errorMessage = "";

  @query(".date-filters") dateFilters!: HTMLElement;

  async firstUpdated(changedProperties: PropertyValues) {
    super.firstUpdated(changedProperties);
    const data = await this.getExistingEvents();
    this.events = JSON.parse(data);
    this.getEventTypes();
    this.activeTypes = this.eventTypes;
    this.loading = false;
    this.requestUpdate();
  }

  baseUrlCheck() {
    if (this.baseURL === undefined) {
      console.error("You must provide a Base URL");
      throw new Error("You must provide a Base URL");
    }
  }

  getTimelineItemFromMessage(message: any) {
    // KPH: maybe still useful?
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

  async getExistingEvents() {
    this.loading = true;
    this.baseUrlCheck();
    return fetch(`${this.baseURL}/Journey/${this.customer}`, {
      headers: {
        "content-type": "application/json; charset=UTF-8",
        accept: "application/json",
        Authorization: `SharedAccessSignature ${this.sasToken}`
      },
      method: "GET"
    })
      .then((x: Response) => {
        return x.json();
      })
      .then(data => {
        return data;
      })
      .catch(err => {
        this.loading = false;
        this.errorMessage = `Failure to fetch Journey ${err}`;
      });
  }

  getEventTypes() {
    const eventArray: Set<string> = new Set();
    this.events.forEach(event => {
      eventArray.add(event.type);
    });
    this.eventTypes = Array.from(eventArray);
  }

  toggleFilter(type: string) {
    if (this.activeTypes.includes(type)) {
      this.activeTypes = this.activeTypes.filter(item => item !== type);
    } else {
      this.activeTypes.push(type);
    }
    this.requestUpdate();
  }

  checkFilter(type: string) {
    return this.activeTypes.includes(type);
  }

  renderFilterButtons() {
    return this.eventTypes.map(item => {
      return html`
        <md-button
          id="filter-${item}"
          ?active=${this.checkFilter(item)}
          outline
          color="blue"
          size="28"
          @click=${() => this.toggleFilter(item)}
          >${item}</md-button
        >
      `;
    });
  }

  toggleActive(e: Event) {
    const button = e.target as Button.ELEMENT;
    button.active = !button.active;
    this.activeDateRange = button.id.substr(12, button.id.length - 1);
    this.deactivateOtherButtons(button.id);
    this.requestUpdate();
  }

  deactivateOtherButtons(id: string) {
    const allButtons = (this.dateFilters.querySelectorAll(
      ".date-filter"
    ) as unknown) as Array<Button.ELEMENT>;
    allButtons.forEach((element: Button.ELEMENT) => {
      element.id !== id ? (element.active = false) : nothing;
    });
  }

  renderDateRangeButtons() {
    return html`
      <md-button
        class="date-filter"
        id="filter-last-day"
        ?active=${false}
        outline
        color="mint"
        size="28"
        @click=${(e: Event) => this.toggleActive(e)}
        >Last Day</md-button
      >

      <md-button
        class="date-filter"
        id="filter-last-week"
        ?active=${false}
        outline
        color="mint"
        size="28"
        @click=${(e: Event) => this.toggleActive(e)}
        >Last Week</md-button
      >

      <md-button
        class="date-filter"
        id="filter-last-month"
        ?active=${false}
        outline
        color="mint"
        size="28"
        @click=${(e: Event) => this.toggleActive(e)}
        >Last Month</md-button
      >
    `;
  }

  calculateOldestEntry() {
    switch (this.activeDateRange) {
      case "day":
        return DateTime.now().minus({ day: 1 });
      case "week":
        return DateTime.now().minus({ week: 1 });
      case "month":
        return DateTime.now().minus({ month: 1 });
      default:
        return DateTime.now().minus({ year: 1 });
        break;
    }
  }

  renderEvents() {
    // check for date range
    // clip off to top 5 or paginate ?
    let date!: string;

    return this.events.map(event => {
      if (DateTime.fromISO(event.time) > this.calculateOldestEntry()) {
        let advanceDate = false;
        if (date !== DateTime.fromISO(event.time).toFormat("dd LLL yyyy")) {
          date = DateTime.fromISO(event.time).toFormat("dd LLL yyyy");
          advanceDate = true;
        }
        return html`
          ${(advanceDate &&
            html`
              <md-badge outlined small>${date}</md-badge>
            `) ||
            nothing}
          <cjaas-timeline-item
            .data=${event}
            title=${event.type}
            class="timeline-item show-${this.activeTypes.includes(event.type)}"
            timestamp=${event.time}
            id=${event.id}
          >
          </cjaas-timeline-item>
        `;
      }
    });
  }

  static get styles() {
    return styles;
  }

  render() {
    return this.loading
      ? html`
          <md-loading></md-loading>
        `
      : html`
          <div class="container">
            <nav>
              <div class="filter-buttons">
                ${this.renderFilterButtons()}
              </div>
              <div class="date-filters">
                ${this.renderDateRangeButtons()}
              </div>
            </nav>
            <section id="events-list">
              ${this.renderEvents()}
            </section>
          </div>
        `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "customer-journey-widget": CustomerJourneyWidget;
  }
}
