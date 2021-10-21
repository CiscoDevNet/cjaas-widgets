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
import { classMap } from "lit-html/directives/class-map.js";
import { customElementWithCheck } from "./mixins/CustomElementCheck";
import styles from "./assets/styles/View.scss";
import * as iconData from "@/assets/icons.json";
import { Profile, ServerSentEvent } from "./types/cjaas";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { EventSourceInitDict } from "eventsource";
import "@cjaas/common-components/dist/comp/cjaas-timeline";
import "@cjaas/common-components/dist/comp/cjaas-profile";
import { Timeline } from "@cjaas/common-components/dist/types/components/timeline/Timeline";
// import ResizeObserver from "resize-observer-polyfill";

@customElementWithCheck("customer-journey-widget")
export default class CustomerJourneyWidget extends LitElement {
  /**
   * Path to the proper Customer Journey API deployment
   * @attr base-url
   */
  @property({ type: String, attribute: "base-url" }) baseURL:
    | string
    | undefined = undefined;
  /**
   * Customer ID used for Journey lookup
   * @attr customer
   */
  @property({ type: String, reflect: true }) customer: string | null = null;
  /**
   * SAS Token that provides write permissions to Journey API (used for POST data template in Profile retrieval)
   * @attr write-token
   */
  @property({ type: String, attribute: "write-token" }) writeToken:
    | string
    | null = null;
  /**
   * SAS Token that provides read permissions for Historical Journey
   * @attr tape-token
   */
  @property({ type: String, attribute: "tape-token" }) tapeToken:
    | string
    | null = null;
  /**
   * SAS Token that provides read permissions for Journey Stream
   * @attr stream-token
   */
  @property({ type: String, attribute: "stream-token" }) streamToken:
    | string
    | null = null;
  /**
   * Toggles display of field to find new Journey profiles
   * @attr user-search
   */
  @property({ type: Boolean, attribute: "user-search" }) userSearch = false;
  /**
   * Set the number of Timeline Events to display
   * @attr limit
   */
  @property({ type: Number }) limit = 20;
  /**
   * Property to pass in WxCC Global state about current interaction
   * @prop interactionData
   * @type Interaction
   */
  @property({ attribute: false }) interactionData: Interaction | undefined;
  /**
   * Property to pass in data template to retrieve customer Profile in desired format
   * @prop template
   */
  @property({ attribute: false }) template: any;
  /**
   * Property to pass in JSON template to set color and icon settings
   * @prop eventIconTemplate
   */
  @property({ attribute: false })
  eventIconTemplate: any = iconData;
  /**
   * Data pulled from Journey Profile retrieval (will match shape of provided Template)
   * @prop profileData
   */
  @internalProperty() profileData = [];
  /**
   * Timeline data fetched from journey history
   * @prop events
   */
  @internalProperty() events: Array<Timeline.CustomerEvent> = [];
  /**
   * Queue array of incoming events via Stream
   * @prop newestEvents
   */
  @internalProperty() newestEvents: Array<Timeline.CustomerEvent> = [];
  /**
   * Store for Stream event source
   * @prop eventSource
   */
  @internalProperty() eventSource: EventSource | null = null;
  /**
   * Internal toggle to either queue or immediately load new events occurring in the stream
   * @prop liveStream
   */
  @internalProperty() liveStream = false;
  /**
   * Internal toggle of loading state
   * @prop loading
   */
  @internalProperty() loading = true;
  /**
   * Internal store for error message
   * @prop errorMessage
   */
  @internalProperty() errorMessage = "";
  /**
   * Internal toggle for responsive layout
   * @prop expanded
   */
  @internalProperty() expanded = false;

  /**
   * Hook to HTML element <div class="container">
   * @query container
   */
  @query(".container") container!: HTMLElement;
  /**
   * Hook to HTML element <md-input id="customerInput">
   * @query customerInput
   */
  @query("#customerInput") customerInput!: HTMLInputElement;
  @query(".profile") widget!: HTMLElement;

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
    // @ts-ignore
    const resizeObserver = new ResizeObserver(
      (entries: ResizeObserverEntry[]) => {
        if (entries[0].contentRect.width > 780) {
          this.expanded = true;
          console.log(this.expanded);
        } else {
          this.expanded = false;
          console.log(this.expanded);
        }
      }
    );

    resizeObserver.observe(this.widget);
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
          console.error("No data fetched");
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

  handleKey(e: KeyboardEvent) {
    if (e.key === "Enter") {
      e.composedPath()[0].blur();
    }
  }

  renderEvents() {
    return html`
      <cjaas-timeline
        .timelineItems=${this.events}
        .newestEvents=${this.newestEvents}
        .eventIconTemplate=${this.eventIconTemplate}
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

  private get classes() {
    return { expanded: this.expanded };
  }

  static get styles() {
    return styles;
  }

  render() {
    return html`
      <div class="profile${classMap(this.classes)}">
        <md-tooltip
          message="Click to search new journey"
          ?disabled=${!this.userSearch}
        >
          <header
            contenteditable=${this.userSearch ? "true" : "false"}
            @blur=${(e: Event) => {
              this.customer = e.composedPath()[0].innerText;
            }}
            @keydown=${(e: KeyboardEvent) => this.handleKey(e)}
          >
            ${this.customer || "Customer Journey"}
          </header>
        </md-tooltip>
        <details class="grid-profile" ?open=${this.profileData.length > 0}>
          <summary
            >Profile<md-icon name="icon-arrow-down_12"></md-icon>
          </summary>
          <cjaas-profile .profileData=${this.profileData}></cjaas-profile>
        </details>
        <details class="grid-timeline" open>
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
