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
import {generateSasToken, TokenArgs} from "./generatesastoken";


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
  @property({ type: String}) secret:
    | string
    | undefined = undefined;
  @property({ type: String}) org:
    | string
    | undefined = undefined;
  @property({ type: String}) namespace:
    | string
    | undefined = undefined;
  @property({ type: String, attribute: "app-name"}) appname:
    | string
    | undefined = undefined;
  @property({ type: String, attribute: "base-url" }) baseURL:
    | string
    | undefined = undefined;
    /**
     * Potentially deprecated
     */
  // @property({ type: String, attribute: "tape-read-token" }) tapeReadToken:
  //   | string
  //   | undefined;
  // @property({ type: String, attribute: "stream-read-token" }) streamReadToken:
  //   | string
  //   | undefined;
  /**
   * Set number of events shown by default
   * @attr limit
   */
  @property({ type: Number }) limit = 5;
  /**
   * Toggle whether new live events appear in the timeline or not
   * @attr live-stream
   */
  @property({type: Boolean, attribute: "live-stream"}) liveStream = false;
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

  /**
   * Private SAS Tokens generated and stored in component instance
   */

  private getTokens() {
    const that = this;
    return {
      getTToken: function() {
        const tapeArgs: TokenArgs = {
          secret: that.secret!,
          organization: that.org!,
          namespace: that.namespace!,
          service: "tape",
          permissions: "r",
          keyName: that.appname!,
          expiration: 1000,
        }
        return generateSasToken(tapeArgs)
      },

      getSToken: function() {
        const tapeArgs: TokenArgs = {
          secret: that.secret!,
          organization: that.org!,
          namespace: that.namespace!,
          service: "stream",
          permissions: "r",
          keyName: that.appname!,
          expiration: 1000,
        }
        return generateSasToken(tapeArgs)
      }
    }

  }

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

    /**
     * If we hide tokens, they will not change from within, and this reload will occur in another fashion.
     * Would this scenario occur in real usage?
     */
    // if (
    //   this.tapeReadToken &&
    //   (changedProperties.has("tapeReadToken") ||
    //     changedProperties.has("filter") ||
    //     changedProperties.has("personId"))
    // ) {
    //   this.lifecycleTasks();
    // }
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
    const {getTToken} = this.getTokens()
    return fetch(
      `${this.baseURL}/v1/journey/streams/historic/${this.personId}`,
      {
        headers: {
          "content-type": "application/json; charset=UTF-8",
          accept: "application/json",
          Authorization: `SharedAccessSignature ${getTToken()}`
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
      const {getSToken} = this.getTokens()
      const header: EventSourceInitDict = {
        headers: {
          "content-type": "application/json; charset=UTF-8",
          accept: "application/json",
          Authorization: `SharedAccessSignature ${getSToken()}`
        }
      };
      this.eventSource = new EventSource(
        `${this.baseURL}/v1/journey/streams/${this.personId}?${getSToken()}`,
        header
      );

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
