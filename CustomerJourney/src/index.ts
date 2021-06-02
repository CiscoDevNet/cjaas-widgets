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

export interface CustomerEvent {
  data: Object,
  firstName: string,
  lastName: string,
  email: string,
  datacontenttype: string,
  id: string,
  person: string,
  source: string,
  specversion: string,
  time: string,
  type: string
}

@customElementWithCheck("customer-journey-widget")
export default class CustomerJourneyWidget extends LitElement {
  // @property({ type: Array }) timelineItems: TimelineItem[] = [];
  @property({ type: String, attribute: "base-url" }) baseURL: string | undefined = undefined;
  // @property() filter: string | undefined;

  // widget takes care of URI encoding. Input should not be URI encoded
  @property({ type: String }) customer: string | null = null;
  @property({ type: String, attribute: "sas-token" }) sasToken: string | null = null;
  @property({ reflect: true }) pagination: string = "$top=15";
  // @property({ type: Number }) limit = 5;
  // @property({ reflect: true }) type:
  //   | "journey"
  //   | "livestream"
  //   | "journey-and-stream" = "livestream";

  @internalProperty() events: Array<CustomerEvent> = [];
  @internalProperty() eventTypes: Array<string> = [];
  @internalProperty() activeTypes: Array<string> = [];
  // @internalProperty() eventSource: EventSource | null = null;
  @internalProperty() loading = true;
  @internalProperty() errorMessage = "";


  // updated(changedProperties: PropertyValues) {
  //   super.updated(changedProperties);

  //   if (
  //     this.sasToken &&
  //     (changedProperties.has("sasToken") || changedProperties.has("activeTypes"))
  //   ) {
  //     // debugger;
  //     this.requestUpdate();
  //   }
  // }

  async firstUpdated(changedProperties: PropertyValues) {
    super.firstUpdated(changedProperties);
    const data = await this.getExistingEvents()
    this.events = JSON.parse(data)
    this.getEventTypes();
    this.activeTypes = this.eventTypes;
    this.loading = false;
    this.requestUpdate()
  }

  baseUrlCheck() {
    if (this.baseURL === undefined) {
      console.error("You must provide a Base URL");
      throw new Error("You must provide a Base URL");
    }
  }

  getTimelineItemFromMessage(message: any) {
    // maybe still useful?
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
    this.baseUrlCheck()
    return fetch(`${this.baseURL}/Journey/${this.customer}`, {
      headers: {
        "content-type": "application/json; charset=UTF-8",
        accept: "application/json",
        Authorization: `SharedAccessSignature ${this.sasToken}`,
      },
      method: "GET",
    })
      .then((x: Response) => {
        return x.json()
      })
      .then((data) => {
        return data
      })
      .catch((err) => {
        this.loading = false;
        this.errorMessage = `Failure to fetch Journey ${err}`;
      });
  }

  getEventTypes() {
    const eventArray: Set<string> = new Set
    this.events.forEach((event) => {
      eventArray.add(event.type)
    })
    this.eventTypes = Array.from(eventArray)
  }

  toggleFilter(type: string) {
    // debugger;
    if (this.activeTypes.includes(type)) {
      // debugger
      this.activeTypes = this.activeTypes.filter((item => item !== type))
    }
    else {
      // debugger;
      this.activeTypes.push(type);
    }
    console.log(this.activeTypes)
    this.requestUpdate()
  }

  checkFilter(type: string) {
    return this.activeTypes.includes(type)
  }

  renderFilterButtons() {

    return this.eventTypes.map(item => {
      return html`<md-button id="filter-${item}" ?active=${this.checkFilter(item)} outline color="blue" size=28 @click=${() =>
        this.toggleFilter(item)}>${item}</md-button>`
    })
  }

  renderEvents() {
    // check for date range
    // clip off to top 5 or paginate ?
    let date!: string;

    return this.events.map(event => {
      let advanceDate = false
      if (date !== DateTime.fromISO(event.time).toFormat("dd LLL yyyy")) {
        date = DateTime.fromISO(event.time).toFormat("dd LLL yyyy")
        advanceDate = true;
      }
      return html`
      ${advanceDate && html`<h4>${date}</h4>` || nothing}
      <cjaas-timeline-item .data=${event} title=${event.type} class="show-${this.activeTypes.includes(event.type)}">
      </cjaas-timeline-item>
      `
    })
  }

  static get styles() {
    return styles;
  }

  render() {
    return this.loading ?
      html`<h3>loading</h3>`
      :
      html`
        <div class="container">
          <nav>
            ${this.renderFilterButtons()}
          </nav>
          ${this.renderEvents()}
        </div>
      `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "customer-journey-widget": CustomerJourneyWidget;
  }
}
