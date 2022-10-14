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
import { Profile, ServerSentEvent, IdentityData, Alias, IdentityTypeObject } from "./types/cjaas";
import { EventSourceInitDict } from "eventsource";
import "@cjaas/common-components/dist/comp/cjaas-timeline";
import "@cjaas/common-components/dist/comp/cjaas-profile";
import "@cjaas/common-components/dist/comp/cjaas-identity";
import { Timeline } from "@cjaas/common-components/dist/types/components/timeline/Timeline";
import { DateTime } from "luxon";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
// @ts-ignore
import { version } from "../version";

export enum RawAliasTypes {
  Phone = "phone",
  Email = "email",
  CustomerId = "customerId",
  Unknown = "unknown",
  Unselected = "",
}

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

export interface AliasObject {
  type: RawAliasTypes;
  value: string;
}

@customElementWithCheck("customer-journey-widget")
export default class CustomerJourneyWidget extends LitElement {
  @property({ type: Boolean, attribute: "logs-on" }) logsOn = false;
  /**
   * Path to the proper Customer Journey API deployment
   * @attr base-url
   */
  @property({ type: String, attribute: "base-url" }) baseUrl: string | undefined = undefined;
  /**
   * Customer ID used for Journey lookup
   * @attr customer
   */
  @property({ type: String, reflect: true }) customer: string | null = null;
  /**
   * SAS Token that provides read permissions to Journey API (used for Profile retrieval)
   * @attr profile-read-token
   */
  @property({ type: String, attribute: "profile-read-token" })
  profileReadToken: string | null = null;
  /**
   * SAS Token that provides write permissions to Journey API (used for POST data template in Profile retrieval)
   * @attr profile-write-token
   */
  @property({ type: String, attribute: "profile-write-token" })
  profileWriteToken: string | null = null;

  /**
   * SAS Token to with read permission for fetching identity details
   */
  @property({ attribute: "identity-read-token" })
  identityReadToken: string | null = null;
  /**
   * SAS Token to with write permission for updating alias to identity
   */
  @property({ attribute: "identity-write-token" })
  identityWriteToken: string | null = null;

  /**
   * SAS Token that provides read permissions for Historical Journey
   * @attr tape-token
   */
  @property({ type: String, attribute: "tape-read-token" }) tapeReadToken: string | null = null;
  /**
   * SAS Token that provides read permissions for Journey Stream
   * @attr stream-token
   */
  @property({ type: String, attribute: "stream-read-token" }) streamReadToken: string | null = null;
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
  @property({ type: String, attribute: "template-id" }) templateId = "journey-default-template";
  /**
   * Property to pass in JSON template to set color and icon settings
   * @prop eventIconTemplate
   */
  @property({ attribute: false }) eventIconTemplate: Timeline.TimelineCustomizations = iconData;
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
   * @prop live-stream
   */
  @property({ type: Boolean, attribute: "live-stream" }) liveStream = false;
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
   * Store for Stream event source
   * @prop eventSource
   */
  @internalProperty() eventSource: EventSource | null = null;
  /**
   * Internal toggle of loading state for timeline section
   * @prop timelineLoading
   */
  @internalProperty() getEventsInProgress = false;
  /**
   * Internal toggle of loading state for profile section
   * @prop profileLoading
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

  @internalProperty() identityID: string | null = null;

  @internalProperty() hasProfileAPIBeenCalled = false;

  @internalProperty() hasIdentityAPIBeenCalled = false;

  @internalProperty() hasHistoricalEventsAPIBeenCalled = false;

  @internalProperty() aliasObjects: Array<AliasObject> = [];

  basicRetryConfig = {
    retries: 5,
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

    if (changedProperties.has("interactionData")) {
      if (this.interactionData) {
        this.debugLogMessage("interactionData", this.interactionData);
        this.customer = this.interactionData?.["ani"] || null;
      } else {
        this.customer = null;
      }
    }

    if (
      (changedProperties.has("customer") || changedProperties.has("templateId")) &&
      this.customer &&
      this.templateId
    ) {
      this.getProfileFromTemplateId(this.customer, this.templateId);
    }

    if (changedProperties.has("customer")) {
      this.aliasGetInProgress = true;
      this.debugLogMessage("customer", this.customer);
      this.newestEvents = [];
      this.getExistingEvents(this.customer || null);
      this.subscribeToStream(this.customer || null);
      this.identityData = await this.getAliasesByAlias(this.customer || null);
      this.firstName = this.identityData?.firstName || "";
      this.lastName = this.identityData?.lastName || "";
      this.identityID = this.identityData?.id || null;
      this.debugLogMessage("identityID", this.identityID);
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
    const encodedValue = value ? btoa(value) : null;
    return encodedValue;
  }

  getProfileFromTemplateId(customer: string | null, templateId: string) {
    this.profileData = undefined;
    this.getProfileDataInProgress = true;

    const url = `${this.baseUrl}/v1/journey/views?templateId=${templateId}&personId=${this.encodeParameter(customer)}`;

    const config: AxiosRequestConfig = {
      method: "GET",
      url,
      headers: {
        Authorization: `SharedAccessSignature ${this.profileReadToken}`,
      },
    };

    const axiosInstance = axios.create(config);

    if (!this.hasProfileAPIBeenCalled) {
      axiosRetry(axiosInstance, this.basicRetryConfig);
    }

    return axiosInstance
      .get(url)
      .then(response => {
        const { attributeView, personId } = response?.data?.data;
        this.profileErrorMessage = "";
        this.profileData = this.parseResponse(attributeView, personId);
      })
      .catch((err: Error) => {
        this.profileData = undefined;
        this.profileErrorMessage = `Failed to fetch the profile data.`;
        console.error(
          `[JDS Widget] Unable to fetch the Profile for customer (${customer}) with templateId (${templateId})`,
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

  parseResponse(attributes: any, personId: string) {
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

  filterEventTypes(typePrefix: EventType, events: Array<Timeline.CustomerEvent>) {
    const filteredEvents = events.filter((event: Timeline.CustomerEvent) => event.type.includes(`${typePrefix}:`));
    return filteredEvents;
  }

  getExistingEvents(customer: string | null) {
    this.events = [];

    this.getEventsInProgress = true;
    this.baseUrlCheck();
    const url = `${this.baseUrl}/v1/journey/streams/historic/${this.encodeParameter(customer)}`;

    const config: AxiosRequestConfig = {
      method: "GET",
      url,
      headers: {
        Authorization: `SharedAccessSignature ${this.tapeReadToken}`,
      },
    };

    const axiosInstance = axios.create(config);

    if (!this.hasHistoricalEventsAPIBeenCalled) {
      axiosRetry(axiosInstance, this.basicRetryConfig);
    }

    return axiosInstance
      .get(url)
      .then((response: any) => {
        // TODO: any type to be changed to Timeline.CustomerEvent
        const myEvents = response?.data?.events?.map((event: any) => {
          event.time = DateTime.fromISO(event.time);
          return event;
        });
        // const filteredEvents = this.filterEventTypes(EventType.Task, data.events);
        const filteredEvents = myEvents;
        this.events = this.sortEventsbyDate(filteredEvents);
        this.timelineErrorMessage = "";
        return filteredEvents;
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

  subscribeToStream(customer: string | null) {
    if (this.eventSource) {
      this.eventSource.close();
    }

    this.baseUrlCheck();
    if (this.streamReadToken) {
      const header: EventSourceInitDict = {
        headers: {
          "content-type": "application/json; charset=UTF-8",
          accept: "application/json",
          Authorization: `SharedAccessSignature ${this.streamReadToken}`,
        },
      };
      const encodedCustomer = this.encodeParameter(customer);
      const url = `${this.baseUrl}/streams/v1/journey/person/${encodedCustomer}?${this.streamReadToken}`;
      this.eventSource = new EventSource(url, header);
    }

    if (this.eventSource) {
      this.eventSource.onopen = event => {
        console.log(`[JDS Widget] The Journey stream connection has been established for customer \'${customer}\'.`);
      };

      this.eventSource.onmessage = (event: ServerSentEvent) => {
        let data;

        try {
          data = JSON.parse(event.data);
          data.time = DateTime.fromISO(data.time);

          if (data.data && (data?.datacontenttype === "string" || data?.dataContentType === "string")) {
            data.data = JSON.parse(data.data);
          }
          this.newestEvents = this.sortEventsbyDate([data, ...this.newestEvents]);
        } catch (err) {
          console.error("[JDS Widget] journey/stream: No parsable data fetched");
        }
      };

      this.eventSource!.onerror = error => {
        console.error(`[JDS Widget] There was an EventSource error: `, error);
      }; // TODO: handle this error case
    } else {
      console.error(`[JDS Widget] No event source is active for ${customer}`);
    }
  }

  updateComprehensiveEventList() {
    this.events = this.sortEventsbyDate([...this.newestEvents, ...this.events]);
    this.newestEvents = [];
  }

  handleKey(e: CustomEvent) {
    const { srcEvent } = e?.detail;
    if (srcEvent.key === "Enter") {
      e.composedPath()[0].blur();
    }

    this.handleBackspace(srcEvent);
  }

  handleNamesUpdate(event: CustomEvent) {
    this.nameApiErrorMessage = "";
    const { firstName, lastName } = event?.detail;

    this.addFirstLastNameIdentity(this.identityID, firstName, lastName);
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
        ?live-stream=${this.liveStream}
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
          @delete-alias=${(ev: CustomEvent) => this.deleteAliasById(this.identityID, ev?.detail?.type, ev.detail.alias)}
          @add-alias=${(ev: CustomEvent) => this.addAliasById(this.identityID, ev?.detail?.type, ev?.detail?.alias)}
          .minimal=${true}
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

  createAliasMap(identities: Array<IdentityTypeObject> | undefined, aliases: Array<string> | undefined) {
    const identityObjects: Array<AliasObject> = [];

    if (identities) {
      identities.forEach((identityTypeObject: IdentityTypeObject) => {
        const { type, values } = identityTypeObject;
        values.forEach((aliasValue: string) => {
          identityObjects.push({ type, value: aliasValue });
        });
      });
    }

    this.debugLogMessage("identityObjects with types", identityObjects);

    const existingAliases = identityObjects.map(identityObject => identityObject.value);

    const oldAliases: Array<AliasObject> = [];
    if (aliases) {
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

    this.aliasObjects = identityObjects.concat(oldAliases);
  }

  /**
   * Search for an Identity of an individual via aliases. This will return one/more Identities.
   * The Provided aliases belong to one/more Persons.
   * This is where we gather the ID of the individual for future alias actions
   * @param customer
   * @returns Promise<IdentityData | undefined>
   */
  async getAliasesByAlias(customer: string | null): Promise<IdentityData | undefined> {
    const url = `${this.baseUrl}/v1/journey/identities?aliases=${this.encodeParameter(customer)}`;

    const config: AxiosRequestConfig = {
      method: "GET",
      url,
      headers: {
        Authorization: `SharedAccessSignature ${this.identityReadToken}`,
        "Content-Type": "application/json",
      },
    };

    const axiosInstance = axios.create(config);

    if (!this.hasIdentityAPIBeenCalled) {
      axiosRetry(axiosInstance, this.basicRetryConfig);
    }

    return axiosInstance
      .get(url)
      .then(response => {
        const identityAlias = response?.data?.data?.length ? response?.data?.data[0] : undefined;
        const aliases = identityAlias?.aliases || undefined;
        const identities = identityAlias?.identities || undefined;
        this.createAliasMap(identities, aliases);

        this.aliasErrorMessage = "";
        return identityAlias;
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
   * @param customer
   * @param alias
   * @returns void
   */
  addFirstLastNameIdentity(identityId: string | null, firstName: string, lastName: string) {
    this.aliasNamesUpdateInProgress = true;

    const url = `${this.baseUrl}/v1/journey/identities/${identityId}`;

    if (!firstName.trim() && !lastName.trim()) {
      console.error("[JDS Widget] You cannot add empty values to first or last name.");
      return;
    }

    const requestData = JSON.stringify({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
    });

    const config: AxiosRequestConfig = {
      method: "PUT",
      data: requestData,
      headers: {
        Authorization: `SharedAccessSignature ${this.identityWriteToken}`,
        "Content-Type": "application/json",
      },
    };

    return axios(url, config)
      .then((response: AxiosResponse<IdentityData>) => {
        this.firstName = response?.data?.firstName;
        this.lastName = response?.data?.lastName;
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
  addAliasById(identityId: string | null, aliasType: string, alias: string) {
    const url = `${this.baseUrl}/v1/journey/identities/${identityId}/aliases`;

    const trimmedAlias = alias.trim();
    if (!trimmedAlias) {
      console.error("[JDS Widget] You cannot add an empty value as a new alias");
      return;
    }

    this.aliasAddInProgress = true;

    const requestData = JSON.stringify({
      identities: [
        {
          type: aliasType,
          values: [alias],
        },
      ],
    });

    const config: AxiosRequestConfig = {
      method: "POST",
      data: requestData,
      headers: {
        Authorization: `SharedAccessSignature ${this.identityWriteToken}`,
        "Content-Type": "application/json",
      },
    };

    return axios(url, config)
      .then((response: AxiosResponse<any>) => {
        const responseData = response.data as IdentityData;

        if (this.identityData) {
          this.identityData.aliases = responseData?.aliases;
          this.identityData = responseData;
          this.createAliasMap(this.identityData?.identities, this.identityData?.aliases);
          this.requestUpdate();
        }
        this.aliasErrorMessage = "";
      })
      .catch(err => {
        console.error(`[JDS Widget] Failed to add AliasById ${identityId}`, err?.response);

        let subErrorMessage = "";
        if (err?.response?.data?.status === 409) {
          subErrorMessage = "This alias is a duplicate.";
        }
        this.aliasErrorMessage = `Failed to add alias(es) ${alias}. ${subErrorMessage}`;
      })
      .finally(() => {
        this.aliasAddInProgress = false;
      });
  }

  deleteAliasById(identityId: string | null, aliasType: string, alias: string) {
    this.setInlineAliasLoader(alias, true);

    const hasPlusSign = alias.charAt(0) === "+";

    let aliasToDelete = alias;
    if (aliasType === RawAliasTypes.Phone || hasPlusSign) {
      aliasToDelete = this.encodeParameter(alias) || aliasToDelete;
    }
    const url = `${this.baseUrl}/v1/journey/identities/${identityId}/aliases?aliases=${aliasToDelete}`;

    const config: AxiosRequestConfig = {
      method: "DELETE",
      headers: {
        Authorization: `SharedAccessSignature ${this.identityWriteToken}`,
        "Content-Type": "application/json",
      },
    };

    return axios(url, config)
      .then((response: any) => {
        const responseData = response.data as IdentityData;

        if (this.identityData) {
          this.identityData = responseData;
          this.createAliasMap(this.identityData?.identities, this.identityData?.aliases);
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

  refreshUserSearch() {
    this.customer = null;
    this.customer = this.customerInput.value;
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
            placeholder="examples: Jon Doe, (808) 645-4562, jon@gmail.com"
            value=${this.customer || ""}
            shape="pill"
            @input-keydown=${(event: CustomEvent) => this.handleKey(event)}
            @blur=${(e: FocusEvent) => {
              this.customer = e.composedPath()[0].value;
            }}
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
          ${this.renderMainInputSearch()}
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
