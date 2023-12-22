/**
 * Copyright (c) Cisco Systems, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { LitElement, html, property, internalProperty, PropertyValues } from "lit-element";
import { nothing } from "lit-html";
import { repeat } from "lit-html/directives/repeat";
import { DateTime } from "luxon";
import { v4 as uuidv4 } from "uuid";
import { getRelativeDate } from "./utils";
import { customElementWithCheck } from "@/mixins/CustomElementCheck";

import "@/components/timeline-v2/TimelineItemV2";
import "@/components/timeline-v2/TimelineItemGroupV2";
import "@/components/event-toggles/EventToggles";
import styles from "./scss/module.scss";
import "@momentum-ui/web-components/dist/comp/md-badge";
import "@momentum-ui/web-components/dist/comp/md-button";
import "@momentum-ui/web-components/dist/comp/md-button-group";
import "@momentum-ui/web-components/dist/comp/md-toggle-switch";
import "@momentum-ui/web-components/dist/comp/md-spinner";
import "@momentum-ui/web-components/dist/comp/md-chip";
import "@momentum-ui/web-components/dist/comp/md-dropdown";
import iconData from "../assets/defaultIcons.json";
import _, { groupBy } from "lodash";
import { ifDefined } from "lit-html/directives/if-defined";
import { i18nLitMixin } from "@/mixins/i18nLitMixin";

const desertEmptyImage = "https://cjaas.cisco.com/assets/img/desert-open-results-192.png";

export namespace TimelineV2 {
  export interface ImiDataPayload {
    channelType?: string;
    type?: string;
  }

  export enum EventType {
    Agent = "agent",
    Task = "task",
  }

  export enum TimeRangeOptionVariables {
    "AllTime" = "allTime",
    "Last10Days" = "last10Days",
    "Last30Days" = "last30Days",
    "Last6Months" = "last6Months",
    "Last12Months" = "last12Months",
  }

  export enum ChannelType {
    "telephony" = "telephony",
    "chat" = "chat",
    "email" = "email",
  }

  export interface WxccDataPayload {
    agentId?: string; // state_change
    currentState?: string; // state_change
    teamId?: string; // state_change
    channelType?: string; // types
    createdTime?: number;
    destination?: string;
    direction?: "INBOUND" | "OUTBOUND"; // types
    origin?: string;
    outboundType?: string | null;
    reason?: string; // ended
    terminatingParty?: string; // ended
    queueId?: string;
    taskId?: string;
    workflowManager?: string | null; // task new
    type?: string;
  }

  export interface CustomUIDataPayload {
    title?: string;
    subTitle?: string;
    iconType?: string;
    channelTypeTag?: string;
    filterTags?: string | Array<string>;
  }

  export interface RenderingDataObject {
    title: string;
    subTitle: string;
    iconType: string;
    channelTypeTag: string;
    eventSource: string;
    isActive: boolean;
    filterTags: Array<string>;
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
    renderingData: RenderingDataObject;
    customUIData?: CustomUIDataPayload;
  }

  export interface ClusterInfoObject {
    id: string;
    channelType: string;
    origin: string;
  }

  export interface TimelineCustomizations {
    [key: string]: {
      name?: string;
      src?: string;
      color?: string;
      showcase?: string;
    };
  }

  @customElementWithCheck("cjaas-timeline-v2")
  export class ELEMENT extends i18nLitMixin(LitElement) {
    /**
     * @attr limit
     * Set number of events to render
     */
    @property({ type: Number, reflect: true }) limit = 5;
    /**
     * @prop getEventsInProgress
     * Whether or not to render loading spinner or not
     */
    @property({ type: Boolean }) getEventsInProgress = false;
    /**
     * @attr is-event-filter-visible
     * Show/hide event filters UI
     */
    @property({ type: Boolean, attribute: "is-event-filter-visible" }) isEventFilterVisible = false;
    /**
     * @attr is-date-filter-visible
     * Show/hide date filters UI
     */
    @property({ type: Boolean, attribute: "is-date-filter-visible" }) isDateFilterVisible = false;
    /**
     * @attr live-stream
     * Toggle adding latest live events being added directly to timeline (instead of queue)
     */
    @property({ type: Boolean, attribute: "live-stream", reflect: true }) liveStream = false; //  need to implement
    /**
     * @attr collapse-view
     * Set default event groups to collapsed
     */
    @property({ type: Boolean, attribute: "collapse-view" }) collapseView = true;
    /**
     * @prop badgeKeyword
     * set badge icon based on declared keyword from dataset
     */
    @property({ type: String, attribute: "badge-keyword" }) badgeKeyword = "channelType";
    // Data Property Input from Application
    /**
     * @prop historicEvents
     * Dataset of events
     */
    @property({ type: Array, attribute: false }) historicEvents: CustomerEvent[] | null = null;
    /**
     * @prop newestEvents
     * Dataset keeping track of queued latest live events
     */
    @property({ type: Array, attribute: false }) newestEvents: Array<CustomerEvent> = [];
    /**
     * @prop dynamicChannelTypeOptions
     * An array of filter options that was dynamically created based on all existing events
     */
    @property({ type: Array, attribute: false }) dynamicChannelTypeOptions: Array<string> = [];
    /**
     * @prop defaultFilterOption
     * The default selected filter type
     */
    @property({ type: String, attribute: "default-filter-option" }) defaultFilterOption = "";
    /**
     * @prop mostRecentEvent
     * A event payload representing the most recent event
     */
    @internalProperty() mostRecentEvent: CustomerEvent | undefined = undefined;
    /**
     * @prop eventTypes
     * Dataset of all unique event types
     */
    @property({ type: Array, attribute: false }) eventTypes: Array<string> = [];
    /**
     * @prop filterTypes
     * Dataset of all unique filter types
     */
    @property({ type: Array, attribute: false }) filterTypes: Array<string> = [];
    /**
     * @prop channelTaskTypes
     * Dataset of all unique channel & task Ids
     */
    @property({ type: Array, attribute: false }) channelTaskTypes: Array<string> = [];
    /**
     * @prop activeDates
     * Dataset tracking all visible dates (in date filter)
     */
    @property({ type: Array, attribute: false }) activeDates: Array<string> = [];
    /**
     * Property to pass in data template to set color and icon settings and showcased data
     * @prop eventIconTemplate
     */
    @property({ attribute: false }) eventIconTemplate: TimelineCustomizations = iconData;
    /**
     * Timeline section error message to be displayed when API fails
     * @prop eventIconTemplate
     */
    @property({ type: String, attribute: "error-message" }) errorMessage = "";
    /**
     * Timeline section error tracking ID to be displayed when API fails
     * @prop errorTrackingID
     */
    @property({ type: String, attribute: "error-tracking-id" }) errorTrackingID = "";
    /**
     * @prop collapsed
     * Dataset tracking event clusters that are renderd in collapsed view
     */
    @internalProperty() collapsed: Set<string> = new Set();

    @internalProperty() dateRangeOldestDate: DateTime = DateTime.now().minus({ year: 10 });
    /**
     * @prop expandDetails
     * Toggle expanded event details
     */
    @internalProperty() expandDetails = false;
    @internalProperty() isTranscriptModalOpen = false;
    @internalProperty() modalEventTranscript: string | undefined = undefined;

    @internalProperty() timeRangeOption = this.t(`timeRange.${TimeRangeOptionVariables.AllTime}`);

    DEFAULT_CHANNEL_OPTION = this.t("common.all").toLowerCase();

    daysOfTheWeek = [
      this.t("weekDay.monday"),
      this.t("weekDay.tuesday"),
      this.t("weekDay.wednesday"),
      this.t("weekDay.thursday"),
      this.t("weekDay.friday"),
      this.t("weekDay.saturday"),
      this.t("weekDay.sunday"),
    ];

    timeRangeOptionsLocale = [
      this.t("timeRange.allTime"),
      this.t("timeRange.last10Days"),
      this.t("timeRange.last30Days"),
      this.t("timeRange.last6Months"),
      this.t("timeRange.last12Months"),
    ];

    filteredByTypeList: CustomerEvent[] | null = null;

    newestEventsFilteredByType: Array<CustomerEvent> = [];

    constructor() {
      super();
      this.defaultFilterOption = this.DEFAULT_CHANNEL_OPTION as string;
      this.timeRangeOption = this.t(`timeRange.${TimeRangeOptionVariables.AllTime}`);
    }

    firstUpdated(changedProperties: PropertyValues) {
      super.firstUpdated(changedProperties);
      this.dateRangeOldestDate = this.calculateOldestEntry(this.timeRangeOption);
    }

    updated(changedProperties: PropertyValues) {
      super.updated(changedProperties);

      if (changedProperties.has("historicEvents")) {
        this.dynamicChannelTypeOptions = this.createDynamicFilterOptions(this.historicEvents);
      }

      if (changedProperties.has("newestEvents") && this.liveStream) {
        this.consolidateEvents();
      }

      if (changedProperties.has("dynamicChannelTypeOptions") || changedProperties.has("defaultFilterOption")) {
        const hasDefaultOption = this.dynamicChannelTypeOptions.includes(this.defaultFilterOption.toLowerCase());
        if (!hasDefaultOption) {
          console.error(
            `[JDS WIDGET]: Your default filter option (${this.defaultFilterOption.toLowerCase()}) doesn't exist in the dynamic filter options.`,
            this.dynamicChannelTypeOptions
          );
          this.defaultFilterOption = this.DEFAULT_CHANNEL_OPTION as string;
        }
      }
    }

    combineTaskIdEvents(events: Array<CustomerEvent>) {
      const taskIdEvents: any = {};
      events.forEach((event: CustomerEvent) => {
        const eventTaskId = event?.data?.taskId;
        if (!taskIdEvents[eventTaskId]) {
          taskIdEvents[eventTaskId] = event;
        } else {
          taskIdEvents[eventTaskId] = _.merge(event, taskIdEvents[eventTaskId]);
        }
      });

      return Object.values(taskIdEvents) as Array<CustomerEvent>;

      // const set = new Set();
      // return events.filter((event: CustomerEvent) => !set.has(event?.data?.taskId) && set.add(event?.data?.taskId));
    }

    getClusterId(text: string, key: number) {
      const myText = text || uuidv4();
      const myKey = key || 0;

      const clusterId = `${myText?.replace(/\s+/g, "-").toLowerCase()}-${myKey}`;
      return clusterId;
    }

    /**
     * @method collapseDate
     * @param {string} clusterId
     * Toggles a collapsed view of a single date's group of events
     */
    collapseDate(clusterId: string) {
      !this.collapsed.has(clusterId) ? this.collapsed.add(clusterId) : this.collapsed.delete(clusterId);
      this.requestUpdate();
    }

    /**
     * @method calculateOldestEntry
     * @returns {DateTime}
     */
    calculateOldestEntry(timeRangeOption: string) {
      switch (timeRangeOption) {
        case this.t(`timeRange.${TimeRangeOptionVariables.AllTime}`):
          return DateTime.now().minus({ year: 10 });
        case this.t(`timeRange.${TimeRangeOptionVariables.Last10Days}`):
          return DateTime.now().minus({ day: 10 });
        case this.t(`timeRange.${TimeRangeOptionVariables.Last30Days}`):
          return DateTime.now().minus({ day: 30 });
        case this.t(`timeRange.${TimeRangeOptionVariables.Last6Months}`):
          return DateTime.now().minus({ month: 6 });
        case this.t(`timeRange.${TimeRangeOptionVariables.Last12Months}`):
          return DateTime.now().minus({ month: 12 });
        default:
          return DateTime.now().minus({ year: 10 });
      }
    }

    isWxccEvent(event: CustomerEvent) {
      return event?.source.includes("wxcc");
    }

    /**
     * @method createSets
     * @returns void
     * Sets `filterOptions` property to a unique set of filter options for filter feature.
     */
    createDynamicFilterOptions(events: Array<CustomerEvent> | null): Array<string> {
      const uniqueFilterTypes: Set<string> = new Set(); // ex. chat, telephony, email, agent connected, etc
      uniqueFilterTypes.add(this.DEFAULT_CHANNEL_OPTION as string);

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
      const dynamicOptions = Array.from(uniqueFilterTypes);
      console.log("dynamic filter options ", dynamicOptions);
      return dynamicOptions;
    }

    /**
     * @method consolidateEvents
     * @returns void
     * @fires new-event-queue-cleared
     * Updates the visible timeline events with queued new events
     */
    consolidateEvents() {
      if (this.newestEvents.length > 0) {
        this.historicEvents = [...this.newestEvents, ...(this.filteredByTypeList || [])];
        this.newestEvents = [];

        this.dynamicChannelTypeOptions = this.createDynamicFilterOptions(this.historicEvents);

        this.dispatchEvent(
          new CustomEvent("new-event-queue-cleared", {
            bubbles: true,
            composed: true,
          })
        );
      }
    }

    /**
     * @method toggleLiveEvents
     * Toggles live event stream to queue setting
     */
    toggleLiveEvents() {
      this.liveStream = !this.liveStream;
      if (this.newestEvents.length > 0) {
        this.consolidateEvents();
      }
    }

    // renderNewEventQueueToggle() {
    //   return html`
    //     <md-toggle-switch class="livestream-toggle" smaller @click=${this.toggleLiveEvents} ?checked=${this.liveStream}>
    //       <span style="font-size:.75rem;">
    //         ${this.t("timeline.livestream")}
    //       </span>
    //     </md-toggle-switch>
    //     ${this.renderNewEventCounter()}
    //   `;
    // }

    // renderNewEventCounter() {
    //   // translate show new event if used again
    //   return html`
    //     <md-chip
    //       class=${`event-counter ${this.newestEvents.length > 0 ? "" : "hidden"}`}
    //       class="event-counter"
    //       small
    //       @click=${this.consolidateEvents}
    //       value="Show ${this.newestEvents.length} new events"
    //     ></md-chip>
    //   `;
    // }

    renderTimestamp(dateString: any, clusterId: string) {
      const dateFormat = "yyyy-MM-dd";
      const todayDate = DateTime.now().toFormat(dateFormat);
      const yesterdayDate = DateTime.fromFormat(todayDate, dateFormat)
        .minus({ days: 1 })
        .toFormat(dateFormat);

      const readableDate = DateTime.fromISO(dateString).toFormat("D");

      let dayNumber;
      let dayName;
      switch (dateString) {
        case todayDate:
          dayName = this.t("common.today");
          break;
        case yesterdayDate:
          dayName = this.t("common.yesterday");
          break;
        default:
          dayNumber = new Date(dateString).getDay();
          dayName = this.daysOfTheWeek[dayNumber];
          break;
      }

      return html`
        <p class="timestamp">
          <span class="day">${dayName}</span>
          <span class="date">${readableDate}</span>
        </p>
      `;
    }

    renderEventsByDate(groupedItem: { date: string; events: CustomerEvent[] }, lastEventsByDate = false) {
      const { date, events } = groupedItem;
      const idString = "date " + groupedItem.date;
      const clusterId = this.getClusterId(idString, 1);

      return html`
        <div class=${`timeline date-set ${lastEventsByDate ? "last-data-set" : ""}`} id=${clusterId}>
          ${this.renderTimestamp(date, clusterId)} ${this.populateEventsByDate(groupedItem.events, lastEventsByDate)}
        </div>
      `;
    }

    /**
     * Grouping/Collapsing by clusters of event types.
     * @method populateEvents
     * @param {CustomerEvent[]} events
     * @returns map
     */
    populateEventsByDate(events: CustomerEvent[], lastEventsByDate = false) {
      let index = 0; // Set index reference independent of Map function index ref
      return events.map(() => {
        if (index > events.length - 1) {
          return;
        }

        const keyId = index; // get num ref to make unique ID and memoize ref for singleton rendering

        index++;
        return this.renderTimelineItem(events[keyId], lastEventsByDate && keyId >= events.length - 1);
      });
    }

    renderTimelineItem(event: CustomerEvent, lastItem = false) {
      return html`
        <cjaas-timeline-item-v2
          title=${event?.renderingData?.title}
          description=${event?.renderingData?.subTitle}
          time=${event?.time}
          icon-type=${event?.renderingData?.iconType}
          sentiment=${ifDefined(event?.data?.customerSentiment?.toLowerCase())}
          event-source=${event?.renderingData?.eventSource}
          .data=${event?.data}
          .eventIconTemplate=${this.eventIconTemplate}
          class=${lastItem ? "" : "has-line"}
          ?is-ongoing=${event?.renderingData?.isActive}
          @expand-transcript-modal=${this.expandTranscriptModal}
        ></cjaas-timeline-item-v2>
      `;
    }

    renderLoadMoreAction() {
      return (this.filteredByTypeList || []).length > this.limit
        ? html`
            <md-link
              @click=${(e: Event) => {
                e.preventDefault();
                this.limit += 5;
              }}
              ><span class="load-more-text">${this.t("common.loadMore")}</span></md-link
            >
          `
        : nothing;
    }

    static get styles() {
      return styles;
    }

    renderEmptyState() {
      return html`
        <div class="center-content-wrapper">
          <div class="center-content empty-state">
            <div class="image-wrapper">
              <img src="${desertEmptyImage}" class="failure-image" alt="failure-image" />
            </div>
            <p class="no-matches-found-text">${this.t("error.noMatchesFound")}</p>
          </div>
        </div>
      `;
    }

    // filterByType(eventList: CustomerEvent[] | undefined | null) {
    //   if (this.defaultFilterOption !== ChannelTypeOptions.AllChannels && this.defaultFilterOption) {
    //     return (
    //       eventList?.filter(
    //         (event: CustomerEvent) =>
    //           event?.renderingData?.channelTypeTag &&
    //           this.defaultFilterOption.toLowerCase().includes(event?.renderingData?.channelTypeTag?.toLowerCase())
    //       ) || null
    //     );
    //   } else {
    //     return eventList;
    //   }
    // }

    filterByType(eventList: CustomerEvent[] | undefined | null) {
      if (this.defaultFilterOption !== this.DEFAULT_CHANNEL_OPTION && this.defaultFilterOption) {
        return (
          eventList?.filter(
            (event: CustomerEvent) =>
              event?.renderingData?.filterTags?.length &&
              event.renderingData?.filterTags?.some(
                filterTag => filterTag.toLowerCase() === this.defaultFilterOption.toLowerCase()
              )
          ) || null
        );
      } else {
        return eventList;
      }
    }

    convertStringToDateObject(time: string) {
      return DateTime.fromJSDate(new Date(time)).toUTC();
    }

    filterByDateRange() {
      return this.historicEvents?.filter((event: CustomerEvent) => {
        return this.convertStringToDateObject(event.time) > this.dateRangeOldestDate.toUTC();
      });
    }

    handleTimelineTryAgain() {
      this.dispatchEvent(new CustomEvent("timeline-error-try-again", {}));
    }

    renderTimelineItemList(dateGroupArray: Array<{ date: string; events: CustomerEvent[] }>) {
      if (this.errorMessage) {
        return html`
          <div class="center-content-wrapper">
            <div class="center-content">
              <cjaas-error-notification
                title=${this.t("error.failedToLoadData")}
                tracking-id=${this.errorTrackingID}
                @error-try-again=${this.handleTimelineTryAgain}
              ></cjaas-error-notification>
            </div>
          </div>
        `;
      }
      if (this.getEventsInProgress) {
        return html`
          <div class="center-content-wrapper">
            <div class="center-content">
              <md-spinner size="32"></md-spinner>
            </div>
          </div>
        `;
      } else if (dateGroupArray.length > 0) {
        return html`
          ${repeat(
            dateGroupArray,
            singleDaysEvents => singleDaysEvents.date,
            (singleDaysEvents, index) => this.renderEventsByDate(singleDaysEvents, index === dateGroupArray.length - 1)
          )}
        `;
      } else {
        return this.renderEmptyState();
      }
    }

    handleChannelTypeSelection(event: CustomEvent) {
      const { option } = event?.detail;
      this.defaultFilterOption = option.toLowerCase();
    }

    handleTimeRangeSelection(event: CustomEvent) {
      const { option } = event?.detail;
      this.timeRangeOption = option;
      this.dateRangeOldestDate = this.calculateOldestEntry(this.timeRangeOption);
    }

    expandTranscriptModal(event: CustomEvent) {
      const { isOpen, transcript } = event?.detail;
      this.isTranscriptModalOpen = isOpen;
      this.modalEventTranscript = transcript;
    }

    renderTranscriptModal() {
      return html`
        <md-modal
          class="transcript-modal"
          htmlId="transcript-modal"
          ?show=${this.isTranscriptModalOpen}
          size="small"
          hideFooter
          hideHeader
          showCloseButton
          backdropClickExit
          @close-modal=${() => {
            this.isTranscriptModalOpen = false;
            this.modalEventTranscript = undefined;
          }}
        >
          <div slot="header">${this.t("timelineItem.transcript")}</div>
          <span class="transcript-text">${this.modalEventTranscript}</span>
        </md-modal>
      `;
    }

    render() {
      // Groups items by date
      const filterByDateRangeResult = this.filterByDateRange();
      this.filteredByTypeList = this.filterByType(filterByDateRangeResult) || null;
      const limitedList = (this.filteredByTypeList || []).slice(0, this.limit);

      const groupedByDate = groupBy(limitedList, (item: CustomerEvent) => getRelativeDate(item.time).toISODate());

      const dateGroupArray = Object.keys(groupedByDate).map((date: string) => {
        const obj = { date, events: groupedByDate[date] };
        return obj;
      });

      return html`
        <div class="timeline-section" part="timeline-wrapper">
          ${this.renderTranscriptModal()}
          <div class="top-header-row">
            <h3 class="contact-activities-header">
              ${this.t("timeline.activities")}<md-tooltip class="contact-activity-tooltip"
                ><md-icon class="info-icon" name="info_16"></md-icon>
                <div slot="tooltip-content">
                  <p class="contact-tooltip-message">
                    ${this.t("timeline.activityTooltipMessage")}
                  </p>
                </div></md-tooltip
              >
            </h3>
            <div class="toggle-container">
              <span class="toggle-label">${this.t("timeline.livestream")}</span>
              <md-toggle-switch
                class="livestream-toggle"
                alignLabel="left"
                @click=${this.toggleLiveEvents}
                ?checked=${this.liveStream}
              >
              </md-toggle-switch>
            </div>
          </div>
          <div class="most-recent-wrapper">
            <cjaas-timeline-item-v2
              title=${ifDefined(this.mostRecentEvent?.renderingData?.title)}
              description=${ifDefined(this.mostRecentEvent?.renderingData?.subTitle)}
              time=${ifDefined(this.mostRecentEvent?.time)}
              icon-type=${ifDefined(this.mostRecentEvent?.renderingData?.iconType)}
              event-source=${ifDefined(this.mostRecentEvent?.renderingData?.eventSource)}
              .eventIconTemplate=${this.eventIconTemplate}
              .data=${this.mostRecentEvent?.data}
              ?empty-most-recent=${!this.mostRecentEvent}
              is-most-recent
              @expand-transcript-modal=${this.expandTranscriptModal}
            ></cjaas-timeline-item-v2>
          </div>
          <div class="filter-row">
            <div class="filter-block">
              <p class="filter-label">${this.t("timeline.filterBy")}</p>
              <md-dropdown
                class="filter-dropdown channels-dropdown"
                .defaultOption=${this.defaultFilterOption}
                .options=${this.dynamicChannelTypeOptions}
                @dropdown-selected=${(event: CustomEvent) => this.handleChannelTypeSelection(event)}
              ></md-dropdown>
            </div>
            <div class="filter-block">
              <p class="filter-label">${this.t("timeRange.timeRange")}</p>
              <md-dropdown
                class="filter-dropdown time-range-dropdown"
                .defaultOption=${this.t(this.timeRangeOption)}
                .options=${this.timeRangeOptionsLocale}
                @dropdown-selected=${(event: CustomEvent) => this.handleTimeRangeSelection(event)}
              ></md-dropdown>
            </div>
          </div>
          <section class="stream" part="stream">
            ${this.renderTimelineItemList(dateGroupArray)}
            <div class="footer">
              ${this.renderLoadMoreAction()}
            </div>
          </section>
        </div>
      `;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "cjaas-timeline-v2": TimelineV2.ELEMENT;
  }
}
