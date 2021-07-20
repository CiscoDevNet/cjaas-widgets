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
  query,
} from "lit-element";
import { nothing } from "lit-html";
import { classMap } from "lit-html/directives/class-map";
import { customElementWithCheck } from "./mixins/CustomElementCheck";
import styles from "./assets/styles/View.scss";
import { DateTime } from "luxon";
import { Button, ButtonGroup, Input } from "@momentum-ui/web-components";
import { ServerSentEvent } from "./types/cjaas";
import { EventSourceInitDict } from "eventsource";
import "@cjaas/common-components/dist/comp/cjaas-timeline-item";
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
  @property({ type: String, reflect: true }) customer: string | null = null;
  @property({ type: String, attribute: "tape-token" }) tapeToken:
    | string
    | null = null;
  @property({ type: String, attribute: "stream-token" }) streamToken:
    | string
    | null = null;
  @property({ reflect: true }) pagination = "$top=15";
  @property({ type: Number }) limit = 5;
  @property({ attribute: false }) interactionData: Interaction | undefined;

  @internalProperty() events: Array<CustomerEvent> = [];
  @internalProperty() newestEvents: Array<CustomerEvent> = [];
  @internalProperty() eventSource: EventSource | null = null;
  @internalProperty() eventTypes: Array<string> = [];
  @internalProperty() activeTypes: Array<string> = [];
  @internalProperty() activeDateRange!: string;
  @internalProperty() liveLoading = false;
  @internalProperty() loading = true;
  @internalProperty() expanded = false;
  @internalProperty() errorMessage = "";

  @query(".date-filters") dateFilters!: HTMLElement;
  @query("#events-list") eventsList!: HTMLElement;
  @query(".container") container!: HTMLElement;
  @query("#customerInput") customerInput!: HTMLInputElement;

  activeDates: Array<string> = [];

  connectedCallback() {
    super.connectedCallback();
    if (this.interactionData) {
      this.customer = this.interactionData["ani"];
    }
  }

  async lifecycleTasks() {
    const data = await this.getExistingEvents();
    this.events = data.events;
    this.getEventTypes();
    this.activeTypes = this.eventTypes;
    this.loading = false;
    this.requestUpdate();
    this.subscribeToStream();
  }

  async firstUpdated(changedProperties: PropertyValues) {
    super.firstUpdated(changedProperties);
    await this.lifecycleTasks();

    // @ts-ignore
    const ro = new ResizeObserver((entries: any) => {
      for (const entry of entries) {
        const cr = entry.contentRect;
        if (cr.width < 589) {
          this.expanded = false;
        } else {
          this.expanded = true;
        }
      }
    });
    ro.observe(this.container as Element);
  }

  private get resizeClassMap() {
    return {
      expanded: this.expanded,
    };
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
    }
  }

  changeCustomer() {
    this.customer = this.customerInput.value;
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
    return fetch(
      `${this.baseURL}/v1/journey/streams/historic/${this.customer}`,
      {
        headers: {
          "content-type": "application/json; charset=UTF-8",
          accept: "application/json",
          Authorization: `SharedAccessSignature ${this.tapeToken}`,
        },
        method: "GET",
      }
    )
      .then((x: Response) => {
        return x.json();
      })
      .then((data) => {
        return data;
      })
      .catch((err) => {
        this.loading = false;
        this.errorMessage = `Failure to fetch Journey ${err}`;
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

    this.eventSource!.onmessage = (event: ServerSentEvent) => {
      let data;
      try {
        data = JSON.parse(event.data);
      } catch (err) {
        // received just the timestamp
      }

      if (data) {
        this.newestEvents.unshift(data);
        if (this.liveLoading) {
          this.showNewEvents();
        }
        this.requestUpdate();
      }
    };

    this.eventSource!.onerror = () => {
      this.loading = false;
    };
  }

  getEventTypes() {
    const eventArray: Set<string> = new Set();
    this.events.forEach((event) => {
      eventArray.add(event.type);
    });
    this.eventTypes = Array.from(eventArray);
  }

  toggleFilter(type: string, e: Event) {
    if (this.activeTypes.includes(type)) {
      this.activeTypes = this.activeTypes.filter((item) => item !== type);
    } else {
      this.activeTypes.push(type);
    }

    (e.target! as HTMLElement).blur();
    this.requestUpdate();
  }

  checkFilter(type: string) {
    return this.activeTypes.includes(type);
  }

  renderFilterButtons() {
    return this.eventTypes.map((item) => {
      return html`
        <md-button
          id="filter-${item}"
          ?active=${this.checkFilter(item)}
          outline
          color="blue"
          size="28"
          @click=${(e: Event) => this.toggleFilter(item, e)}
          >${item}</md-button
        >
      `;
    });
  }

  toggleActive(e: Event) {
    const button = e.target as Button.ELEMENT;
    button.active = !button.active;
    this.activeDateRange = button.id.substr(12, button.id.length - 1);
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
      <md-button-group>
        <button
          slot="button"
          id="filter-last-day"
          type="button"
          @click=${(e: Event) => this.toggleActive(e)}
          value="Day"
        >
          Day
        </button>
        <button
          slot="button"
          id="filter-last-week"
          type="button"
          @click=${(e: Event) => this.toggleActive(e)}
          value="Week"
        >
          Week
        </button>
        <button
          slot="button"
          id="filter-last-month"
          type="button"
          @click=${(e: Event) => this.toggleActive(e)}
          value="Month"
        >
          Month
        </button>
      </md-button-group>
    `;
  }

  showNewEvents() {
    if (this.newestEvents.length > 0) {
      this.events.unshift(...this.newestEvents);
      this.newestEvents = [];
      this.requestUpdate();
    }
  }

  toggleLiveEvents() {
    this.liveLoading = !this.liveLoading;
    if (this.newestEvents.length > 0) {
      this.showNewEvents();
    }
  }

  renderNewEventStack() {
    return html`
      <md-toggle-switch
        smaller
        @click=${() => this.toggleLiveEvents()}
        ?checked=${this.liveLoading}
      >
        <span style="font-size:.75rem;">
          Show live events
        </span>
      </md-toggle-switch>
      ${this.newestEvents.length > 0
        ? html`
            <md-chip
              class="event-counter"
              small
              color="blue"
              @click=${() => this.showNewEvents()}
              value="Show ${this.newestEvents.length} new events"
            ></md-chip>
          `
        : nothing}
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
    }
  }

  hideDate(e: Event) {
    const date = (e.target! as HTMLElement).id;
    if (this.activeDates.includes(date)) {
      this.activeDates = this.activeDates.filter((e) => e !== date);
    } else {
      this.activeDates.push(date);
    }
    this.requestUpdate();
  }

  renderEvents() {
    let date!: string;
    const localLimit = this.limit;
    let numberOfResults = 0;

    return this.events.map((event) => {
      if (DateTime.fromISO(event.time) > this.calculateOldestEntry()) {
        let advanceDate = false;
        const stringDate = DateTime.fromISO(event.time).toFormat("dd LLL yyyy");
        if (date !== stringDate) {
          // KPH: check if the date on this iteration should render a new date-marker badge
          date = stringDate;
          advanceDate = true;
          // this.activeDates.indexOf(date) === -1 ? this.activeDates.push(stringDate) : nothing
        }

        const titleString = this.getTitleString(event);
        numberOfResults++;
        return numberOfResults <= localLimit
          ? html`
              ${(advanceDate &&
                html`
                  <md-badge
                    outlined
                    small
                    id=${date}
                    @click=${(e: Event) => this.hideDate(e)}
                    >${date}</md-badge
                  >
                `) ||
                nothing}
              <cjaas-timeline-item
                .data=${event}
                title=${titleString}
                class="timeline-item show-${this.activeTypes.includes(
                  event.type
                ) || this.activeDates.includes(stringDate)}"
                timestamp=${event.time}
                id=${event.id}
              >
              </cjaas-timeline-item>
            `
          : nothing;
      }
    });
  }

  getTitleString(event: CustomerEvent) {
    const type = event.type;

    let subTitle;
    if (type === "Identify") {
      subTitle = event.person;
    } else if (type === "Page Visit") {
      subTitle = event.data?.page?.url;
    } else {
      const keys = Object.keys(event.data || {});
      subTitle = event.data ? event.data[keys[0]] : "";
    }

    return `${type}${subTitle ? " : " : ""}${subTitle || ""}`;
  }

  static get styles() {
    return styles;
  }

  render() {
    return html`
      <div class="profile ${classMap(this.resizeClassMap)}">
        <md-input
          id="customerInput"
          class="profile"
          shape="pill"
          placeholder="Journey ID e.g. '98126-Kevin'"
        ></md-input>
        <md-button @click=${() => this.changeCustomer()}
          >Load Journey</md-button
        >
      </div>
      <div class="container ${classMap(this.resizeClassMap)}">
        ${this.loading
          ? html`
              <md-loading size="middle"></md-loading>
            `
          : html`
              <nav>
                <div class="filter-buttons">
                  ${this.renderFilterButtons()}
                </div>
              </nav>
              <section id="events-list">
                <div class="new-events">
                  ${this.renderDateRangeButtons()} ${this.renderNewEventStack()}
                </div>
                ${this.renderEvents()}
                ${this.events.length > this.limit && this.activeTypes.length > 0
                  ? html`
                      <md-link
                        @click=${(e: Event) => {
                          e.preventDefault();
                          this.limit += 5;
                        }}
                        >Load More</md-link
                      >
                    `
                  : nothing}
              </section>
            `}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "customer-journey-widget": CustomerJourneyWidget;
  }
}
