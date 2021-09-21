/**
 * Copyright (c) Cisco Systems, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  html,
  internalProperty,
  property,
  LitElement,
  PropertyValues,
  query
} from "lit-element";
import { customElementWithCheck } from "./mixins/CustomElementCheck";
import { sampleTemplate } from "./[sandbox]/sandbox.mock";
import styles from "./assets/styles/View.scss";
import { Profile, ServerSentEvent } from "./types/cjaas";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { EventSourceInitDict } from "eventsource";
import "@cjaas/common-components/dist/comp/cjaas-timeline-item";
import "@cjaas/common-components/dist/comp/cjaas-timeline";
import "@cjaas/common-components/dist/comp/cjaas-event-toggles";
import "@cjaas/common-components/dist/comp/cjaas-profile";
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
  @property({ type: String, attribute: "write-token" }) writeToken:
    | string
    | null = null;
  @property({ type: String, attribute: "tape-token" }) tapeToken:
    | string
    | null = null;
  @property({ type: String, attribute: "stream-token" }) streamToken:
    | string
    | null = null;
  @property({ type: Number }) limit = 20;
  @property({ attribute: false }) interactionData: Interaction | undefined;
  @property({ attribute: false }) template: any;

  @internalProperty() profileData = [];
  @internalProperty() events: Array<CustomerEvent> = [];
  @internalProperty() newestEvents: Array<CustomerEvent> = [];
  @internalProperty() eventSource: EventSource | null = null;
  @internalProperty() liveStream = false;
  @internalProperty() loading = true;
  @internalProperty() errorMessage = "";

  @query(".container") container!: HTMLElement;
  @query("#customerInput") customerInput!: HTMLInputElement;

  connectedCallback() {
    super.connectedCallback();
    if (this.interactionData) {
      this.customer = this.interactionData["ani"];
    }
  }

  async lifecycleTasks() {
    const data = await this.getExistingEvents();
    this.events = data.events;
    this.getProfile();
    this.loading = false;
    this.requestUpdate();
    this.subscribeToStream();
  }

  async firstUpdated(changedProperties: PropertyValues) {
    super.firstUpdated(changedProperties);
    await this.lifecycleTasks();
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

  baseUrlCheck() {
    if (this.baseURL === undefined) {
      console.error("You must provide a Base URL");
      throw new Error("You must provide a Base URL");
    }
  }

  getProfile() {
    this.baseUrlCheck();
    const url = `${this.baseURL}/v1/journey/profileview?personid=${this.customer}`;
    // this.showSpinner = true;

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
        Authorization: "SharedAccessSignature " + this.writeToken
      },
      data
    };
    return axios(url, options)
      .then((x: AxiosResponse) => x.data)
      .then((x: Profile) => {
        this.profileData = this.template.Attributes.map((y: any, i: number) => {
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

        // this.showSpinner = false;
        this.requestUpdate();
      })
      .catch((err: Error) => {
        console.error("Could not load the Profile Data. ", err);
        this.profileData = [];
        // this.showSpinner = false;
        this.requestUpdate();
      });
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
        this.loading = false;
        console.error("Could not fetch Customer Journey events. ", err);
        this.errorMessage = `Failure to fetch Journey for ${this.customer}. ${err}`;
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
        `${this.baseURL}/v1/journey/streams/${this.customer}?${this.streamToken}`,
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
        this.loading = false;
      };
    } else {
      console.error(`No event source is active for ${this.customer}`);
    }
  }

  updateComprehensiveEventList() {
    this.events = [...this.newestEvents, ...this.events];
    this.newestEvents = [];
  }

  renderEvents() {
    return html`
      <cjaas-timeline
        .timelineItems=${this.events}
        .newestEvents=${this.newestEvents}
        @new-event-queue-cleared=${this.updateComprehensiveEventList}
        limit=${this.limit}
        event-filters
        ?live-stream=${this.liveStream}
      ></cjaas-timeline>
    `;
  }

  renderLoader() {
    return html`
      <md-loading size="middle"></md-loading>
    `;
  }

  renderEventList() {
    return html`
      <section id="events-list">
        ${this.renderEvents()}
      </section>
    `;
  }

  static get styles() {
    return styles;
  }

  render() {
    return html`
      <div class="profile">
        <details open>
          <summary
            >Search
            <md-icon name="icon-arrow-down_12"></md-icon>
          </summary>
          <div class="search-ui">
            <md-input
              id="customerInput"
              class="profile"
              shape="pill"
              placeholder="Journey ID e.g. '98126-Kevin'"
            ></md-input>
            <md-button @click=${this.changeCustomer}>Load Journey</md-button>
          </div>
        </details>
        <details open>
          <summary
            >Profile<md-icon name="icon-arrow-down_12"></md-icon>
          </summary>
          <cjaas-profile .profileData=${this.profileData}></cjaas-profile>
        </details>
        <details open>
          <summary
            >Journey
            <md-icon name="icon-arrow-down_12"></md-icon>
          </summary>
          <div class="container">
            ${this.loading ? this.renderLoader() : this.renderEventList()}
          </div>
        </details>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "customer-journey-widget": CustomerJourneyWidget;
  }
}
