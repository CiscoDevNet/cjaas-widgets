/**
 * Copyright (c) Cisco Systems, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { html, internalProperty, property, LitElement, PropertyValues, query } from "lit-element";
import { classMap } from "lit-html/directives/class-map.js";
import { customElementWithCheck } from "./mixins/CustomElementCheck";
import axiosRetry from "axios-retry";
import styles from "./assets/styles/View.scss";
import * as iconData from "@/assets/icons.json";
import { EventSourceInitDict } from "eventsource";
import "@cjaas/common-components/dist/comp/cjaas-timeline";
import "@cjaas/common-components/dist/comp/cjaas-profile";
import "@cjaas/common-components/dist/comp/cjaas-identity";
import { Timeline } from "@cjaas/common-components/dist/types/components/timeline/Timeline";
import { DateTime } from "luxon";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
// @ts-ignore
import { version } from "../version";
import {
  Profile,
  ServerSentEvent,
  IdentityData,
  IdentityResponse,
  AliasObject,
  jsonPatchOperation,
} from "./types/cjaas";
import { nothing } from "lit-html";
import { mockedCustomUITimelineItems } from "./[sandbox]/sandbox.mock";

export enum EventType {
  Agent = "agent",
  Task = "task",
}

export enum TimeFrame {
  "All" = "All",
  "24-Hours" = "24-Hours",
  "7-Days" = "7-Days",
  "30-Days" = "30-Days",
}

export enum RawAliasTypes {
  Phone = "phone",
  Email = "email",
  CustomerId = "customerId",
  Unknown = "unknown",
  Unselected = "",
}

export enum IdentityAliasTypes {
  Phone = "phone",
  Email = "email",
  CustomerId = "customerId",
}

export enum PatchOperations {
  Add = "add",
  Remove = "remove",
  Replace = "replace",
}

@customElementWithCheck("customer-journey-widget")
export default class CustomerJourneyWidget extends LitElement {
  /**
   * Bearer Token for authentication
   * @prop bearerToken
   */
  @property({ attribute: false }) bearerToken: string | null = "";

  /**
   * Property to pass in WxCC Global state about current interaction
   * @prop interactionData
   * @type Interaction
   */
  @property({ attribute: false }) interactionData: Interaction | undefined;
  /**
   * Property to pass in JSON template to set color and icon settings
   * @prop eventIconTemplate
   */
  @property({ attribute: false }) eventIconTemplate: Timeline.TimelineCustomizations = iconData;

  /**
   * Organization ID
   * @prop organizationId
   */
  @property({ attribute: false }) organizationId: string | undefined = undefined;

  /**
   * Boolean to turn on more logs
   * @attr logs-on
   */
  @property({ type: Boolean, attribute: "logs-on" }) logsOn = false;
  /**
   * Path to the proper Customer Journey API deployment
   * @attr base-url
   */
  @property({ type: String, attribute: "base-url" }) baseUrl: string | undefined = undefined;
  /**
   * Project ID within your organization
   * @attr project-id
   */
  @property({ type: String, attribute: "project-id" }) projectId: string | undefined = undefined;
  /**
   * Customer ID or alias used for Journey lookup
   * @attr customer
   */
  @property({ type: String, reflect: true }) customer: string | null = null;
  /**
   * Customer ID or alias used for Journey lookup
   * @attr customer
   */
  @property({ type: String, attribute: "cad-variable-lookup" }) cadVariableLookup: string | null = null;

  /**
   * Toggles off display of field to find new Journey profiles
   * @attr disable-user-search
   */
  @property({ type: Boolean, attribute: "disable-user-search" }) disableUserSearch = false;

  /**
   * Path to the proper Customer Journey API deployment
   * @attr base-url
   */
  @property({ type: Boolean, attribute: "read-only-aliases" }) readOnlyAliases = false;

  /**
   * Set the number of Timeline Events to display
   * @attr limit
   */
  @property({ type: Number }) limit = 20;
  /**
   * Property to set the data template to retrieve customer Profile in desired format
   * @attr template-id
   */
  @property({ type: String, attribute: "template-id" }) templateId: string | undefined = undefined;
  /**
   * Property to pass in url of iconData JSON template to set color and icon settings
   * @prop iconDataPath
   */
  @property({ type: String, attribute: "icon-data-path" }) iconDataPath: string = "";
  /**
   * @prop badgeKeyword
   * set badge icon based on declared keyword from dataset
   */
  @property({ type: String, attribute: "badge-keyword" }) badgeKeyword = "channelType";
  /**
   * @prop collapse-timeline-section
   * determines whether the timeline section is collapsed by default
   */
  @property({ type: Boolean, attribute: "collapse-timeline-section" }) collapseTimelineSection = false;
  /**
   * @prop collapse-profile-section
   * determines whether the profile section is collapsed by default
   */
  @property({ type: Boolean, attribute: "collapse-profile-section" }) collapseProfileSection = false;
  /**
   * @prop collapse-alias-section
   * determines whether the alias section is collapsed by default
   */
  @property({ type: Boolean, attribute: "collapse-alias-section" }) collapseAliasSection = false;
  /**
   * @attr time-frame
   * Determine default time frame on start
   */
  @property({ type: String, attribute: "time-frame" }) timeFrame: TimeFrame = TimeFrame.All;
  /**
   * Toggle to either queue or immediately load new events occurring in the stream
   * @prop disable-event-stream
   */
  @property({ type: Boolean, attribute: "disable-event-stream" }) disableEventStream = false;
  /**
   * Toggle whether or not to hide all wxcc events from the journey timeline
   * @prop hideWxccEvents
   */
  @property({ type: Boolean, attribute: "hide-wxcc-events" }) hideWxccEvents = false;
  /**
   * Toggle whether or not to show only 1 event of each TaskId
   * @prop compactWxccEvents
   */
  @property({ type: Boolean, attribute: "compact-wxcc-events" }) compactWxccEvents = false;
  /**
   * Toggle whether or not to ignore undefined origin timeline events
   * @prop ignoreUndefinedOrigins
   */
  @property({ type: Boolean, attribute: "ignore-undefined-origins" }) ignoreUndefinedOrigins = false;

  /**
   * Feature flag to enable sub text url links
   * @prop parseSubTextUrls
   */
  @property({ type: Boolean, attribute: "enable-sub-text-links" }) enableSubTextLinks = true;

  /**
   * Data pulled from Journey Profile retrieval (will match shape of provided Template)
   * @prop profileData
   */
  @internalProperty() profileData: Profile | undefined;
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
   * Store for Stream event source for journey event data
   * @prop journeyEventSource
   */
  @internalProperty() journeyEventSource: EventSource | null = null;
  /**
   * Store for Stream event source for profile data
   * @prop profileEventSource
   */
  @internalProperty() profileEventSource: EventSource | null = null;
  /**
   * Internal toggle of loading state for timeline section
   * @prop getEventsInProgress
   */
  @internalProperty() getEventsInProgress = false;
  /**
   * Internal toggle of loading state for profile section
   * @prop getProfileDataInProgress
   */
  @internalProperty() getProfileDataInProgress = false;

  /**
   * Internal store for alias error messages
   * @prop aliasErrorMessage
   */
  @internalProperty() aliasErrorMessage = "";

  /**
   * Internal store for profile error messages
   * @prop profileErrorMessage
   */
  @internalProperty() profileErrorMessage = "";

  /**
   * Internal store for profile name error messages
   * @prop profileNameErrorMessage
   */
  @internalProperty() nameApiErrorMessage = "";

  /**
   * Internal store for timeline error messages
   * @prop timelineErrorMessage
   */
  @internalProperty() timelineErrorMessage = "";

  /**
   * Internal toggle for responsive layout
   * @prop expanded
   */
  @internalProperty() expanded = false;

  @internalProperty() aliasAddInProgress = false;

  @internalProperty() aliasGetInProgress = false;

  @internalProperty() aliasDeleteInProgress: { [key: string]: boolean } = {};

  @internalProperty() aliasNamesUpdateInProgress = false;

  @internalProperty() firstName = "";

  @internalProperty() lastName = "";

  @internalProperty() identityData: IdentityData | undefined;

  @internalProperty() identityId: string | undefined = undefined;

  @internalProperty() hasProfileAPIBeenCalled = false;

  @internalProperty() hasIdentityAPIBeenCalled = false;

  @internalProperty() hasHistoricalEventsAPIBeenCalled = false;

  @internalProperty() aliasObjects: Array<AliasObject> = [];

  basicRetryConfig = {
    retries: 1,
    retryDelay: () => 3000,
    shouldResetTimeout: true,
    retryCondition: (_error: any) => true,
  };

  /**
   * Hook to HTML element <div class="container">
   * @query container
   */
  @query(".container") container!: HTMLElement;
  /**
   * Hook to HTML element <md-input id="customerInput">
   * @query customerInput
   */
  @query("#customer-input") customerInput!: HTMLInputElement;
  @query(".profile") widget!: Element;

  async firstUpdated(_changedProperties: PropertyValues) {
    super.firstUpdated(_changedProperties);

    console.log(`[JDS Widget][Version] customer-journey-${version}`);
  }

  async update(changedProperties: PropertyValues) {
    super.update(changedProperties);

    if (changedProperties.has("iconDataPath") && this.iconDataPath) {
      this.loadJSON(
        this.iconDataPath,
        (iconDataJson: Timeline.TimelineCustomizations) => {
          this.eventIconTemplate = iconDataJson;
          this.debugLogMessage("Icon data loaded externally", this.eventIconTemplate);
        },
        (error: string) => {
          console.error("[JDS Widget] iconDataPath: failed to load external icon mapping file", error);
        }
      );
    }

    if (
      (changedProperties.has("organizationId") ||
        changedProperties.has("projectId") ||
        changedProperties.has("templateId")) &&
      this.organizationId &&
      this.projectId &&
      this.templateId
    ) {
      this.debugLogMessage(
        "organizationId",
        this.organizationId,
        "projectId",
        this.projectId,
        "templateId",
        this.templateId
      );
    }

    if (changedProperties.has("interactionData")) {
      if (this.interactionData) {
        this.debugLogMessage("interactionData", this.interactionData);

        let cadVariableValue;
        if (this.cadVariableLookup && this.interactionData?.callAssociatedData) {
          cadVariableValue = this.interactionData.callAssociatedData[this.cadVariableLookup]?.value;
          if (!cadVariableValue) {
            console.error(
              `The CAD Variable (${this.cadVariableLookup}) doesn\'t exist within this interaction. Please check your flow configuration.`
            );
          }
        }

        if (cadVariableValue) {
          this.customer = cadVariableValue;
          this.debugLogMessage(`SET customer identifier (CAD Variable: ${this.cadVariableLookup})`, this.customer);
        } else if (this.interactionData?.contactDirection === "OUTBOUND") {
          this.customer = this.interactionData?.dnis || null;
          this.debugLogMessage(
            `SET customer identifier (contactDirection: ${this.interactionData?.contactDirection})`,
            this.customer
          );
        } else {
          this.customer = this.interactionData?.ani || null;
          this.debugLogMessage(
            `SET customer identifier (contactDirection: ${this.interactionData?.contactDirection})`,
            this.customer
          );
        }
      } else {
        this.customer = null;
      }
    }

    if (changedProperties.has("customer")) {
      this.handleNewCustomer();
    }
  }

  debugLogMessage(infoMessage: string, ...args: any[]) {
    if (this.logsOn) {
      console.log(`[JDS WIDGET][LOGS-ON] ${infoMessage}`, args);
    }
  }

  sortEventsbyDate(events: Timeline.CustomerEvent[]) {
    events?.sort((previous, current) => {
      if (previous.time > current.time) {
        return -1;
      } else if (previous.time < current.time) {
        return 1;
      } else {
        return 0;
      }
    });

    this.debugLogMessage("Verbose Sorted Events", events);

    if (this.compactWxccEvents) {
      const filteredEvents = this.filterUniqueTaskIds(events);
      this.debugLogMessage("Sorted Events (Per Unique TaskId)", filteredEvents);
      return filteredEvents;
    }
    return events;
  }

  loadJSON(path: string, success: any, error: any) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          success(JSON.parse(xhr.responseText));
        } else {
          error(xhr);
        }
      }
    };
    xhr.open("GET", path, true);
    xhr.send();
  }

  baseUrlCheck() {
    if (this.baseUrl === undefined) {
      console.error("[JDS Widget] You must provide a Base URL");
      throw new Error("[JDS Widget] You must provide a Base URL");
    }
  }

  encodeParameter(value: string | null): string | null {
    const encodedUrlValue = value ? encodeURIComponent(value) : null;
    return encodedUrlValue;
  }

  async getDefaultTemplateId() {
    const templateName = "journey-default-template";
    const url = `${this.baseUrl}/admin/v1/api/profile-view-template/workspace-id/${this.projectId}/template-name/${templateName} `;

    const config: AxiosRequestConfig = {
      method: "GET",
      url,
      headers: {
        Authorization: `Bearer ${this.bearerToken}`,
      },
    };

    const axiosInstance = axios.create(config);

    return axiosInstance
      .get(url)
      .then(response => {
        const { id } = response?.data?.data;
        return id;
      })
      .catch((err: Error) => {
        console.error(`[JDS Widget] Unable to fetch the ID of the journey-default-template`, err);
        return undefined;
      });
  }

  subscribeToProfileViewStream(customer: string | null, templateId: string | undefined) {
    if (!customer || !templateId) {
      console.error(`[JDS WIDGET] Failed to stream progressive profile view. Need customer & templateId provided.`);
      return;
    }

    if (this.profileEventSource) {
      this.profileEventSource.close();
    }

    this.baseUrlCheck();

    if (this.bearerToken) {
      const header: EventSourceInitDict = {
        headers: {
          "content-type": "application/json; charset=UTF-8",
          accept: "application/json",
          Authorization: `Bearer ${this.bearerToken}`,
        },
      };

      const url = `${this.baseUrl}/v1/api/progressive-profile-view/stream/workspace-id/${this.projectId}/identity/${customer}/template-id/${templateId}?organizationId=${this.organizationId}&bearerToken=${this.bearerToken}`;
      this.profileEventSource = new EventSource(url, header);
    }

    if (this.profileEventSource) {
      this.profileEventSource.onopen = event => {
        console.log(
          `[JDS Widget] The ProfileView stream connection has been established for customer \'${customer}\'.`
        );
      };

      this.profileEventSource.onmessage = (event: ServerSentEvent) => {
        this.debugLogMessage("[JDS Widget] profileEventSource.onmessage", event.data);

        let data;

        try {
          data = JSON.parse(event.data);
          this.debugLogMessage("streaming profileEventSource data", data);

          const { attributes, personId } = data;
          this.profileErrorMessage = "";
          this.profileData = this.parseProfileResponse(attributes, personId);
        } catch (err) {
          console.error("[JDS Widget] profile/stream: No parsable data fetched");
        }
      };

      this.journeyEventSource!.onerror = error => {
        console.error(`[JDS Widget] There was an Profile EventSource error: `, error);
      };
    } else {
      console.error(`[JDS Widget] No Profile EventSource is active for ${customer}`);
    }
  }

  getProfileView(identityId: string | undefined, templateId: string | undefined) {
    this.profileData = undefined;
    this.getProfileDataInProgress = true;

    if (!identityId || !templateId) {
      this.getProfileDataInProgress = false;
      console.error(`[JDS WIDGET] Failed to fetch the profile data. Need identityId & templateId provided.`);
      return;
    }

    const url = `${this.baseUrl}/v1/api/progressive-profile-view/workspace-id/${this.projectId}/person-id/${this.identityId}/template-id/${templateId}`;

    const config: AxiosRequestConfig = {
      method: "GET",
      url,
      headers: {
        Authorization: `Bearer ${this.bearerToken}`,
      },
    };

    const axiosInstance = axios.create(config);

    if (!this.hasProfileAPIBeenCalled) {
      axiosRetry(axiosInstance, this.basicRetryConfig);
    }

    return axiosInstance
      .get(url)
      .then(response => {
        const { attributes, personId } = response?.data?.data[0];
        this.profileErrorMessage = "";
        this.profileData = this.parseProfileResponse(attributes, personId);
      })
      .catch((err: Error) => {
        this.profileData = undefined;
        this.profileErrorMessage = `Failed to fetch the profile data.`;
        console.error(
          `[JDS Widget] Unable to fetch the Profile for customer (${this.customer}) with templateId (${templateId})`,
          err
        );
      })
      .finally(() => {
        this.getProfileDataInProgress = false;

        if (!this.hasProfileAPIBeenCalled) {
          this.hasProfileAPIBeenCalled = true;
        }
      });
  }

  parseProfileResponse(attributes: any, personId: string) {
    const profileTablePayload = attributes?.map((attribute: any) => {
      const _query = {
        ...attribute.queryTemplate,
        widgetAttributes: {
          type: attribute.queryTemplate?.widgetAttributes.type,
          tag: attribute.queryTemplate?.widgetAttributes.tag,
        },
      };
      return {
        query: _query,
        journeyEvents: attribute.journeyEvents?.map((value: string) => value && JSON.parse(value)),
        result: [attribute.result],
      };
    });

    profileTablePayload.personId = personId;
    return profileTablePayload;
  }

  parseWxccData(event: Timeline.CustomerEvent) {
    const [eventType, eventSubType] = event?.type.split(":");
    const channelTypeText = event?.data?.channelType === "telephony" ? "call" : event?.data?.channelType;
    const agentState = event?.data?.currentState;
    const formattedAgentState = agentState ? agentState?.charAt(0)?.toUpperCase() + agentState?.slice(1) : undefined;
    const { channelType, currentState } = event?.data;

    let wxccTitle, wxccSubTitle, wxccIconType, wxccFilterType;
    const isWxccEvent = event.source.includes("com/cisco/wxcc");

    const compactWxccSubTitle = !this.compactWxccEvents
      ? `${eventSubType || ""} ${channelTypeText || ""}`
      : isWxccEvent
      ? `WXCC ${channelTypeText || ""} event`
      : channelTypeText || "";

    switch (eventType) {
      case EventType.Agent:
        wxccTitle = `Agent ${formattedAgentState || "Event"}`;
        wxccFilterType = currentState ? `agent ${currentState}` : "";
        wxccIconType = "agent";
        break;
      case EventType.Task:
        wxccTitle = event?.data?.origin || event?.identity;
        // wxccSubTitle = `${eventSubType || ""} ${channelTypeText || ""}`;
        wxccSubTitle = compactWxccSubTitle;
        wxccFilterType = channelType || event?.identitytype;
        wxccIconType = channelType || event?.identitytype;
        break;
      default:
        wxccTitle = event?.data?.origin || event?.identity;
        wxccSubTitle = `${channelTypeText || ""}`;
        wxccFilterType = channelType || event?.identitytype || "misc";
        wxccIconType = channelType || event?.identitytype;
        break;
    }

    const wxccFilterTypes = isWxccEvent ? ["WXCC"] : [];
    if (wxccFilterType) {
      wxccFilterTypes.push(wxccFilterType);
    }

    return {
      wxccTitle,
      wxccSubTitle,
      wxccIconType,
      wxccFilterTypes,
    };
  }

  hasUniqueTaskId(event: Timeline.CustomerEvent, uniqueTaskIds: Set<string>) {
    return (!event?.data?.taskId || !uniqueTaskIds.has(event?.data?.taskId)) && uniqueTaskIds.add(event?.data?.taskId);
  }

  finalizeEventList(events: Timeline.CustomerEvent[]): Timeline.CustomerEvent[] {
    const uniqueTaskIds = new Set<string>();

    const shouldIncludeUndefinedOriginEvents = (event: Timeline.CustomerEvent) =>
      this.ignoreUndefinedOrigins ? !!event?.data?.origin : true;
    const shouldIncludeWxccEvents = (event: Timeline.CustomerEvent) =>
      this.hideWxccEvents ? !event.source.includes("com/cisco/wxcc") : true;
    const shouldIncludeAllWxccEvents = (event: Timeline.CustomerEvent) =>
      this.compactWxccEvents ? this.hasUniqueTaskId(event, uniqueTaskIds) : true;

    const filteredModifiedEvents = events
      ?.filter((event: Timeline.CustomerEvent) => {
        if (
          shouldIncludeUndefinedOriginEvents(event) &&
          shouldIncludeWxccEvents(event) &&
          shouldIncludeAllWxccEvents(event)
        ) {
          return event;
        }
      })
      .map((event: Timeline.CustomerEvent) => {
        const { wxccTitle, wxccSubTitle, wxccFilterTypes, wxccIconType } = this.parseWxccData(event);

        const title = event?.customUIData?.title || wxccTitle;
        const subTitle = event?.customUIData?.subTitle || wxccSubTitle;
        const iconType = event?.customUIData?.iconType || wxccIconType;
        const filterTypes = this.uniqueFilterTypes((event?.customUIData?.filterTypes || []).concat(wxccFilterTypes));

        event.renderingData = {
          title,
          subTitle,
          iconType,
          filterTypes,
        };

        return event;
      });

    return this.sortEventsbyDate(filteredModifiedEvents);
  }

  getExistingEvents(customer: string | null) {
    this.events = [];

    this.getEventsInProgress = true;
    this.baseUrlCheck();
    const encodedCustomer = this.encodeParameter(customer);
    const url = `${this.baseUrl}/v1/api/events/workspace-id/${this.projectId}?organizationId=${this.organizationId}&identity=${encodedCustomer}`;

    const config: AxiosRequestConfig = {
      method: "GET",
      url,
      headers: {
        Authorization: `Bearer ${this.bearerToken}`,
      },
    };

    const axiosInstance = axios.create(config);

    if (!this.hasHistoricalEventsAPIBeenCalled) {
      axiosRetry(axiosInstance, this.basicRetryConfig);
    }

    // FOLLOWING CODE IS TO MOCK TIMELINE EVENTS
    // this.getEventsInProgress = false;
    // this.events = this.finalizeEventList(mockedCustomUITimelineItems);
    // return this.events;

    return axiosInstance
      .get(url)
      .then((response: any) => {
        this.events = this.finalizeEventList(response?.data?.data);
      })
      .catch((err: Error) => {
        console.error(`[JDS Widget] Could not fetch Customer Journey events for customer (${customer})`, err);
        this.timelineErrorMessage = `Failure to fetch the journey for ${this.customer}.`;
      })
      .finally(() => {
        this.getEventsInProgress = false;
        if (!this.hasHistoricalEventsAPIBeenCalled) {
          this.hasHistoricalEventsAPIBeenCalled = true;
        }
      });
  }

  filterUniqueTaskIds = (events: Array<Timeline.CustomerEvent>) => {
    const set = new Set();
    const result = events.filter(o => (!o?.data?.taskId || !set.has(o?.data?.taskId)) && set.add(o?.data?.taskId));
    return result;
  };

  uniqueFilterTypes = (filterTypes: Array<string>) => {
    const set = new Set();
    const result = filterTypes.filter(type => (!type || !set.has(type)) && set.add(type));
    return result;
  };

  subscribeToEventStream(customer: string | null) {
    if (this.journeyEventSource) {
      this.journeyEventSource.close();
    }

    this.baseUrlCheck();
    if (this.bearerToken) {
      const header: EventSourceInitDict = {
        headers: {
          "content-type": "application/json; charset=UTF-8",
          accept: "application/json",
          Authorization: `Bearer ${this.bearerToken}`,
        },
      };

      const url = `${this.baseUrl}/v1/api/events/stream/workspace-id/${this.projectId}/identity/${customer}?organizationId=${this.organizationId}&bearerToken=${this.bearerToken}`;
      this.journeyEventSource = new EventSource(url, header);
    }

    if (this.journeyEventSource) {
      this.journeyEventSource.onopen = event => {
        console.log(
          `[JDS Widget] The Journey event stream connection has been established for customer \'${customer}\'.`
        );
      };

      this.journeyEventSource.onmessage = (event: ServerSentEvent) => {
        this.debugLogMessage("journeyEventSource onmessage", event);
        let data;

        try {
          data = JSON.parse(event.data);
          this.debugLogMessage("streaming journeyEventSource data", data);

          data.time = DateTime.fromISO(data.time);

          if (data.data && (data?.datacontenttype === "string" || data?.dataContentType === "string")) {
            data.data = JSON.parse(data.data);
          }
          this.newestEvents = this.finalizeEventList([data, ...this.newestEvents]);
        } catch (err) {
          console.error("[JDS Widget] journey/stream: No parsable data fetched");
        }
      };

      this.journeyEventSource!.onerror = error => {
        console.error(`[JDS Widget] There was an Journey EventSource error: `, error);
      };
    } else {
      console.error(`[JDS Widget] No Journey EventSource is active for ${customer}`);
    }
  }

  updateComprehensiveEventList() {
    this.events = this.finalizeEventList([...this.newestEvents, ...this.events]);
    this.newestEvents = [];
  }

  handleKeyDown(event: CustomEvent) {
    const { srcEvent } = event?.detail;
    if (srcEvent.key === "Enter") {
      const inputValue = event.composedPath()[0].value.trim();
      this.customer = inputValue;
    }

    this.handleBackspace(srcEvent);
  }

  async handleNewCustomer() {
    this.syncLoadingStatuses(true);

    this.aliasGetInProgress = true;
    this.debugLogMessage("customer", this.customer);
    this.newestEvents = [];
    this.getExistingEvents(this.customer || null);
    this.identityData = await this.getAliasesByAlias(this.customer || null);
    this.firstName = this.identityData?.firstName || "";
    this.lastName = this.identityData?.lastName || "";
    this.identityId = this.identityData?.id;
    this.debugLogMessage("identityId", this.identityId);

    this.subscribeToEventStream(this.customer || null);

    if (!this.templateId) {
      this.templateId = await this.getDefaultTemplateId();
    }

    this.getProfileView(this.identityId, this.templateId);
    this.subscribeToProfileViewStream(this.customer || null, this.templateId);
  }

  handleNamesUpdate(event: CustomEvent) {
    this.nameApiErrorMessage = "";
    const { firstName, lastName } = event?.detail;

    this.addFirstLastNameIdentity(this.identityId, firstName, lastName);
  }

  renderEvents() {
    return html`
      <cjaas-timeline
        ?getEventsInProgress=${this.getEventsInProgress}
        .historicEvents=${this.events}
        .newestEvents=${this.newestEvents}
        .eventIconTemplate=${this.eventIconTemplate}
        .badgeKeyword=${this.badgeKeyword}
        @new-event-queue-cleared=${this.updateComprehensiveEventList}
        limit=${this.limit}
        is-event-filter-visible
        ?live-stream=${!this.disableEventStream}
        ?enable-sub-text-links=${this.enableSubTextLinks}
        time-frame=${this.timeFrame}
        error-message=${this.timelineErrorMessage}
      ></cjaas-timeline>
    `;
  }

  renderLoader() {
    return html`
      <div class="spinner-container small">
        <md-spinner size="18"></md-spinner>
      </div>
    `;
  }

  renderEventList() {
    return html`
      <section class="sub-widget-section" id="events-list">
        ${this.renderEvents()}
      </section>
    `;
  }

  renderProfile() {
    return html`
      <section class="sub-widget-section">
        <cjaas-profile
          .customer=${this.customer || ""}
          .profileData=${this.profileData}
          ?getProfileDataInProgress=${this.getProfileDataInProgress}
          error-message=${this.profileErrorMessage}
          first-name=${this.firstName}
          last-name=${this.lastName}
          @edit-names=${this.handleNamesUpdate}
          ?names-loading=${this.aliasNamesUpdateInProgress}
          name-api-error-message=${this.nameApiErrorMessage}
        ></cjaas-profile>
      </section>
    `;
  }

  renderIdentity() {
    return html`
      <section class="sub-widget-section">
        <cjaas-identity
          .customer=${this.customer}
          .identityData=${this.identityData}
          .aliasObjects=${this.aliasObjects}
          .aliasDeleteInProgress=${this.aliasDeleteInProgress}
          ?aliasGetInProgress=${this.aliasGetInProgress}
          ?aliasAddInProgress=${this.aliasAddInProgress}
          error-message=${this.aliasErrorMessage}
          @delete-alias=${(ev: CustomEvent) => this.deleteAliasById(this.identityId, ev?.detail?.type, ev.detail.alias)}
          @add-alias=${(ev: CustomEvent) => this.addAliasById(this.identityId, ev?.detail?.type, ev?.detail?.alias)}
          .minimal=${true}
          ?read-only=${this.readOnlyAliases}
        ></cjaas-identity>
      </section>
    `;
  }

  private get classes() {
    return { expanded: this.expanded };
  }

  static get styles() {
    return styles;
  }

  addUnmappedAliasesToMap(identityData: IdentityData, identityObjects: Array<AliasObject>) {
    const { aliases } = identityData;
    const existingAliases = identityObjects.map(identityObject => identityObject.value);

    const oldAliases: Array<AliasObject> = [];
    if (identityData.aliases) {
      aliases.forEach((aliasValue: string) => {
        let uniqueAlias = true;
        existingAliases.forEach((existingValue: string) => {
          if (existingValue === aliasValue) {
            uniqueAlias = false;
            return;
          }
        });
        if (uniqueAlias) {
          oldAliases.push({ type: RawAliasTypes.Unknown, value: aliasValue });
        }
      });
    }
    return identityObjects.concat(oldAliases);
  }

  createAliasMap(identityData: IdentityData | undefined) {
    if (!identityData) {
      return;
    }
    const { customerId: customerIds, email: emails, phone: phoneNumbers, aliases } = identityData;
    const identityObjects: Array<AliasObject> = [];

    if (customerIds && customerIds.length) {
      customerIds.forEach((customerId: string) => {
        identityObjects.push({ type: RawAliasTypes.CustomerId, value: customerId });
      });
    }

    if (emails && emails.length) {
      emails.forEach((email: string) => {
        identityObjects.push({ type: RawAliasTypes.Email, value: email });
      });
    }

    if (phoneNumbers && phoneNumbers.length) {
      phoneNumbers.forEach((phone: string) => {
        identityObjects.push({ type: RawAliasTypes.Phone, value: phone });
      });
    }

    // this.aliasObjects = this.addUnmappedAliasesToMap(identityData, identityObjects);
    this.aliasObjects = identityObjects;
  }

  /**
   * Search for an Identity of an individual via Person Id. This will return one/more Identities.
   * The Provided aliases belong to one/more Persons.
   * This is where we gather the ID of the individual for future alias actions
   * @param personId
   * @returns Promise<IdentityData | undefined>
   */
  async getAliasesById(identityId: string | undefined): Promise<IdentityData | undefined> {
    const url = `${this.baseUrl}/admin/v1/api/person/workspace-id/${this.projectId}?personId=${identityId}&organizationId=${this.organizationId}`;

    const config: AxiosRequestConfig = {
      method: "GET",
      url,
      headers: {
        Authorization: `Bearer ${this.bearerToken}`,
        "Content-Type": "application/json",
      },
    };

    const axiosInstance = axios.create(config);

    if (!this.hasIdentityAPIBeenCalled) {
      axiosRetry(axiosInstance, this.basicRetryConfig);
    }

    return axiosInstance
      .get(url)
      .then((response: AxiosResponse<IdentityResponse>) => {
        const identityData = response?.data?.data?.length ? response?.data?.data[0] : undefined;
        this.aliasErrorMessage = "";
        return identityData;
      })
      .catch((err: Error) => {
        console.error("[JDS Widget] Failed to fetch Aliases by Alias ", err);
        this.aliasErrorMessage = `Failed to fetch aliases. Cannot execute any other actions.`;
        return undefined;
      })
      .finally(() => {
        this.aliasGetInProgress = false;
        if (!this.hasIdentityAPIBeenCalled) {
          this.hasIdentityAPIBeenCalled = true;
        }
      });
  }

  /**
   * Search for an Identity of an individual via aliases. This will return one/more Identities.
   * The Provided aliases belong to one/more Persons.
   * This is where we gather the ID of the individual for future alias actions
   * @param customer
   * @returns Promise<IdentityData | undefined>
   */
  async getAliasesByAlias(customer: string | null): Promise<IdentityData | undefined> {
    const url = `${this.baseUrl}/admin/v1/api/person/workspace-id/${this.projectId}/aliases/${customer}?organizationId=${this.organizationId}`;

    const config: AxiosRequestConfig = {
      method: "GET",
      url,
      headers: {
        Authorization: `Bearer ${this.bearerToken}`,
        "Content-Type": "application/json",
      },
    };

    const axiosInstance = axios.create(config);

    if (!this.hasIdentityAPIBeenCalled) {
      axiosRetry(axiosInstance, this.basicRetryConfig);
    }

    return axiosInstance
      .get(url)
      .then((response: AxiosResponse<IdentityResponse>) => {
        const identityData = response?.data?.data?.length ? response?.data?.data[0] : undefined;
        this.createAliasMap(identityData);

        this.aliasErrorMessage = "";
        return identityData;
      })
      .catch((err: Error) => {
        console.error("[JDS Widget] Failed to fetch Aliases by Alias ", err);
        this.aliasErrorMessage = `Failed to fetch aliases. Cannot execute any other actions.`;
        return undefined;
      })
      .finally(() => {
        this.aliasGetInProgress = false;
        if (!this.hasIdentityAPIBeenCalled) {
          this.hasIdentityAPIBeenCalled = true;
        }
      });
  }

  /**
   * Add one or more aliases to existing Individual
   * @param identityId
   * @param firstName
   * @param lastName
   * @returns void
   */
  addFirstLastNameIdentity(identityId: string | undefined, firstName: string, lastName: string) {
    this.aliasNamesUpdateInProgress = true;

    if (!firstName.trim() && !lastName.trim()) {
      this.aliasNamesUpdateInProgress = false;
      console.error("[JDS Widget] You cannot add empty values to first or last name.");
      return;
    }

    const requestBody = [
      {
        op: "replace",
        path: `/firstName`,
        value: firstName,
      },
      {
        op: "replace",
        path: `/lastName`,
        value: lastName,
      },
    ];

    return this.patchAliasChange(identityId, requestBody)
      .then((response: any) => {
        this.firstName = response?.data?.data?.firstName;
        this.lastName = response?.data?.data?.lastName;
        this.nameApiErrorMessage = "";
      })
      .catch(err => {
        this.nameApiErrorMessage = `Failed to edit the name successfully`;
        console.error(`[JDS Widget] Failed to edit Identity Names ${identityId}`, err?.response);
      })
      .finally(() => {
        this.aliasNamesUpdateInProgress = false;
      });
  }

  /**
   * Add one or more aliases to existing Individual
   * @param customer
   * @param alias
   * @returns void
   */
  async patchAliasChange(identityId: string | undefined, requestBody: Array<jsonPatchOperation>) {
    const url = `${this.baseUrl}/admin/v1/api/person/workspace-id/${this.projectId}/person-id/${identityId}?organizationId=${this.organizationId}`;

    const config: AxiosRequestConfig = {
      method: "PATCH",
      data: JSON.stringify(requestBody),
      headers: {
        Authorization: `Bearer ${this.bearerToken}`,
        "Content-Type": "application/json-patch+json",
      },
    };

    return axios(url, config);
  }

  async generatePatchIndex(
    operation: PatchOperations,
    identityId: string | undefined,
    aliasType: IdentityAliasTypes,
    alias: string
  ) {
    const identity = await this.getAliasesById(identityId);
    if (!identity) {
      return null;
    }
    const arrayOfAliasesByType: Array<string> = identity[aliasType];

    switch (operation) {
      case PatchOperations.Add:
        return arrayOfAliasesByType?.length || 0;
      case PatchOperations.Remove:
        const index = arrayOfAliasesByType.indexOf(alias);
        return index;
      case PatchOperations.Replace:
        return arrayOfAliasesByType.indexOf(alias);
        break;
      default:
    }
  }

  /**
   * Add one or more aliases to existing Individual
   * @param customer
   * @param alias
   * @returns void
   */
  async addAliasById(identityId: string | undefined, aliasType: IdentityAliasTypes, alias: string) {
    this.aliasAddInProgress = true;

    const trimmedAlias = alias.trim();
    if (!trimmedAlias) {
      this.aliasAddInProgress = false;
      console.error("[JDS Widget] You cannot add an empty value as a new alias");
      return;
    }

    const index = await this.generatePatchIndex(PatchOperations.Add, identityId, aliasType, alias);

    const requestBody = [
      {
        op: "add",
        path: `/${aliasType}/${index}`,
        value: trimmedAlias,
      },
    ];

    return this.patchAliasChange(identityId, requestBody)
      .then((response: AxiosResponse<any>) => {
        const responseData = response.data?.data as IdentityData;

        if (this.identityData) {
          this.identityData.aliases = responseData?.aliases;
          this.identityData = responseData;
          this.createAliasMap(this.identityData);
          this.requestUpdate();
        }
        this.aliasErrorMessage = "";
      })
      .catch(err => {
        console.error(`[JDS Widget] Failed to add AliasById ${identityId}`, err?.response);

        let subErrorMessage = "";

        if (err?.response?.data?.status === "BAD_REQUEST") {
          const doesAliasAlreadyExists = err?.response.data.errors.find((error: string) =>
            error.includes("Alias to be added already exists to some other Person")
          );

          if (doesAliasAlreadyExists) {
            subErrorMessage = `This alias already exists for some other person.`;
          }
        }

        if (err?.response?.data?.status === 409) {
          subErrorMessage = "This alias is a duplicate.";
        }
        this.aliasErrorMessage = `Failed to add alias(es) ${alias}. ${subErrorMessage}`;
      })
      .finally(() => {
        this.aliasAddInProgress = false;
      });
  }

  hasPlusSign(alias: string): boolean {
    const hasPlusSign = alias.trim().charAt(0) === "+";
    return hasPlusSign;
  }

  async deleteAliasById(identityId: string | undefined, aliasType: IdentityAliasTypes, alias: string) {
    this.setInlineAliasLoader(alias, true);
    const hasPlusSign = this.hasPlusSign(alias);
    let aliasToDelete = alias;
    if (aliasType === IdentityAliasTypes.Phone || hasPlusSign) {
      aliasToDelete = this.encodeParameter(alias) || aliasToDelete;
    }

    const trimmedAlias = alias.trim();
    if (!trimmedAlias) {
      this.setInlineAliasLoader(alias, false);
      console.error("[JDS Widget] You cannot add an empty value as a new alias");
      return;
    }

    const index = await this.generatePatchIndex(PatchOperations.Remove, identityId, aliasType, alias);

    const requestBody = [
      {
        op: "remove",
        path: `/${aliasType}/${index}`,
        value: trimmedAlias,
      },
    ];

    return this.patchAliasChange(identityId, requestBody)
      .then((response: any) => {
        const responseData = response.data?.data as IdentityData;
        if (this.identityData) {
          this.identityData = responseData;
          this.createAliasMap(this.identityData);
          this.requestUpdate();
        }
        this.aliasErrorMessage = "";
      })
      .catch((err: Error) => {
        console.error(`[JDS Widget] Failed to delete AliasById: (${identityId})`, alias, err);
        this.aliasErrorMessage = `Failed to delete alias ${alias}.`;
      })
      .finally(() => {
        this.setInlineAliasLoader(alias, false);
      });
  }

  setInlineAliasLoader(alias: string, state: boolean) {
    const duplicate = Object.assign({}, this.aliasDeleteInProgress);
    duplicate[alias] = state;
    this.aliasDeleteInProgress = duplicate;
  }

  handleBackspace(event: KeyboardEvent) {
    if (event?.key === "Backspace") {
      event.stopPropagation();
    }
  }

  syncLoadingStatuses(status: boolean = true) {
    this.getProfileDataInProgress = status;
    this.aliasGetInProgress = status;
    this.getEventsInProgress = status;
  }

  refreshUserSearch() {
    const inputValue = this.customerInput.value.trim();
    if (this.customer === inputValue) {
      this.handleNewCustomer();
    } else {
      this.syncLoadingStatuses();
      this.customer = inputValue;
    }
  }

  renderMainInputSearch() {
    return html`
      <div class="flex-inline">
        <span class="custom-input-label">Lookup User</span>
        <div class="input-wrapper">
          <md-input
            searchable
            class="customer-journey-search-input"
            id="customer-input"
            value=${this.customer || ""}
            shape="pill"
            @input-keydown=${(event: CustomEvent) => this.handleKeyDown(event)}
          >
          </md-input>
          <div class="reload-icon">
            <md-tooltip message="Reload Widget">
              <md-button circle @click=${this.refreshUserSearch}>
                <md-icon name="icon-refresh_12"></md-icon>
              </md-button>
            </md-tooltip>
          </div>
        </div>
      </div>
    `;
  }

  renderEmptyStateView() {
    return html`
      <div class="empty-state-container">
        <!-- <img src="./assets/images/flashlight-search-192.svg" alt="search-illustration" /> -->
        <!-- TODO: Add Illustrations to empty state view -->
        <p class="empty-state-text">Enter a user to search for a Journey</p>
      </div>
    `;
  }

  renderSubWidgets() {
    const tooltipMessage = `Aliases are alternate ways to identify a customer. Adding aliases can help you form a more complete profile of your customer.`;

    return html`
      <div class="sub-widget-flex-container${classMap(this.classes)}">
        <div class="column left-column">
          <details class="sub-widget-detail-container" ?open=${!this.collapseProfileSection}>
            <summary
              ><span class="sub-widget-header">Profile</span><md-icon name="icon-arrow-up_12"></md-icon>
            </summary>
            ${this.renderProfile()}
          </details>
          <details class="grid-identity sub-widget-detail-container" ?open=${!this.collapseAliasSection}>
            <summary>
              <span class="sub-widget-header">Aliases</span>
              <md-tooltip class="alias-info-tooltip" .message=${tooltipMessage}>
                <md-icon name="info_14"></md-icon>
              </md-tooltip>
              <md-icon class="alias-expand-icon" name="icon-arrow-up_12"></md-icon>
            </summary>
            ${this.renderIdentity()}
          </details>
        </div>
        <div class="column right-column">
          <details class="grid-timeline sub-widget-detail-container" ?open=${!this.collapseTimelineSection}>
            <summary>
              <span class="sub-widget-header">Journey</span>
              <md-icon name="icon-arrow-up_12"></md-icon>
            </summary>
            <div class="container">
              ${this.renderEventList()}
            </div>
          </details>
        </div>
      </div>
    `;
  }

  renderFunctionalWidget() {
    return html`
      <div class="customer-journey-widget-container">
        <div class="top-header-row">
          ${this.disableUserSearch ? nothing : this.renderMainInputSearch()}
        </div>
        ${this.customer ? this.renderSubWidgets() : this.renderEmptyStateView()}
      </div>
    `;
  }

  render() {
    return this.renderFunctionalWidget();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "customer-journey-widget": CustomerJourneyWidget;
  }
}
