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
  @internalProperty() eventSource: EventSource | null = null;
  @internalProperty() eventTypes: Array<string> = [];
  @internalProperty() activeTypes: Array<string> = [];
  @internalProperty() activeDateRange!: string;
  @internalProperty() loading = true;
  @internalProperty() errorMessage = "";

  @query(".date-filters") dateFilters!: HTMLElement;
  @query("#events-list") eventsList!: HTMLElement;

  async firstUpdated(changedProperties: PropertyValues) {
    super.firstUpdated(changedProperties);
    const data = await this.getExistingEvents();
    this.events = JSON.parse(data);
    this.getEventTypes();
    // this.activeTypes = this.eventTypes;
    this.loading = false;
    this.requestUpdate();
    this.subscribeToStream();
  }

  updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);

    if (changedProperties.has("events")) {
      this.getEventTypes();
      this.requestUpdate();
    }
  }

  baseUrlCheck() {
    if (this.baseURL === undefined) {
      console.error("You must provide a Base URL");
      throw new Error("You must provide a Base URL");
    }
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
  getAPIQueryParams(forJourney = false) {
    // signature needs to be URI encoded for it to work
    // as query strings
    const signature = this.sasToken?.replace(/sig=(.*)/, (...matches) => {
      return "sig=" + encodeURIComponent(matches[1]);
    });

    let url = signature;

    // if (this.filter) {
    //   url += `&$filter=${this.filter}`;
    // }

    if (this.pagination) {
      url += `&${this.pagination}`;
    } else if (!this.pagination && forJourney) {
      url += "&$top=10";
    }
    return url;
  }

  subscribeToStream() {
    if (this.eventSource) {
      this.eventSource.close();
    }

    // if (this.type === "journey" || this.type === "journey-and-stream") {
    //   this.getJourney();
    // }

    this.baseUrlCheck();
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
        this.events.unshift(data);
        this.requestUpdate();
      }
    };

    this.eventSource.onerror = () => {
      this.loading = false;
    };
  }

  getEventTypes() {
    const eventArray: Set<string> = new Set();
    this.events.forEach(event => {
      eventArray.add(event.type);
    });
    this.eventTypes = Array.from(eventArray);
  }

  toggleFilter(type: string, e:Event) {
    if (this.activeTypes.includes(type)) {
      this.activeTypes = this.activeTypes.filter(item => item !== type);
    } else {
      this.activeTypes.push(type);
    }

    (e.target! as HTMLElement).blur()
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
          @click=${(e:Event) => this.toggleFilter(item, e)}
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
    (e.target! as HTMLElement).blur()
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
    let date!: string;

    return this.events.map(event => {
      if (DateTime.fromISO(event.time) > this.calculateOldestEntry()) {
        let advanceDate = false;
        if (date !== DateTime.fromISO(event.time).toFormat("dd LLL yyyy")) {
          // KPH: check if the date on this iteration should render a new date-marker badge
          date = DateTime.fromISO(event.time).toFormat("dd LLL yyyy");
          advanceDate = true;
        }
        console.log(event.data)
        const titleString = `${event.type}: ${Object.keys(event.data)[0]}`
        return html`
          ${(advanceDate &&
            html`
              <md-badge outlined small>${date}</md-badge>
            `) ||
            nothing}
          <cjaas-timeline-item
            .data=${event}
            title=${titleString}
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
          <md-loading size="large"></md-loading>
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
