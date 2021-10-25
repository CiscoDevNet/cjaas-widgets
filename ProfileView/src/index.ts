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
import { AttributeView, Profile, ProfileFromSyncAPI } from "./types/cjaas";
import { customElementWithCheck } from "./mixins/CustomElementCheck";
import styles from "./assets/styles/View.scss";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { DateTime } from "luxon";
import { nothing } from "lit-html";
import { defaultTemplate } from "./assets/default-template";
import "@momentum-ui/web-components/dist/comp/md-button";
import "@momentum-ui/web-components/dist/comp/md-badge";
import "@momentum-ui/web-components/dist/comp/md-icon";
import "@momentum-ui/web-components/dist/comp/md-spinner";
import "@momentum-ui/web-components/dist/comp/md-tab";
import "@momentum-ui/web-components/dist/comp/md-tabs";
import "@momentum-ui/web-components/dist/comp/md-tab-panel";
import "@cjaas/common-components/dist/comp/cjaas-timeline";
import "@cjaas/common-components/dist/comp/cjaas-profile";
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
@customElementWithCheck("cjaas-profile-view-widget")
export default class CjaasProfileWidget extends LitElement {
  @property() customer: string | undefined;
  @property({ type: String, attribute: "template-id" }) templateId:
    | string
    | undefined;
  @property({ type: String, attribute: "stream-read-token" }) streamReadToken:
    | string
    | null = null;
  @property({ type: String, attribute: "tape-read-token" }) tapeReadToken:
    | string
    | null = null;
  @property({ type: String, attribute: "profile-write-token" })
  profileWriteToken: string | null = null;
  @property({ type: String, attribute: "profile-read-token" })
  profileReadToken: string | null = null;
  @property({ type: String, attribute: "base-url" }) baseURL:
    | string
    | undefined = undefined;
  @property({ type: String, attribute: "base-stream-url" }) baseStreamURL:
    | string
    | undefined = undefined;

  // timeline properties
  @property({ type: Number }) limit = 5;
  @internalProperty() liveStream = false;
  @internalProperty() events: CustomerEvent[] = [];
  @internalProperty() newestEvents: Array<CustomerEvent> = [];

  @internalProperty() eventSource: EventSource | null = null;
  @internalProperty() showTimelineSpinner = false;
  @internalProperty() showSpinner = false;
  @internalProperty() errorMessage = "";
  @internalProperty() profile: Profile | undefined;
  @internalProperty() defaultTemplate = defaultTemplate;
  @internalProperty() templateFromServer: any;

  async lifecycleTasks() {
    const data = await this.getExistingEvents();
    this.events = data.events;

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
      this.customer &&
      this.defaultTemplate &&
      (changedProperties.has("template") ||
        changedProperties.has("customer") ||
        changedProperties.has("templateId"))
    ) {
      this.getProfile();
    }

    if (
      changedProperties.has("profileWriteToken") ||
      changedProperties.has("filter")
    ) {
      this.lifecycleTasks();
    }

    if (
      changedProperties.has("streamToken") ||
      changedProperties.has("customer")
    ) {
      this.lifecycleTasks();
    }
  }

  baseUrlCheck() {
    if (this.baseURL === undefined) {
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
    this.showSpinner = true;

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
        Authorization: "SharedAccessSignature " + this.profileWriteToken
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

        this.showSpinner = false;
        this.requestUpdate();
      })
      .catch((err: Error) => {
        console.error("Could not load the Profile Data. ", err);
        this.profile = undefined;
        this.showSpinner = false;
        this.requestUpdate();
      });
  }

  getProfileFromTemplateId() {
    const url = `${this.baseURL}/v1/journey/views?viewId=${this.templateId}&personId=${this.customer}`;

    this.showSpinner = true;

    const options: AxiosRequestConfig = {
      url,
      method: "POST",
      headers: {
        "Content-type": "application/json",
        Authorization: "SharedAccessSignature " + this.profileReadToken,
        "X-CACHE-MAXAGE-HOUR": 5
      }
    };

    axios(options)
      .then(x => x.data)
      .then((response: { getUriStatusQuery: string; id: string }) => {
        this.setOffProfileLongPolling(response.getUriStatusQuery);
      })
      .catch(err => {
        console.error("Unable to fetch the Profile", err);
        this.showSpinner = false;
      });
  }

  setOffProfileLongPolling(url: string) {
    const intervalId = setInterval(() => {
      axios({
        url,
        method: "GET",
        headers: {
          "Content-type": "application/json",
          Authorization: "SharedAccessSignature " + this.profileReadToken
        }
      })
        .then(x => x.data)
        .then((response: any) => {
          if (response.runtimeStatus === "Completed") {
            clearInterval(intervalId);

            this.profile = this.getProfileFromPolledResponse(response);

            this.showSpinner = false;
            this.profile = response?.output?.ProfileView?.AttributeView.$values.map(
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

  async getExistingEvents() {
    this.showTimelineSpinner = true;
    this.baseUrlCheck();
    return fetch(
      `${this.baseURL}/v1/journey/streams/historic/${this.customer}`,
      {
        headers: {
          "content-type": "application/json; charset=UTF-8",
          accept: "application/json",
          Authorization: `SharedAccessSignature ${this.tapeReadToken}`
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
      .catch((err: any) => {
        this.showTimelineSpinner = false;
        console.error("Could not fetch Customer Journey events. ", err);
        this.errorMessage = `Failure to fetch Journey for ${this.customer}. ${err}`;
      });
  }

  subscribeToStream() {
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
        }
      };
      this.eventSource = new EventSource(
        `${this.baseURL}/v1/journey/streams/${this.customer}?${this.streamReadToken}`,
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
        this.showTimelineSpinner = false;
      };
    } else {
      console.error(`No event source is active for ${this.customer}`);
    }
  }

  updateComprehensiveEventList() {
    this.events = [...this.newestEvents, ...this.events];
    this.newestEvents = [];
  }

  renderTimeline(theTimelineItems: CustomerEvent[]) {
    if (theTimelineItems?.length) {
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
    } else {
      return this.getEmptyStateTemplate();
    }
  }

  getEmptyStateTemplate() {
    return html`
      <div class="empty-state">
        ${this.showTimelineSpinner
          ? this.getSpinner()
          : this.getTimelineEmptyStateMessage()}
      </div>
    `;
  }

  getTimelineEmptyStateMessage() {
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

  getSpinner() {
    return html`
      <div class="spinner-container">
        <md-spinner size="32"></md-spinner>
      </div>
    `;
  }

  getFormattedProfile() {
    return html`
      <div class="profile-bound default-template">
        <cjaas-profile .profileData=${this.profile}></cjaas-profile>
        <section class="customer-journey" title="Customer Journey">
          <div class="header inner-header">
            <slot name="l10n-header-text">
              <h4>Customer Journey</h4>
            </slot>
          </div>
          ${this.getTabs()}
        </section>
      </div>
    `;
  }

  getTabs() {
    // tab data should return the event as such.. Should be rendered by stream component.
    const tabs = this.profile?.filter(
      (x: any) =>
        x.query.type === "tab" || x.query?.widgetAttributes?.type === "tab"
    );

    // TODO: Track the selected tab to apply a class to the badge for color synching, making blue when selected
    const activityTab = this.profileWriteToken
      ? html`
          <md-tab slot="tab">
            <span>All</span>
          </md-tab>
          <md-tab-panel slot="panel">
            ${this.renderTimeline(this.events)}
          </md-tab-panel>
        `
      : html`
          <div class="center full-height">
            <slot name="l10n-no-data-message">
              <div>No data to show</div>
            </slot>
          </div>
        `;
    if (tabs && tabs.length > 0) {
      return html`
        <md-tabs>
          ${activityTab} ${tabs.map((x: any) => this.getTab(x))}
        </md-tabs>
      `;
    } else {
      return activityTab;
    }
  }

  // parses the response from polled API to a valid Profile
  getProfileFromPolledResponse(response: any): Profile {
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

  getTab(tab: any) {
    return html`
      <md-tab slot="tab">
        <span>${tab.query.DisplayName}</span
        ><md-badge small
          >${tab.journeyEvents ? tab.journeyEvents.length : "0"}</md-badge
        >
      </md-tab>
      <md-tab-panel slot="panel">
        <!-- use verbose journey events with timeline comp -->
        ${tab.journeyEvents
          ? this.renderTimeline(
              tab.journeyEvents.map((y: any) =>
                this.getTimelineItemFromMessage(y)
              )
            )
          : nothing}
      </md-tab-panel>
    `;
  }

  static get styles() {
    return styles;
  }

  render() {
    return html`
      <div class="outer-container" part="profile-widget-outer">
        ${this.profile
          ? this.getFormattedProfile()
          : this.getProfileEmptyStateTemplate()}
      </div>
    `;
  }

  getProfileEmptyStateTemplate() {
    return html`
      <div class="empty-state">
        ${this.showSpinner
          ? this.getSpinner()
          : this.getProfileEmptyStateMessage()}
      </div>
    `;
  }

  getProfileEmptyStateMessage() {
    return html`
      <div class="spinner-container">
        <slot name="l10n-no-profile-message">
          No Profile available
        </slot>
      </div>
    `;
  }
}
declare global {
  interface HTMLElementTagNameMap {
    "cjaas-profile-view-widget": CjaasProfileWidget;
  }
}
