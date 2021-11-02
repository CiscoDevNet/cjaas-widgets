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
import { defaultTemplate } from "./assets/default-template";
import * as iconData from "@/assets/icons.json";
import { Profile, ServerSentEvent, ProfileFromSyncAPI } from "./types/cjaas";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { EventSourceInitDict } from "eventsource";
import "@cjaas/common-components/dist/comp/cjaas-timeline";
import "@cjaas/common-components/dist/comp/cjaas-profile";
import { Timeline } from "@cjaas/common-components/dist/types/components/timeline/Timeline";
import ResizeObserver from "resize-observer-polyfill";
import { DateTime } from "luxon";

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
  @property({ type: String, attribute: "profile-token" }) profileToken:
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
   * Property to set the data template to retrieve customer Profile in desired format
   * @attr template-id
   */
   @property({ type: String, attribute: "template-id" }) templateId:
   | string
   | undefined;
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
   @internalProperty() profile: Profile | undefined;
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
   * A fallback template in case no template ID is provided
   */
  @internalProperty() defaultTemplate = defaultTemplate;
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
  @query(".profile") widget!: Element;

  connectedCallback() {
    super.connectedCallback();
    if (this.interactionData) {
      this.customer = this.interactionData["ani"];
    }
  }

  async lifecycleTasks() {
    this.events = await this.getExistingEvents();
    this.loading = false;
    this.getProfile();
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
        } else {
          this.expanded = false;
        }
      }
    );

    resizeObserver.observe(this.widget);
  }

  async updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);

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

  baseUrlCheck() {
    if (this.baseURL === undefined) {
      console.error("You must provide a Base URL");
      throw new Error("You must provide a Base URL");
    }
  }

  getProfile() {
    if (this.templateId) {
      this.getProfileFromTemplateId();
      return;
    }

    // Rest of the flow is soon to be deprecated
    this.baseUrlCheck();
    const url = `${this.baseURL}/v1/journey/profileview?personid=${this.customer}`;
    // this.showSpinner = true;

    // set verbose as true for tabbed attributes
    const template = Object.assign({}, this.defaultTemplate);
    template.Attributes = template.Attributes.map((x: any) => {
      if (x.type === "tab" || x?.widgetAttributes?.type === "tab") {
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
        Authorization: "SharedAccessSignature " + this.profileToken
      },
      data
    };
    return axios(url, options)
      .then((x: AxiosResponse) => x.data)
      .then((_profile: ProfileFromSyncAPI) => {
        this.profile = this.defaultTemplate.Attributes.map(
          (attribute: any, i: number) => {
            // if attribute is of tab type
            // save journey events as well
            let journeyEvents = null;
            if (
              attribute.type === "tab" ||
              attribute.widgetAttributes?.type === "tab"
            ) {
              try {
                journeyEvents = JSON.parse(
                  _profile.attributeView[i].journeyEvents || "null"
                );
              } catch {
                console.error("Error while parsing Journey Event");
              }
            }

            return {
              query: attribute,
              result: _profile.attributeView[i].result.split(","),
              journeyEvents
            };
          }
        ) as Profile;

        // this.showSpinner = false;
        this.requestUpdate();
      })
      .catch((err: Error) => {
        console.error("Could not load the Profile Data. ", err);
        this.profile = undefined;
        // this.showSpinner = false;
        this.requestUpdate();
      });
  }

  getProfileFromTemplateId() {
    const url = `${this.baseURL}/v1/journey/views:build?templateId=${this.templateId}&personId=${this.customer}`;
    // this.showSpinner = true;

    const options: AxiosRequestConfig = {
      url,
      method: "POST",
      headers: {
        "Content-type": "application/json",
        Authorization: "SharedAccessSignature " + this.profileToken,
        "X-CACHE-MAXAGE-HOUR": 5
      }
    };

    axios(options)
      .then(x => x.data)
      .then((response) => {
        this.setOffProfileLongPolling(response.data.getUriStatusQuery);
      })
      .catch(err => {
        console.error("Unable to fetch the Profile", err);
        // this.showSpinner = false;
      });
  }

  setOffProfileLongPolling(url: string) {
    const intervalId = setInterval(() => {
      console.log("polling . . .")
      axios({
        url,
        method: "GET",
        headers: {
          "Content-type": "application/json",
          Authorization: "SharedAccessSignature " + this.profileToken
        }
      })
      .then(x => x.data)
      .then((response: any) => {
        if (response.data.runtimeStatus === "Completed") {
            clearInterval(intervalId);
            // this.profile = this.getProfileFromPolledResponse(response);
            // this.showSpinner = false;
            this.profile = response.data.output.attributeView.map(
              (attribute: any) => {
                try {
                  console.log(attribute.queryTemplate)
                  const query = {
                    ...attribute.queryTemplate,
                    widgetAttributes: {
                      type: attribute.queryTemplate?.widgetAttributes.type,
                    tag: attribute.queryTemplate?.widgetAttributes.tag
                    },
                    // temp fix for backward compatibility
                    attributes: {
                      type: attribute.queryTemplate?.widgetAttributes.type,
                      tag: attribute.queryTemplate?.widgetAttributes.tag
                    }
                  };
                  return {
                    query: query,
                    journeyEvents: attribute.journeyEvents?.map(
                      (value: string) => value && JSON.parse(value)
                      ),
                    result: [attribute.Result]
                  };
                }
                  catch(err) {
                    console.error(err)
                  }
              }
            );
          }
        });
    }, 5000);
  }

  getTimelineItemFromMessage(message: any) {
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

  // parses the response from polled API to a valid Profile
  getProfileFromPolledResponse(response: any): Profile {
    debugger;
    return response?.output?.ProfileView?.AttributeView.$values.map(
      (attribute: any) => {
        const query = {
          ...attribute.QueryTemplate,
          widgetAttributes: {
            type: attribute.QueryTemplate?.WidgetAttributes.type,
            tag: attribute.QueryTemplate?.WidgetAttributes.tag
          },
          // temp fix for backward compatibility
          attributes: {
            type: attribute.QueryTemplate?.WidgetAttributes.type,
            tag: attribute.QueryTemplate?.WidgetAttributes.tag
          }
        };
        return {
          query: query,
          journeyEvents: attribute.JourneyEvents?.$values.map(
            (value: string) => value && JSON.parse(value)
          ),
          result: [attribute.Result]
        };
      }
    );
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
        return data.events;
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
            ${this.customer?.trim() || "Customer Journey"}
          </header>
        </md-tooltip>
        <details class="grid-profile" ?open=${this.profile !== undefined}>
          <summary
            >Profile<md-icon name="icon-arrow-down_12"></md-icon>
          </summary>
          <cjaas-profile .profileData=${this.profile}></cjaas-profile>
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
