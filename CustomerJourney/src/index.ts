/**
 * Copyright (c) Cisco Systems, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { html, internalProperty, property, LitElement, PropertyValues, query } from "lit-element";
import { customElementWithCheck } from "./mixins/CustomElementCheck";
import axiosRetry from "axios-retry";
import styles from "./assets/styles/View.scss";
import * as iconData from "@/assets/defaultIcons-v10.json";
import { EventSourceInitDict } from "eventsource";
import "@cjaas/common-components/dist/comp/cjaas-timeline-v2.js";
import "@cjaas/common-components/dist/comp/cjass-profile-v2.js";
import { TimelineV2 } from "@cjaas/common-components";
import { DateTime } from "luxon";
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
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

export enum EventType {
  Agent = "agent",
  Task = "task",
}

export interface ProfileDataPoint {
  displayName: string;
  value: string;
}

export enum TimeRangeOption {
  "AllTime" = "All Time",
  "Last10Days" = "Last 10 Days",
  "Last30Days" = "Last 30 Days",
  "Last6Months" = "Last 6 Months",
  "Last12Months" = "Last 12 Months",
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
  @property({ attribute: false }) eventIconTemplate: TimelineV2.TimelineCustomizations = iconData;

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
   * @attr default-time-range-option
   * Determine default time range on start
   */
  @property({ type: String, attribute: "default-time-range-option" })
  defaultTimeRangeOption: TimeRangeOption = TimeRangeOption.AllTime;

  /**
   * Toggle to either queue or immediately load new events occurring in the stream
   * @prop disable-event-stream
   */
  @property({ type: Boolean, attribute: "disable-event-stream" }) disableEventStream = false;
  /**
   * Toggle whether or not to ignore undefined origin timeline events
   * @prop ignoreUndefinedOrigins
   */
  @property({ type: Boolean, attribute: "ignore-undefined-origins" }) ignoreUndefinedOrigins = false;
  /**
   * @prop profileDataPoints
   * The profile Data Points provided from the template fetch, populated in the table view
   */
  @property({ attribute: false }) profileDataPoints: Array<ProfileDataPoint> = [];
  /**
   * Timeline data fetched from journey history
   * @prop events
   */
  @internalProperty() events: Array<TimelineV2.CustomerEvent> = [];
  /**
   * Queue array of incoming events via Stream
   * @prop newestEvents
   */
  @internalProperty() newestEvents: Array<TimelineV2.CustomerEvent> = [];
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
   * Internal store for profile error tracking Id
   * @prop profileErrorTrackingId
   */
  @internalProperty() profileErrorTrackingId = "";

  /**
   * Internal store for profile name error messages
   * @prop profileNameErrorMessage
   */
  @internalProperty() nameApiErrorMessage = "";

  @internalProperty() nameApiErrorTrackingId = "";

  /**
   * Internal store for timeline error messages
   * @prop timelineErrorMessage
   */
  @internalProperty() timelineErrorMessage = "";

  @internalProperty() timelineErrorTrackingId = "";

  @internalProperty() isEntireWidgetErroring = false;

  @internalProperty() entireWidgetErrorTrackingId = "";

  @internalProperty() entireWidgetLoading = false;

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

  @internalProperty() profileDataPointCount = 0;

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
    this.entireWidgetLoading = true;
  }

  async update(changedProperties: PropertyValues) {
    super.update(changedProperties);

    if (changedProperties.has("iconDataPath") && this.iconDataPath) {
      this.loadJSON(
        this.iconDataPath,
        (iconDataJson: TimelineV2.TimelineCustomizations) => {
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
      if (this.customer) {
        this.handleNewCustomer(this.customer, this.templateId);
      } else {
        console.error("[JDS WIDGET] customer is undefined", this.customer);
      }
    }
  }

  debugLogMessage(infoMessage: string, ...args: any[]) {
    if (this.logsOn) {
      console.log(`[JDS WIDGET][LOGS-ON] ${infoMessage}`, args);
    }
  }

  //   getQueueNameOfLatestEvent(event: TimelineV2.CustomerEvent) {
  //     const { createdTime, queueId } = event?.data;

  //     const fromDateMS = createdTime;
  //     const toDateMS = createdTime + 86400000;
  //     const queueIds = queueId;

  //     const url = `https://api.qaus1.ciscoccservice.com/v1/queues/statistics?from=${fromDateMS}&to=${toDateMS}&interval=15&queueIds=${queueIds}&orgId=${this.organizationId}`;

  //     const config: AxiosRequestConfig = {
  //       method: "GET",
  //       url,
  //       headers: {
  //         Authorization: `Bearer ${this.bearerToken}`,
  //       },
  //     };

  //     const axiosInstance = axios.create(config);

  //     return axiosInstance
  //       .get(url)
  //       .then(response => {
  //         const queueName = response?.data?.data?.[0]?.queueName;
  //         return queueName;
  //       })
  //       .catch((err: AxiosError) => {
  //         console.error(`[JDS Widget] getQueueNameOfLatestEvent`, err);
  //       });
  //   }

  sortEventsByDate(events: TimelineV2.CustomerEvent[]) {
    events?.sort((previous, current) => {
      if (previous.time > current.time) {
        return -1;
      } else if (previous.time < current.time) {
        return 1;
      } else {
        return 0;
      }
    });

    this.debugLogMessage("Sorted events", events);
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
      .catch((err: AxiosError) => {
        console.error(`[JDS Widget] Unable to fetch the ID of the journey-default-template`, err);
        return undefined;
      });
  }

  async subscribeToProfileViewStreamByTemplateName(customer: string | null, templateName: string | undefined) {
    if (!customer || !templateName) {
      console.error(`[JDS WIDGET] Failed to stream progressive profile view. Need customer & templateName provided.`);
    }

    const url = `${this.baseUrl}/v1/api/progressive-profile-view/stream/workspace-id/${this.projectId}/identity/${customer}/template-name/${templateName}?organizationId=${this.organizationId}&bearerToken=${this.bearerToken}`;
    return this.subscribeToProfileViewStream(url);
  }

  async subscribeToProfileViewStreamByTemplateId(customer: string | null, templateId: string | undefined) {
    const profileTemplateId = !templateId ? await this.getDefaultTemplateId() : templateId;

    const url = `${this.baseUrl}/v1/api/progressive-profile-view/stream/workspace-id/${this.projectId}/identity/${customer}/template-id/${profileTemplateId}?organizationId=${this.organizationId}&bearerToken=${this.bearerToken}`;
    return this.subscribeToProfileViewStream(url);
  }

  collectProfileDataPoints(profileData: any) {
    if (profileData) {
      const profileDataPoints: Array<ProfileDataPoint> = profileData
        ?.filter((x: any) => x?.query?.widgetAttributes?.type === "table")
        .map((x: any) => {
          const { displayName } = x?.query;
          const value = x.result;
          return {
            displayName,
            value,
          };
        });

      this.profileDataPointCount = profileDataPoints?.length;
      this.debugLogMessage("ProfileData", profileData);
      this.debugLogMessage("Profile data points", profileDataPoints);

      return profileDataPoints;
    } else {
      this.profileDataPointCount = 0;
      return [];
    }
  }

  async subscribeToProfileViewStream(requestUrl: string) {
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

      this.profileEventSource = new EventSource(requestUrl, header);
    }

    if (this.profileEventSource) {
      this.profileEventSource.onopen = event => {
        console.log(
          `[JDS Widget] The ProfileView stream connection has been established for customer \'${this.customer}\'.`
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
          this.profileDataPoints = this.parseProfileResponse(attributes, personId);
        } catch (err) {
          console.error("[JDS Widget] profile/stream: No parsable data fetched");
          this.profileErrorMessage = "Failed to get the latest profile data";
        }
      };

      this.journeyEventSource!.onerror = error => {
        console.error(`[JDS Widget] There was an Profile EventSource error: `, error);
      };
    } else {
      console.error(`[JDS Widget] No Profile EventSource is active for ${this.customer}`);
    }
  }

  //   async getProfileViewByTemplateName(customer: string | null, templateName: string | undefined) {
  //     if (!customer || !templateName) {
  //       console.error(`[JDS WIDGET] Failed to get progressive profile view. Need customer & templateName provided.`);
  //     }

  //     this.profileData = undefined;
  //     this.getProfileDataInProgress = true;

  //     const url = `${this.baseUrl}/v1/api/progressive-profile-view/workspace-id/${this.projectId}/identity/${customer}/template-name/${templateName}`;
  //     return this.handleProfileViewResponse(url, templateName);
  //   }

  async getProfileViewByTemplateId(customer: string | null, templateId: string | undefined) {
    const profileTemplateId = !templateId ? await this.getDefaultTemplateId() : templateId;

    this.profileDataPoints = [];
    this.getProfileDataInProgress = true;

    const url = `${this.baseUrl}/v1/api/progressive-profile-view/workspace-id/${this.projectId}/identity/${customer}/template-id/${profileTemplateId}`;

    return this.handleProfileViewResponse(url, templateId);
  }

  async handleProfileViewResponse(requestUrl: string, templateReference: string | undefined) {
    const config: AxiosRequestConfig = {
      method: "GET",
      url: requestUrl,
      headers: {
        Authorization: `Bearer ${this.bearerToken}`,
      },
    };

    const axiosInstance = axios.create(config);

    if (!this.hasProfileAPIBeenCalled) {
      axiosRetry(axiosInstance, this.basicRetryConfig);
    }

    return axiosInstance
      .get(requestUrl)
      .then(response => {
        const { attributes, personId } = response?.data?.data[0];
        this.profileErrorMessage = "";
        this.profileDataPoints = this.parseProfileResponse(attributes, personId);
        return this.profileDataPoints;
      })
      .catch((err: AxiosError) => {
        this.profileDataPoints = [];
        this.profileErrorMessage = `Failed to fetch profile data.`;

        if (err?.response?.data?.trackingId) {
          this.profileErrorTrackingId = err?.response?.data?.trackingId;
        }

        console.error(
          `[JDS Widget] Unable to fetch the Profile for customer (${this.customer}) with template (${templateReference})`,
          err
        );

        return undefined;
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
    return this.collectProfileDataPoints(profileTablePayload);
  }

  filterEventTypes(typePrefix: EventType, events: Array<TimelineV2.CustomerEvent>) {
    const filteredEvents = events.filter((event: TimelineV2.CustomerEvent) => event.type.includes(`${typePrefix}:`));
    return filteredEvents;
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

    return axiosInstance
      .get(url)
      .then(async (response: any) => {
        const myEvents = response?.data?.data?.map((event: any) => {
          event.time = DateTime.fromISO(event.time);
          return event;
        });
        const filteredEvents = this.filterOutUndefinedOrigins(myEvents);
        this.events = this.sortEventsByDate(filteredEvents);

        // const queueName = await this.getQueueNameOfLatestEvent(this.events[0]);
        // console.log("queueName", queueName);
        // this.events[0].data.queueName = queueName;

        this.timelineErrorMessage = "";
        this.timelineErrorTrackingId = "";
        return this.events;
      })
      .catch((err: AxiosError) => {
        console.error(`[JDS Widget] Could not fetch Customer Journey events for customer (${customer})`, err?.response);
        this.timelineErrorMessage = `Failure to fetch the journey for ${customer}.`;
        if (err?.response?.data?.trackingId) {
          this.timelineErrorTrackingId = err?.response?.data?.trackingId;
        }
        return undefined;
      })
      .finally(() => {
        this.getEventsInProgress = false;
        if (!this.hasHistoricalEventsAPIBeenCalled) {
          this.hasHistoricalEventsAPIBeenCalled = true;
        }
      });
  }

  filterOutUndefinedOrigins(events: Array<any>) {
    if (this.ignoreUndefinedOrigins) {
      return events.filter((event: any) => event?.data?.origin !== undefined);
    } else {
      return events;
    }
  }

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
          this.newestEvents = this.sortEventsByDate([data, ...this.newestEvents]);
          this.newestEvents = this.filterOutUndefinedOrigins(this.newestEvents);
        } catch (err) {
          console.error("[JDS Widget] journey/stream: No parsable data fetched", err);
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
    this.events = this.sortEventsByDate([...this.newestEvents, ...this.events]);
    this.events = this.filterOutUndefinedOrigins(this.events);
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

  async callTimelineAPIs(customer: string | null) {
    this.newestEvents = [];
    this.getExistingEvents(customer || null);
    this.subscribeToEventStream(customer || null);
  }

  //   async callAliasAPIs(customer: string | null) {
  //     this.aliasGetInProgress = true;
  //     this.identityData = await this.getIdentityDataByAlias(customer || null);
  //     this.firstName = this.identityData?.firstName || "";
  //     this.lastName = this.identityData?.lastName || "";
  //     this.identityId = this.identityData?.id;
  //     this.debugLogMessage("identityId", this.identityId);
  //   }

  async loadNonStreamAPIs(customer: string, templateId: string | undefined) {
    this.isEntireWidgetErroring = false;
    this.entireWidgetErrorTrackingId = "";
    this.entireWidgetLoading = true;
    this.newestEvents = [];

    let apiResponses;
    apiResponses = await Promise.all([
      this.getExistingEvents(customer),
      this.getFirstLastNameIdentity(customer),
      this.getProfileViewByTemplateId(customer, templateId),
    ]);

    const didAllFail = apiResponses.every(apiResponse => !apiResponse);

    this.isEntireWidgetErroring = didAllFail;
    this.entireWidgetErrorTrackingId = didAllFail ? this.timelineErrorTrackingId : "";
    this.entireWidgetLoading = false;

    return apiResponses;
  }

  async handleNewCustomer(customer: string, templateId: string | undefined) {
    this.debugLogMessage("customer", customer);

    await this.loadNonStreamAPIs(customer, templateId);

    this.subscribeToEventStream(customer || null);
    this.subscribeToProfileViewStreamByTemplateId(customer, templateId);
  }

  handleNamesUpdate(event: CustomEvent) {
    this.nameApiErrorMessage = "";
    this.nameApiErrorTrackingId = "";
    const { firstName, lastName } = event?.detail;

    this.addFirstLastNameIdentity(this.identityId, firstName, lastName);
  }

  handleWidgetTryAgain() {
    if (this.customer) {
      this.handleNewCustomer(this.customer, this.templateId);
    }
  }

  async handleProfileTryAgain() {
    this.getProfileDataInProgress = true;
    this.profileErrorMessage = "";

    await this.getFirstLastNameIdentity(this.customer);
    this.getProfileViewByTemplateId(this.customer, this.templateId);
    this.subscribeToProfileViewStreamByTemplateId(this.customer, this.templateId);
  }

  handleNameTryAgain() {
    this.nameApiErrorMessage = "";
    this.nameApiErrorTrackingId = "";
    this.getFirstLastNameIdentity(this.customer);
  }

  handleTimelineTryAgain() {
    this.timelineErrorMessage = "";
    this.timelineErrorTrackingId = "";
    this.getExistingEvents(this.customer);
    this.subscribeToEventStream(this.customer);
  }

  renderEvents() {
    return html`
      <cjaas-timeline-v2
        ?getEventsInProgress=${this.getEventsInProgress}
        .historicEvents=${this.events}
        .newestEvents=${this.newestEvents}
        .eventIconTemplate=${this.eventIconTemplate}
        .badgeKeyword=${this.badgeKeyword}
        @new-event-queue-cleared=${this.updateComprehensiveEventList}
        limit=${this.limit}
        is-event-filter-visible
        ?live-stream=${!this.disableEventStream}
        time-range-option=${this.defaultTimeRangeOption}
        error-message=${this.timelineErrorMessage}
        error-tracking-id=${this.timelineErrorTrackingId}
        @timeline-error-try-again=${this.handleTimelineTryAgain}
      ></cjaas-timeline-v2>
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
      <section class="sub-widget-section events-list">
        ${this.renderEvents()}
      </section>
    `;
  }

  renderProfile() {
    return html`
      <section class="sub-widget-section profile-view">
        <cjaas-profile-v2
          .customer=${this.customer || ""}
          .profileDataPoints=${this.profileDataPoints}
          ?getProfileDataInProgress=${this.getProfileDataInProgress}
          error-message=${this.profileErrorMessage}
          first-name=${this.firstName}
          last-name=${this.lastName}
          @edit-names=${this.handleNamesUpdate}
          @profile-error-try-again=${this.handleProfileTryAgain}
          @name-error-try-again=${this.handleNameTryAgain}
          ?names-loading=${this.aliasNamesUpdateInProgress}
          name-api-error-message=${this.nameApiErrorMessage}
          profile-error-tracking-id=${this.profileErrorTrackingId}
          name-error-tracking-id=${this.nameApiErrorTrackingId}
        ></cjaas-profile-v2>
      </section>
    `;
  }

  //   renderIdentity() {
  //     return html`
  //       <section class="sub-widget-section">
  //         <cjaas-identity
  //           .customer=${this.customer}
  //           .identityData=${this.identityData}
  //           .aliasObjects=${this.aliasObjects}
  //           .aliasDeleteInProgress=${this.aliasDeleteInProgress}
  //           ?aliasGetInProgress=${this.aliasGetInProgress}
  //           ?aliasAddInProgress=${this.aliasAddInProgress}
  //           error-message=${this.aliasErrorMessage}
  //           @delete-alias=${(ev: CustomEvent) => this.deleteAliasById(this.identityId, ev?.detail?.type, ev.detail.alias)}
  //           @add-alias=${(ev: CustomEvent) => this.addAliasById(this.identityId, ev?.detail?.type, ev?.detail?.alias)}
  //           .minimal=${true}
  //           ?read-only=${this.readOnlyAliases}
  //         ></cjaas-identity>
  //       </section>
  //     `;
  //   }

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
   * Search for an Identity of an individual via aliases. This will return one/more Identities.
   * The Provided aliases belong to one/more Persons.
   * This is where we gather the ID of the individual for future alias actions
   * @param customer
   * @returns Promise<IdentityData | undefined>
   */
  async getIdentityDataByAlias(customer: string | null): Promise<IdentityData | undefined> {
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

    return axiosInstance.get(url).then((response: AxiosResponse<IdentityResponse>) => {
      const identityData = response?.data?.data?.length ? response?.data?.data[0] : undefined;
      return identityData;
    });
  }

  getAliasesByAlias(identityData: any) {
    this.createAliasMap(identityData);
    this.requestUpdate();
  }

  async getFirstLastNameIdentity(customer: string | null) {
    this.aliasNamesUpdateInProgress = true;

    return this.getIdentityDataByAlias(customer)
      .then((identityData: IdentityData | undefined) => {
        this.nameApiErrorMessage = "";
        this.nameApiErrorTrackingId = "";

        this.firstName = identityData?.firstName || "";
        this.lastName = identityData?.lastName || "";
        this.identityId = identityData?.id;

        return { firstName: this.firstName, lastName: this.lastName, identityId: this.identityId };
      })
      .catch((err: AxiosError) => {
        console.error(`[JDS Widget] Failed to fetch first and last name by Alias: [${customer}]`, err);
        this.nameApiErrorMessage = "Failed to fetch name";
        if (err?.response?.data?.trackingId) {
          this.nameApiErrorTrackingId = err?.response?.data?.trackingId;
        }
        return undefined;
      })
      .finally(() => {
        this.aliasGetInProgress = false;
        this.aliasNamesUpdateInProgress = false;

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
        return { firstName: this.firstName, lastName: this.lastName };
      })
      .catch((err: AxiosError) => {
        this.nameApiErrorMessage = `Failed to edit the name successfully`;
        console.error(`[JDS Widget] Failed to edit Identity Names ${identityId}`, err?.response);
        return undefined;
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

  hasPlusSign(alias: string): boolean {
    const hasPlusSign = alias.trim().charAt(0) === "+";
    return hasPlusSign;
  }

  //   async deleteAliasById(identityId: string | undefined, aliasType: IdentityAliasTypes, alias: string) {
  //     this.setInlineAliasLoader(alias, true);
  //     const hasPlusSign = this.hasPlusSign(alias);
  //     let aliasToDelete = alias;
  //     if (aliasType === IdentityAliasTypes.Phone || hasPlusSign) {
  //       aliasToDelete = this.encodeParameter(alias) || aliasToDelete;
  //     }

  //     const trimmedAlias = alias.trim();
  //     if (!trimmedAlias) {
  //       this.setInlineAliasLoader(alias, false);
  //       console.error("[JDS Widget] You cannot add an empty value as a new alias");
  //       return;
  //     }

  //     const index = await this.generatePatchIndex(PatchOperations.Remove, aliasType, alias);

  //     const requestBody = [
  //       {
  //         op: "remove",
  //         path: `/${aliasType}/${index}`,
  //         value: trimmedAlias,
  //       },
  //     ];

  //     return this.patchAliasChange(identityId, requestBody)
  //       .then((response: any) => {
  //         const responseData = response.data?.data as IdentityData;
  //         if (this.identityData) {
  //           this.identityData = responseData;
  //           this.createAliasMap(this.identityData);
  //           this.requestUpdate();
  //         }
  //         this.aliasErrorMessage = "";
  //       })
  //       .catch((err: AxiosError) => {
  //         console.error(`[JDS Widget] Failed to delete AliasById: (${identityId})`, alias, err);
  //         this.aliasErrorMessage = `Failed to delete alias ${alias}.`;
  //         return err?.response?.data;
  //       })
  //       .finally(() => {
  //         this.setInlineAliasLoader(alias, false);
  //       });
  //   }

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

  //   refreshUserSearch() {
  //     const inputValue = this.customerInput.value.trim();
  //     if (this.customer === inputValue) {
  //       this.handleNewCustomer(this.customer, this.templateId);
  //     } else {
  //       this.syncLoadingStatuses();
  //       this.customer = inputValue;
  //     }
  //   }

  //   renderMainInputSearch() {
  //     return html`
  //       <div class="flex-inline">
  //         <span class="custom-input-label">Lookup User</span>
  //         <div class="input-wrapper">
  //           <md-input
  //             searchable
  //             class="customer-journey-search-input"
  //             id="customer-input"
  //             value=${this.customer || ""}
  //             shape="pill"
  //             @input-keydown=${(event: CustomEvent) => this.handleKeyDown(event)}
  //           >
  //           </md-input>
  //           <div class="reload-icon">
  //             <md-tooltip message="Reload Widget">
  //               <md-button circle @click=${this.refreshUserSearch}>
  //                 <md-icon name="icon-refresh_12"></md-icon>
  //               </md-button>
  //             </md-tooltip>
  //           </div>
  //         </div>
  //       </div>
  //     `;
  //   }

  renderEmptyStateView() {
    return html`
      <div class="empty-state-container">
        <p class="empty-state-text">Enter a user to search for a Journey</p>
      </div>
    `;
  }

  renderSubWidgets() {
    return html`
      <div
        class=${`sub-widget-container ${
          this.profileDataPointCount > 3 ? "flex-direction-row" : "flex-direction-column"
        }`}
      >
        ${this.renderProfile()} ${this.renderEventList()}
      </div>
    `;
  }

  renderFunctionalWidget() {
    if (this.isEntireWidgetErroring) {
      return html`
        <div class="customer-journey-widget-container">
          <cjaas-error-notification
            title="Failed to load data"
            tracking-id=${this.entireWidgetErrorTrackingId}
            @error-try-again=${this.handleWidgetTryAgain}
          ></cjaas-error-notification>
        </div>
      `;
    } else if (this.entireWidgetLoading) {
      return html`
        <div class="customer-journey-widget-container">
          <div class="widget-loading-wrapper">
            <md-spinner size="56"></md-spinner>
            <p class="loading-text">Loading...</p>
          </div>
        </div>
      `;
    } else {
      return html`
        <div class="customer-journey-widget-container populated-data">
          ${this.customer ? this.renderSubWidgets() : this.renderEmptyStateView()}
        </div>
      `;
    }
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
