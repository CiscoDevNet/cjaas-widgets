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
import * as iconData from "@/assets/default-icon-color-map.json";
import { EventSourceInitDict } from "eventsource";
import "@/components/timeline-v2/TimelineV2";
import "@/components/profile-v2/ProfileV2";
import "@/components/error-notification/ErrorNotification";
import { TimelineV2 } from "@/components/timeline-v2/TimelineV2";

import { DateTime } from "luxon";
import { v4 as uuidv4 } from "uuid";
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import { Desktop } from "@wxcc-desktop/sdk";
import { ifDefined } from "lit-html/directives/if-defined";
// @ts-ignore
import { version } from "../version";
import { ServerSentEvent, IdentityData, IdentityResponse, AliasObject, jsonPatchOperation } from "./types/cjaas";
import _ from "lodash";
import { nothing } from "lit-html";
import Backend from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";

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

export interface CustomUIDataPayload {
  title?: string;
  subTitle?: string;
  iconType?: string;
  channelTypeTag?: string;
  eventSource?: string;
  filterTags?: string | Array<string>;
}

export interface RenderingDataObject {
  title?: string;
  subTitle?: string;
  iconType?: string;
  channelTypeTag?: string;
  eventSource?: string;
  isActive?: boolean;
  filterTags?: Array<string>;
}

export interface CustomerEvent {
  specversion: string;
  type: string;
  source: string;
  id: string;
  time: string;
  identity: string;
  identitytype: "email" | "phone" | "customerId";
  previousidentity?: null;
  datacontenttype: string;
  person?: string;
  data: Record<string, any>;
  renderingData?: RenderingDataObject;
}

export const DEFAULT_CHANNEL_OPTION = "all channels";

export const JDS_DIVISION_CAD_VARIABLE = "JDSDivision";
export const JDS_DEFAULT_FILTER_CAD_VARIABLE = "JDSDefaultFilter";

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
  //   /**
  //    * Path to the proper Customer Journey API deployment
  //    * @attr base-url
  //    */
  //   @property({ type: Boolean, attribute: "read-only-aliases" }) readOnlyAliases = false;

  /**
   * enable user search
   */
  @property({ type: Boolean, attribute: "enable-user-search" }) enableUserSearch = false;
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
  //   /**
  //    * @prop collapse-timeline-section
  //    * determines whether the timeline section is collapsed by default
  //    */
  //   @property({ type: Boolean, attribute: "collapse-timeline-section" }) collapseTimelineSection = false;
  //   /**
  //    * @prop collapse-profile-section
  //    * determines whether the profile section is collapsed by default
  //    */
  //   @property({ type: Boolean, attribute: "collapse-profile-section" }) collapseProfileSection = false;
  //   /**
  //    * @prop collapse-alias-section
  //    * determines whether the alias section is collapsed by default
  //    */
  //   @property({ type: Boolean, attribute: "collapse-alias-section" }) collapseAliasSection = false;
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
   * @prop profileDataPoints
   * The profile Data Points provided from the template fetch, populated in the table view
   */
  @property({ attribute: false }) profileDataPoints: Array<ProfileDataPoint> = [];
  /**
   * @prop showAliasIcon
   * Feature Flag to have the Alias Icon and Modal visible
   */
  @property({ type: Boolean, attribute: "show-alias-icon" }) showAliasIcon = false;
  /**
  /**
   * Timeline data fetched from journey history
   * @prop events
   */
  @internalProperty() events: Array<CustomerEvent> = [];
  /**
   * Queue array of incoming events via Stream
   * @prop newestEvents
   */
  @internalProperty() newestEvents: Array<CustomerEvent> = [];
  /**
   * Most recent event with task:ended type
   * @prop mostRecentEvent
   */
  @internalProperty() mostRecentEvent: CustomerEvent | undefined = undefined;
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

  @internalProperty() aliases: Array<string> | null = null;

  @internalProperty() firstName = "";

  @internalProperty() lastName = "";

  @internalProperty() identityData: IdentityData | undefined;

  @internalProperty() identityId: string | undefined = undefined;

  @internalProperty() hasProfileAPIBeenCalled = false;

  @internalProperty() hasIdentityAPIBeenCalled = false;

  @internalProperty() hasHistoricalEventsAPIBeenCalled = false;

  @internalProperty() aliasObjects: Array<AliasObject> = [];

  @internalProperty() profileDataPointCount = 0;

  @internalProperty() dynamicFilterOptions: Array<string> = [];

  @internalProperty() defaultFilterOption: string | undefined = undefined;

  @internalProperty() cadDivisionType: string | undefined = undefined;

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

  connectedCallback() {
    super.connectedCallback();

    const locale = Desktop.config.clientLocale;
    this.debugLogMessage("i18n locale", locale);

    // // All CreateOptions for i18n are optional
    // type CreateOptions = {
    //     backend ? : Backend, // import Backend from "i18next-http-backend";
    //     languageDetector ? : LanguageDetector // import LanguageDetector from "i18next-browser-languagedetector";
    // };

    // const i18n = Desktop.i18n.createInstance(Desktop.i18n.DEFAULT_INIT_OPTIONS);
    // // const i18n = Desktop.i18n.createInstance(createOptions ? : CreateOptions) // returns instance described in https://www.i18next.com/overview/api#instance-creation
    // const i18nMixin = Desktop.i18n.createMixin({
    //     i18n /*Injecting i18n service instance into lit-element mixin */
    // })

    // // FYI you can see default options like so
    // console.log(Desktop.i18n.DEFAULT_INIT_OPTIONS); // => i18n.init options that are using by Desktop by default

    // // To get started, Init i18n with options to be able call "t" function translations
    // if (!i18n.isInitialized) {
    //     // Here, you are adding (merging) your localization package with the Desktop existing set of packages
    //     const initOptions = Desktop.i18n.getMergedInitOptions(Desktop.i18n.DEFAULT_INIT_OPTIONS || {}, {
    //         defaultNS: "my-ns", // "ns" here stands for the default JSON file name containing the localization
    //         ns: ["my-ns"],
    //         fallbackLng: "en",
    //         backend: {
    //             loadPath: "/.../path-to-locales/.../{{lng}}/{{ns}}.json"
    //         }
    //     });

    //     i18n.init(initOptions).catch(err => console.log(err));
    // }
  }

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

        const { callAssociatedData } = this.interactionData;
        let cadJdsDefaultFilter, cadVariableValue;

        if (callAssociatedData) {
          this.cadDivisionType = this.interactionData.callAssociatedData?.[
            JDS_DIVISION_CAD_VARIABLE
          ]?.value.toLowerCase();

          cadVariableValue = this.cadVariableLookup
            ? this.interactionData.callAssociatedData?.[this.cadVariableLookup]?.value
            : undefined;

          cadJdsDefaultFilter = this.interactionData.callAssociatedData?.[
            JDS_DEFAULT_FILTER_CAD_VARIABLE
          ]?.value.toLowerCase();

          if (cadJdsDefaultFilter) {
            this.defaultFilterOption = cadJdsDefaultFilter.toLowerCase();
            this.debugLogMessage(
              "set defaultFilterOption as CAD variable (JDSDefaultFilter) value",
              this.defaultFilterOption
            );
          } else {
            console.error(
              `The CAD Variable (JDSDefaultFilter) doesn\'t exist within this interaction. Please check your flow configuration.`
            );
          }

          console.log(
            `CAD VARIABLES: cadDivisionType: (${this.cadDivisionType}) | cadVariableValue: (${cadVariableValue}) | cadJdsDefaultFilter: (${cadJdsDefaultFilter})`
          );
        }

        this.customer = this.fetchCustomerFromInteraction(this.interactionData, cadVariableValue);
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

  fetchCustomerFromInteraction(interactionData: Interaction, cadVariableValue: string) {
    const { contactDirection, ani, dnis } = interactionData;
    if (cadVariableValue) {
      this.debugLogMessage(`SET customer identifier (CAD Variable: ${this.cadVariableLookup})`, cadVariableValue);
      return cadVariableValue;
    } else if (contactDirection === "OUTBOUND") {
      this.debugLogMessage(`SET customer identifier (contactDirection: ${contactDirection})`, dnis || null);
      return dnis || null;
    } else {
      this.debugLogMessage(`SET customer identifier (contactDirection: ${contactDirection})`, ani || null);
      return ani || null;
    }
  }

  debugLogMessage(infoMessage: string, ...args: any[]) {
    if (this.logsOn) {
      console.log(`[JDS WIDGET][LOGS-ON] ${infoMessage}`, args);
    }
  }

  //   getQueueNameOfLatestEvent(event: CustomerEvent) {
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

  sortEventsByDate(events: CustomerEvent[]) {
    if (events?.length) {
      events?.sort((previous, current) => {
        if (previous.time > current.time) {
          return -1;
        } else if (previous.time < current.time) {
          return 1;
        } else {
          return 0;
        }
      });
    }

    this.debugLogMessage("Sorted Events", events);

    // if (this.compactWxccEvents) {
    //   const filteredEvents = this.filterUniqueTaskIds(events);
    //   this.debugLogMessage("Sorted Events (Per Unique TaskId)", filteredEvents);
    //   return filteredEvents;
    // }
    return events || [];
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

  async getSubscribedProjectId() {
    const url = `${this.baseUrl}/admin/v1/api/workspace?organizationId=${this.organizationId}`;

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
        const workspaces = response?.data?.data;
        const activeWorkspace = workspaces?.find((workspace: any) => !!workspace.wxccSubscriptionIds?.length);
        return activeWorkspace?.id;
      })
      .catch((err: AxiosError) => {
        console.error(`[JDS Widget] Unable to fetch the organization's workspaces`, err);
        return undefined;
      });
  }

  async getProjectsProfileTemplates() {
    const url = `${this.baseUrl}/admin/v1/api/profile-view-template/workspace-id/${this.projectId}?organizationId=${this.organizationId}`;

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
        const projectTemplates = response?.data?.data;
        this.debugLogMessage("project's templates", projectTemplates);
        return projectTemplates;
      })
      .catch((err: AxiosError) => {
        console.error(`[JDS Widget] Unable to fetch the organization's workspaces`, err);
        return [];
      });
  }

  async determineProfileTemplate() {
    const profileTemplates = await this.getProjectsProfileTemplates();

    if (this.templateId) {
      const profileTemplateExists = profileTemplates.find(
        (template: any) => template.id === this.templateId || template.name === this.templateId
      );
      if (!profileTemplateExists) {
        console.error(
          `[JDS Widget] the templateId (${this.templateId}) provided does not exist with this projectId (${this.projectId})`
        );
        return undefined;
      } else {
        return this.templateId;
      }
    } else if (profileTemplates.length) {
      return profileTemplates?.[0]?.id;
    } else {
      console.error(`[JDS Widget] this projectId (${this.projectId}) has no profile templates.`);
      return undefined;
    }
  }

  //   async getDefaultTemplateId() {
  //     const templateName = "journey-default-template";
  //     const url = `${this.baseUrl}/admin/v1/api/profile-view-template/workspace-id/${this.projectId}/template-name/${templateName} `;

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
  //         const { id } = response?.data?.data;
  //         return id;
  //       })
  //       .catch((err: AxiosError) => {
  //         console.error(`[JDS Widget] Unable to fetch the ID of the journey-default-template`, err);
  //         return undefined;
  //       });
  //   }

  async subscribeToProfileViewStreamByTemplateName(customer: string | null, templateName: string | undefined) {
    if (!customer || !templateName) {
      console.error(`[JDS WIDGET] Failed to stream progressive profile view. Need customer & templateName provided.`);
    }

    const url = `${this.baseUrl}/v1/api/progressive-profile-view/stream/workspace-id/${this.projectId}/identity/${customer}/template-name/${templateName}?organizationId=${this.organizationId}&bearerToken=${this.bearerToken}`;
    return this.subscribeToProfileViewStream(url);
  }

  async subscribeToProfileViewStreamByTemplateId(customer: string | null, templateId: string | undefined) {
    const profileTemplateId = await this.determineProfileTemplate();

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

      // test vertical profile view
      // profileDataPoints = profileDataPoints.concat(this.profileDataPoints);

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
    const profileTemplateId = await this.determineProfileTemplate();

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

  hasTaskExpired(event: CustomerEvent): Boolean {
    const date = new Date(event.time).valueOf();
    const now = new Date(Date.now()).valueOf();
    const oneHourMs = 3600000; // 1 hour delay
    const isExpired = now - oneHourMs > date;
    console.log("hasTaskExpired", date, now, isExpired, event?.time);
    return isExpired;
  }

  parseWxccData(event: CustomerEvent) {
    const { channelType, direction } = event?.data;
    const channelTypeText = channelType === "telephony" ? "call" : channelType;
    const identityTypeText = event?.identitytype === "phone" ? "call" : event?.identitytype;
    const communicationTypeText = channelTypeText || identityTypeText;
    const formatDirectionText = direction?.toLowerCase();

    // event.renderingData = {
    //   title: `${formatDirectionText} ${channelTypeText}`,
    //   subTitle: event?.data?.queueName || `Queue ID: ${event?.data?.queueId}`,
    //   channelType: channelTypeText,
    //   iconType: channelType === "telephony" ? `${formatDirectionText}-call` : channelType,
    // };

    let wxccTitle, wxccSubTitle, wxccIconType, wxccChannelTypeTag, wxccSource, wxccIsActive, wxccFilterType;
    // const isWxccEvent = event?.source.includes("wxcc");

    if (this.isWxccEvent(event)) {
      wxccTitle = `${!!direction ? formatDirectionText : ""} ${communicationTypeText}`;
      wxccSubTitle = event?.data?.queueName || (event?.data?.queueId ? `Queue ID: ${event?.data?.queueId}` : "");
      wxccChannelTypeTag =
        channelTypeText === "call" || identityTypeText === "call" ? "voice" : channelTypeText || identityTypeText;
      wxccIconType =
        communicationTypeText === "call" && !!direction ? `${formatDirectionText}-call` : communicationTypeText;
      wxccSource = this.isWxccEvent(event) ? "wxcc" : "";
      wxccIsActive = this.isWxccEvent(event)
        ? !this.hasTaskExpired(event) && event?.type !== "task:ended" && event?.type !== "empath:data"
        : false;
      //   wxccFilterType = isWxccEvent ? channelTypeText || event?.identitytype || "misc" : "";
    }

    /////

    // const [eventType, eventSubType] = event?.type.split(":");
    // const channelTypeText = event?.data?.channelType === "telephony" ? "call" : event?.data?.channelType;
    // const agentState = event?.data?.currentState;
    // const formattedAgentState = agentState ? agentState?.charAt(0)?.toUpperCase() + agentState?.slice(1) : undefined;
    // const { channelType, currentState } = event?.data;

    // let wxccTitle, wxccSubTitle, wxccIconType, wxccFilterType;
    // const isWxccEvent = event.source.includes("wxcc");

    // const compactWxccSubTitle = !this.compactWxccEvents
    //   ? `${eventSubType || ""} ${channelTypeText || ""}`
    //   : isWxccEvent
    //   ? `WXCC ${channelTypeText || ""} event`
    //   : channelTypeText || "";

    // switch (eventType) {
    //   case EventType.Agent:
    //     wxccTitle = `Agent ${formattedAgentState || "Event"}`;
    //     wxccFilterType = currentState ? `agent ${currentState}` : "";
    //     wxccIconType = "agent";
    //     break;
    //   case EventType.Task:
    //     wxccTitle = event?.data?.origin || event?.identity;
    //     // wxccSubTitle = `${eventSubType || ""} ${channelTypeText || ""}`;
    //     wxccSubTitle = compactWxccSubTitle;
    //     wxccFilterType = channelType || event?.identitytype;
    //     wxccIconType = channelType || event?.identitytype;
    //     break;
    //   default:
    //     wxccTitle = event?.data?.origin || event?.identity;
    //     wxccSubTitle = `${channelTypeText || ""}`;
    //     wxccFilterType = channelType || event?.identitytype || "misc";
    //     wxccIconType = channelType || event?.identitytype;
    //     break;
    // }

    wxccFilterType = this.isWxccEvent(event) ? channelTypeText || event?.identitytype || "misc" : "";

    // const wxccFilterTypes = this.isWxccEvent(event) ? ["WXCC"] : [];
    const wxccFilterTypes = [];
    if (wxccFilterType) {
      wxccFilterTypes.push(wxccFilterType);
    }

    return {
      wxccTitle,
      wxccSubTitle,
      wxccChannelTypeTag,
      wxccIconType,
      wxccSource,
      wxccIsActive,
      wxccFilterTypes,
    };
  }

  hasUniqueTaskId(event: CustomerEvent, uniqueTaskIds: Set<string>) {
    return (!event?.data?.taskId || !uniqueTaskIds.has(event?.data?.taskId)) && uniqueTaskIds.add(event?.data?.taskId);
  }

  /////////
  combineTaskIdEvents(events: Array<CustomerEvent>) {
    const taskIdEvents: any = {};
    events.forEach((event: CustomerEvent) => {
      const eventTaskId = event?.data?.taskId || uuidv4();
      if (!taskIdEvents[eventTaskId]) {
        taskIdEvents[eventTaskId] = event;
      } else {
        taskIdEvents[eventTaskId] = _.merge(event, taskIdEvents[eventTaskId]);
      }
    });

    console.log("[combineTaskIds] taskIdEvents", taskIdEvents);
    return Object.values(taskIdEvents) as Array<CustomerEvent>;

    // const set = new Set();
    // return events.filter((event: CustomerEvent) => !set.has(event?.data?.taskId) && set.add(event?.data?.taskId));
  }

  //   /**
  //    * @method formatEvents
  //    */
  //   formatEvents(allEvents: Array<CustomerEvent> | null): Array<CustomerEvent> | null {
  //     this.mostRecentEvent = undefined;
  //     // get the most recent event that isn't ongoing (last task:ended event)

  //     const events = allEvents ? this.combineTaskIdEvents(allEvents) : null;
  //     console.log("[JDS Widget} sorted events (by taskId)", events);

  //     events?.map((event: CustomerEvent) => {
  //       const [eventType, eventSubType] = event?.type.split(":");
  //       const channelTypeText = event?.data?.channelType === "telephony" ? "call" : event?.data?.channelType;
  //       const agentState = event?.data?.currentState;
  //       const formattedAgentState = agentState ? agentState?.charAt(0)?.toUpperCase() + agentState?.slice(1) : undefined;
  //       const { channelType } = event?.data;

  //       const formatDirectionText = event?.data?.direction?.toLowerCase();

  //       event.renderData = {
  //         title: `${formatDirectionText} ${channelTypeText}`,
  //         description: event?.data?.queueName || `Queue ID: ${event?.data?.queueId}`,
  //         filterType: channelType === "telephony" ? "voice" : channelType,
  //         iconType: channelType === "telephony" ? `${formatDirectionText}-call` : channelType,
  //       };

  //       if (!this.mostRecentEvent && event?.type === "task:ended") {
  //         this.mostRecentEvent = event;
  //         console.log("[JDS Widget] Most Recent Event", this.mostRecentEvent);
  //       }
  //     });

  //     return events;
  //   }
  ////

  generateSubTitle(eventData: any) {
    if (!eventData) {
      return "";
    }

    const generateSubTitle = Object.keys(eventData)
      .filter(eventDataKey => eventDataKey !== "uiData")
      .map(key => `${key}: ${eventData[key]}`)
      .join(", ");

    return generateSubTitle;
  }

  /**
   * @method createSets
   * @returns void
   * Sets `filterOptions` property to a unique set of filter options for filter feature.
   */
  createDynamicFilterOptions(events: Array<CustomerEvent> | null): Array<string> {
    const uniqueFilterTypes: Set<string> = new Set(); // ex. chat, telephony, email, agent connected, etc
    uniqueFilterTypes.add(DEFAULT_CHANNEL_OPTION);

    (events || []).forEach(event => {
      // wxcc events
      const { channelType } = event?.data;
      const channelTypeText = channelType === "telephony" ? "call" : channelType;
      const wxccFilterType = this.isWxccEvent(event) ? channelTypeText || event?.identitytype || "misc" : "";

      if (wxccFilterType) {
        // if (this.isWxccEvent(event)) {
        //   uniqueFilterTypes.add("wxcc");
        // }
        uniqueFilterTypes.add(wxccFilterType.toLowerCase());
      }

      // custom events
      const customEventFilterTags = event?.data?.uiData?.filterTags;

      if (customEventFilterTags) {
        if (Array.isArray(customEventFilterTags)) {
          customEventFilterTags.forEach((eventFilterType: string) => {
            uniqueFilterTypes.add(eventFilterType.toLowerCase());
          });
        } else {
          uniqueFilterTypes.add(customEventFilterTags.toLowerCase());
        }
      }
    });
    return Array.from(uniqueFilterTypes);
  }

  isWxccEvent(event: CustomerEvent) {
    return event?.source.includes("wxcc");
  }

  finalizeEventList(events: CustomerEvent[]): CustomerEvent[] {
    // this.dynamicFilterOptions = this.createDynamicFilterOptions(events);
    // console.log("dynamic options", this.dynamicFilterOptions);
    this.mostRecentEvent = undefined;

    const allSortedEvents = this.sortEventsByDate(events);
    this.debugLogMessage("All Sorted Events", allSortedEvents);

    const combineTaskIdEventList = allSortedEvents ? this.combineTaskIdEvents(allSortedEvents) : [];
    // const combineTaskIdEventList = allSortedEvents;

    const shouldIncludeWxccEvents = (event: CustomerEvent) =>
      this.hideWxccEvents ? !event.source.includes("wxcc") : true;

    const notHiddenEvent = (event: CustomerEvent) => !event?.data?.uiData?.hidden;

    const divisionFilterMatch = (event: CustomerEvent) => {
      if (this.cadDivisionType) {
        const eventDivision = event?.data?.uiData?.division?.toLowerCase();
        return eventDivision && eventDivision === this.cadDivisionType;
      } else {
        return true;
      }
    };

    const filteredModifiedEvents = combineTaskIdEventList
      ?.filter((event: CustomerEvent) => {
        if (shouldIncludeWxccEvents(event) && notHiddenEvent(event) && divisionFilterMatch(event)) {
          // TEST

          // Most Recent Event
          // if a WXCC event, has to be a completed event. isWxccEvent && event?.type === "task:ended"
          // if custom event, then just print as most recent

          // DOUBLE CHECK, WHY !this.mostRecentEvent &&
          if (
            !this.mostRecentEvent &&
            (!this.isWxccEvent(event) || (this.isWxccEvent(event) && event?.type === "task:ended"))
          ) {
            this.mostRecentEvent = event;
            this.debugLogMessage("Most Recent Event", this.mostRecentEvent);
          }
          ///

          return event;
        }
      })
      .map((event: CustomerEvent) => {
        const {
          wxccTitle,
          wxccSubTitle,
          wxccChannelTypeTag,
          wxccIconType,
          wxccSource,
          wxccIsActive,
          wxccFilterTypes,
        } = this.parseWxccData(event);

        // const title = event?.uiData?.title || wxccTitle;
        // const subTitle = event?.uiData?.subTitle || wxccSubTitle;
        // const iconType = event?.uiData?.iconType || wxccIconType;
        // const channelTypeTag = event?.uiData?.channelTypeTag || wxccChannelTypeTag;
        // const eventSource = event?.uiData?.eventSource || wxccSource || event?.source;
        // const isActive = event?.renderingData?.isActive || wxccIsActive || false;
        // const isWxccEvent = event?.source.includes("wxcc");

        // const title = wxccTitle || event?.data?.origin || event?.identity;
        // const subTitle = wxccSubTitle || event?.data?.join(", ");
        // const iconType = wxccIconType || event?.data?.channelType || event?.data?.identitytype;
        // const channelTypeTag = wxccChannelTypeTag || event?.data?.identitytype;
        // const eventSource = wxccSource || event?.source;
        // const isActive = isWxccEvent ? wxccIsActive : false;

        const title = wxccTitle || event?.data?.uiData?.title || event?.identity;
        const subTitle =
          wxccSubTitle ||
          event?.data?.uiData?.subTitle ||
          (!this.isWxccEvent(event) ? this.generateSubTitle(event?.data) : "");
        const iconType =
          wxccIconType || event?.data?.uiData?.iconType || event?.data?.channelType || event?.data?.identitytype;
        const channelTypeTag = wxccChannelTypeTag || event?.data?.uiData?.channelTypeTag || event?.data?.identitytype;
        const eventSource = wxccSource || event?.data?.uiData?.eventSource || event?.source;
        const isActive = this.isWxccEvent(event) ? wxccIsActive : false;
        const filterTags = this.isWxccEvent(event) ? wxccFilterTypes : event?.data?.uiData?.filterTags;

        event.renderingData = {
          title,
          subTitle,
          iconType,
          channelTypeTag,
          eventSource,
          isActive,
          filterTags,
        };

        // // Most Recent Event
        // // if a WXCC event, has to be a completed event. isWxccEvent && event?.type === "task:ended"
        // // if custom event, then just print as most recent

        // // DOUBLE CHECK, WHY !this.mostRecentEvent &&
        // if (
        //   !this.mostRecentEvent &&
        //   notHiddenEvent(event) &&
        //   (!this.isWxccEvent(event) || (this.isWxccEvent(event) && event?.type === "task:ended"))
        // ) {
        //   this.mostRecentEvent = event;
        //   this.debugLogMessage("Most Recent Event", this.mostRecentEvent);
        // }

        return event;
      });

    this.dynamicFilterOptions = this.createDynamicFilterOptions(filteredModifiedEvents);
    console.log("dynamic options", this.dynamicFilterOptions);

    this.debugLogMessage("Formatted Sorted Events", filteredModifiedEvents);
    return filteredModifiedEvents;
  }

  filterEventTypes(typePrefix: EventType, events: Array<CustomerEvent>) {
    const filteredEvents = events.filter((event: CustomerEvent) => event.type.includes(`${typePrefix}:`));
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
      .then((response: any) => {
        this.events = this.finalizeEventList(response?.data?.data);
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

  filterUniqueTaskIds = (events: Array<CustomerEvent>) => {
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

  //   async callTimelineAPIs(customer: string | null) {
  //     this.newestEvents = [];
  //     this.getExistingEvents(customer || null);
  //     this.subscribeToEventStream(customer || null);
  //   }

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

    if (!this.projectId) {
      const projectId = await this.getSubscribedProjectId();
      if (projectId) {
        this.projectId = projectId;
        this.debugLogMessage("Fetched WXCC subscribed Project Id", this.projectId);
      } else {
        console.error(`[JDS Widget] You need to enable WXCC subscriptions for one of your projects`);
      }
    }

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
        .mostRecentEvent=${this.mostRecentEvent}
        .dynamicChannelTypeOptions=${this.dynamicFilterOptions}
        default-filter-option=${ifDefined(this.defaultFilterOption)}
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
          .aliases=${this.showAliasIcon ? this.aliases : null}
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
        this.aliases = identityData?.aliases || null;

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

  refreshUserSearch() {
    const inputValue = this.customerInput.value.trim();
    if (this.customer === inputValue) {
      this.handleNewCustomer(this.customer, this.templateId);
    } else {
      this.syncLoadingStatuses();
      this.customer = inputValue;
    }
  }

  renderMainInputSearch() {
    return html`
      <div class="flex-inline sub-widget-section">
        <span class="custom-input-label">Lookup Identity</span>
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
        <p class="empty-state-text">Enter a user to search for a Journey</p>
      </div>
    `;
  }

  renderSubWidgets() {
    return html`
      <div
        class=${`sub-widget-container ${
          this.profileDataPointCount > 3 ? "flex-direction-row" : "flex-direction-column"
        } ${this.enableUserSearch ? "with-user-search" : ""}`}
      >
        ${this.renderProfile()} ${this.renderEventList()}
      </div>
    `;
  }

  renderFunctionalWidget(withUserSearch = false) {
    if (this.isEntireWidgetErroring) {
      return html`
        <div class=${`customer-journey-widget-container ${withUserSearch ? "with-user-search" : ""}`}>
          <cjaas-error-notification
            title="Failed to load data"
            tracking-id=${this.entireWidgetErrorTrackingId}
            @error-try-again=${this.handleWidgetTryAgain}
          ></cjaas-error-notification>
        </div>
      `;
    } else if (this.entireWidgetLoading) {
      return html`
        <div class=${`customer-journey-widget-container ${withUserSearch ? "with-user-search" : ""}`}>
          <div class="widget-loading-wrapper">
            <md-spinner size="56"></md-spinner>
            <p class="loading-text">Loading...</p>
          </div>
        </div>
      `;
    } else {
      return html`
        <div class=${`customer-journey-widget-container populated-data ${withUserSearch ? "with-user-search" : ""}`}>
          <!-- <div class="top-header-row">
            ${this.enableUserSearch ? this.renderMainInputSearch() : nothing}
          </div> -->
          ${this.customer ? this.renderSubWidgets() : this.renderEmptyStateView()}
        </div>
      `;
    }
  }

  render() {
    if (this.enableUserSearch) {
      return html`
        <div class="widget-container user-search">
          <div class="top-header-row">
            ${this.enableUserSearch ? this.renderMainInputSearch() : nothing}
          </div>
          ${this.renderFunctionalWidget(true)}
        </div>
      `;
    } else {
      return this.renderFunctionalWidget();
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "customer-journey-widget": CustomerJourneyWidget;
  }
}
