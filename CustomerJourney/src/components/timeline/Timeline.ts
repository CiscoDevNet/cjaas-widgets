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
import { formattedOrigin, getRelativeDate } from "./utils";
import { customElementWithCheck } from "@/mixins/CustomElementCheck";

import "@/components/timeline/TimelineItem";
import "@/components/timeline/TimelineItemGroup";
import "@/components/event-toggles/EventToggles";
import styles from "./scss/module.scss";
import "@momentum-ui/web-components/dist/comp/md-badge";
import "@momentum-ui/web-components/dist/comp/md-button";
import "@momentum-ui/web-components/dist/comp/md-button-group";
import "@momentum-ui/web-components/dist/comp/md-toggle-switch";
import "@momentum-ui/web-components/dist/comp/md-spinner";
import "@momentum-ui/web-components/dist/comp/md-chip";
import iconData from "../assets/defaultIcons.json";
import { groupBy } from "lodash";

export namespace Timeline {
  export interface ImiDataPayload {
    channelType?: string;
    type?: string;
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

  // export interface CustomerEvent {
  //   data: Record<string, any>;
  //   renderData?: Record<string, any>;
  //   dataContentType: string;
  //   id: string;
  //   person: string;
  //   previously: string;
  //   source: string;
  //   specVersion: string;
  //   time: string;
  //   type: string;
  // }

  export interface CustomerEvent {
    data: Record<string, any>;
    renderData?: Record<string, any>;
    id: string;
    specversion: string;
    type: string;
    source: string;
    time: string;
    identity: string;
    identitytype: "email" | "phone" | "customerId";
    previousidentity: null;
    datacontenttype: string;
    person?: string;
  }

  export interface ClusterInfoObject {
    id: string;
    data: {
      channelType: string;
      origin: string;
      direction: "OUTBOUND" | "INBOUND";
      destination: string;
    };
  }

  export interface TimelineCustomizations {
    [key: string]: {
      name?: string;
      src?: string;
      color?: string;
      showcase?: string;
    };
  }

  @customElementWithCheck("cjaas-timeline")
  export class ELEMENT extends LitElement {
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
     * @attr time-frame
     * Determine default time frame on start
     */
    @property({ type: String, attribute: "time-frame" }) timeFrame: TimeFrame = TimeFrame.All;
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
     * @prop activeTypes
     * Dataset tracking all visible event types (in event filter)
     */
    @property({ type: Array, attribute: false }) activeTypes: Array<string> = [];
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
     * Property to pass in data template to set color and icon settings and showcased data
     * @prop eventIconTemplate
     */
    @property({ type: String, attribute: "error-message" }) errorMessage = "";
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

    filteredByTypeList: CustomerEvent[] | null = null;

    newestEventsFilteredByType: Array<CustomerEvent> = [];

    firstUpdated(changedProperties: PropertyValues) {
      super.firstUpdated(changedProperties);
      this.dateRangeOldestDate = this.calculateOldestEntry();
    }

    updated(changedProperties: PropertyValues) {
      super.updated(changedProperties);
      if (changedProperties.has("historicEvents")) {
        this.formatEvents(this.historicEvents);
        this.createSets();
      }
      if (changedProperties.has("newestEvents") && this.liveStream) {
        this.consolidateEvents();
      }
    }

    /**
     * @method formatEvents
     */
    formatEvents(allEvents: Array<CustomerEvent> | null): void {
      allEvents?.map((event: CustomerEvent) => {
        const [eventType, eventSubType] = event?.type.split(":");
        const channelTypeText = event?.data?.channelType === "telephony" ? "call" : event?.data?.channelType;
        const agentState = event?.data?.currentState;
        const formattedAgentState = agentState
          ? agentState?.charAt(0)?.toUpperCase() + agentState?.slice(1)
          : undefined;
        const { channelType, currentState } = event?.data;

        switch (eventType) {
          case EventType.Agent:
            event.renderData = {
              title: `Agent ${formattedAgentState || "Event"}`,
              filterType: currentState ? `agent ${currentState}` : "",
            };
            break;
          case EventType.Task:
            event.renderData = {
              subTitle: `${eventSubType || ""} ${channelTypeText || ""}`,
              filterType: channelType,
            };
            break;
          default:
            event.renderData = {
              subTitle: `${channelTypeText || ""}`,
              filterType: channelType || "misc",
            };
            break;
        }
      });
    }

    /**
     * @method createSets
     * @returns void
     * Sets `filterOptions` property to a unique set of filter options for filter feature.
     * Sets `eventTypes` property to a unique set of event types from current historicEvents.
     */
    createSets() {
      const eventTypeArray: Set<string> = new Set(); // ex. task:connected
      const filterOptionsArray: Set<string> = new Set(); // ex. chat, telephony, email, agent connected

      (this.historicEvents || []).forEach(event => {
        eventTypeArray.add(event?.type);
        filterOptionsArray.add(event?.renderData?.filterType);
      });
      this.eventTypes = Array.from(eventTypeArray);
      this.filterTypes = Array.from(filterOptionsArray);
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
     * @method toggleActive
     * @param {Number} index
     */
    toggleActive(index: number) {
      this.timeFrame = Object.values(TimeFrame)[index];
      this.dateRangeOldestDate = this.calculateOldestEntry();
    }

    /**
     * @method calculateOldestEntry
     * @returns {DateTime}
     */
    calculateOldestEntry() {
      switch (this.timeFrame) {
        case TimeFrame["24-Hours"]:
          return DateTime.now().minus({ day: 1 });
        case TimeFrame["7-Days"]:
          return DateTime.now().minus({ week: 1 });
        case TimeFrame["30-Days"]:
          return DateTime.now().minus({ month: 1 });
        default:
          return DateTime.now().minus({ year: 10 });
      }
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

    renderNewEventQueueToggle() {
      return html`
        <md-toggle-switch class="livestream-toggle" smaller @click=${this.toggleLiveEvents} ?checked=${this.liveStream}>
          <span style="font-size:.75rem;">
            Livestream
          </span>
        </md-toggle-switch>
        ${this.renderNewEventCounter()}
      `;
    }

    renderNewEventCounter() {
      return html`
        <md-chip
          class=${`event-counter ${this.newestEvents.length > 0 ? "" : "hidden"}`}
          class="event-counter"
          small
          @click=${this.consolidateEvents}
          value="Show ${this.newestEvents.length} new events"
        ></md-chip>
      `;
    }

    renderTimeBadge(readableDate: any, clusterId: string) {
      return html`
        <md-tooltip message="Toggle to expand/collapse events on this date">
          <md-badge .outlined=${true} class="date" @click=${() => this.collapseDate(clusterId)}>
            <span class="badge-text">${readableDate}</span>
          </md-badge>
        </md-tooltip>
      `;
    }

    renderTimelineItems(groupedItem: { date: string; events: CustomerEvent[] }) {
      const { date, events } = groupedItem;
      const eventsKeyword = events.length === 1 ? "event" : "events";
      const idString = "date " + groupedItem.date;
      const clusterId = this.getClusterId(idString, 1);
      const readableDate = DateTime.fromISO(date).toFormat("D");
      const printableDate = DateTime.fromISO(date).toFormat("DDD");

      return html`
        <div class="timeline date-set has-line" id=${clusterId}>
          ${this.renderTimeBadge(readableDate, clusterId)}
          ${this.collapsed.has(clusterId)
            ? html`
                <cjaas-timeline-item
                  event-title=${`${events.length} ${eventsKeyword} from ${printableDate}`}
                  .data=${{ Date: readableDate }}
                  .time=${date}
                  ?is-cluster=${true}
                  ?is-date-cluster=${true}
                  group-icon-map-keyword="multi events single day"
                  .eventIconTemplate=${this.eventIconTemplate}
                  .badgeKeyword=${this.badgeKeyword}
                ></cjaas-timeline-item>
              `
            : this.populateEvents(groupedItem.events)}
        </div>
      `;
    }

    createClusterInfo(clusterArray: Array<CustomerEvent>): ClusterInfoObject {
      const firstRealEvent: CustomerEvent =
        clusterArray.find((event: CustomerEvent) => event?.data?.channelType !== undefined) || clusterArray[0];

      const { channelType, origin, taskId, currentState, direction, destination } = firstRealEvent?.data;
      const formattedChannelType = channelType === "telephony" ? "Call" : channelType;
      const agentType = currentState ? "agent" : "";

      return {
        id: taskId || uuidv4(),
        data: {
          channelType: formattedChannelType || agentType,
          origin,
          direction,
          destination,
        },
      };
    }

    /**
     * Grouping/Collapsing by clusters of event types.
     * @method populateEvents
     * @param {CustomerEvent[]} events
     * @returns map
     */
    populateEvents(events: CustomerEvent[]) {
      let index = 0; // Set index reference independent of Map function index ref
      return events.map(() => {
        if (index > events.length - 1) {
          return;
        }

        const cluster = [events[index]]; // start new cluster
        const clusterTaskId = events[index]?.data?.taskId || uuidv4();
        const keyId = index; // get num ref to make unique ID and memoize ref for singleton rendering

        while (
          index < events.length - 1 &&
          events[index]?.data?.taskId &&
          events[index + 1]?.data?.taskId &&
          events[index]?.data?.taskId === events[index + 1]?.data?.taskId
        ) {
          cluster.push(events[index + 1]); // push the next event into ongoing cluster
          index++;
        }

        index++;
        if (cluster.length > 1) {
          if (this.collapseView) {
            this.collapsed.add(this.getClusterId(clusterTaskId, keyId));
          }
          const clusterInfo = this.createClusterInfo(cluster);
          return this.renderCluster(cluster, clusterInfo, keyId);
        } else {
          return this.renderEventBlock(events[keyId]);
        }
      });
    }

    renderCluster(cluster: CustomerEvent[], clusterInfo: ClusterInfoObject, keyId: number) {
      const clusterChannelType = clusterInfo?.data?.channelType;
      const clusterId = this.getClusterId(clusterInfo?.id, keyId);
      const formattedClusterOrigin = formattedOrigin(clusterInfo, clusterChannelType);

      return this.collapsed.has(clusterId)
        ? html`
            <cjaas-timeline-item-group
              id=${clusterId}
              cluster-sub-title=${`${cluster.length} events`}
              event-title=${clusterChannelType === "agent" ? "" : formattedClusterOrigin}
              group-icon=${clusterChannelType}
              time=${cluster[0].time}
              class="has-line"
              .events=${cluster}
              ?grouped=${this.collapseView}
              .activeDates=${this.activeDates}
              .activeTypes=${this.activeTypes}
              .eventIconTemplate=${this.eventIconTemplate}
            ></cjaas-timeline-item-group>
          `
        : html`
            <span @click=${() => this.collapseDate(clusterId)}>collapse group</span>
            ${cluster.map(event => {
              return html`
                ${this.renderEventBlock(event)}
              `;
            })}
          `;
    }

    renderDateRangeButtons(aTimeFrame: TimeFrame) {
      const timeFrameArray = Object.values(TimeFrame);
      const index = timeFrameArray?.indexOf(aTimeFrame);

      return html`
        <md-button-group .active=${index}>
          <button
            class="button-group-button"
            slot="button"
            id="filter-last-all"
            type="button"
            @click=${() => this.toggleActive(0)}
            value="All"
          >
            All
          </button>
          <button
            class="button-group-button"
            slot="button"
            id="filter-last-24-hours"
            type="button"
            @click=${() => this.toggleActive(1)}
            value="Last 24 Hours"
          >
            Last 24 Hours
          </button>
          <button
            class="button-group-button"
            slot="button"
            id="filter-last-7-days"
            type="button"
            @click=${() => this.toggleActive(2)}
            value="Last 7 Days"
          >
            Last 7 Days
          </button>
          <button
            class="button-group-button"
            slot="button"
            id="filter-last-30-days"
            type="button"
            @click=${() => this.toggleActive(3)}
            value="Last 30 Days"
          >
            Last 30 Days
          </button>
        </md-button-group>
      `;
    }

    renderFilterButton() {
      if (this.filterTypes && this.activeTypes) {
        return html`
          <cjaas-event-toggles
            .eventTypes=${this.filterTypes}
            .activeTypes=${this.activeTypes}
            @active-type-update=${(e: CustomEvent) => {
              this.activeTypes = e.detail.activeTypes;
              this.requestUpdate();
            }}
          ></cjaas-event-toggles>
        `;
      } else {
        nothing;
      }
    }

    renderEventBlock(event: CustomerEvent) {
      return html`
        <cjaas-timeline-item
          .event=${event}
          event-title=${event?.renderData?.title || formattedOrigin(event, event?.data?.channelType)}
          sub-title=${event?.renderData?.subTitle || ""}
          time=${event?.time}
          .data=${event?.data}
          id=${event?.id}
          .person=${event?.person || null}
          .eventIconTemplate=${this.eventIconTemplate}
          .badgeKeyword=${this.badgeKeyword}
          ?expanded="${this.expandDetails}"
          class="has-line"
        ></cjaas-timeline-item>
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
              ><span class="load-more-text">Load More</span></md-link
            >
          `
        : nothing;
    }

    static get styles() {
      return styles;
    }

    renderEmptyState() {
      const isFilteredListEmpty = !this.filteredByTypeList || this.filteredByTypeList.length === 0;

      if (!this.historicEvents || this.historicEvents.length === 0) {
        return html`
          <div class="empty-state">
            <div>
              <md-icon class="empty-state-icon" name="icon-people-insight_24"></md-icon>
            </div>
            <span class="timeline-statement"
              >${`No historic events to show.${this.liveStream ? " Listening for new events..." : ""}`}</span
            >
          </div>
        `;
      } else if (isFilteredListEmpty) {
        return html`
          <div class="empty-state">
            <div>
              <md-icon class="empty-state-icon" name="icon-people-insight_24"></md-icon>
            </div>
            <span class="timeline-statement">No historic events exist within the current date range.</span>
          </div>
        `;
      }
    }

    filterByType(list: CustomerEvent[] | undefined | null) {
      if (this.activeTypes.length) {
        return list?.filter(item => this.activeTypes.includes(item?.renderData?.filterType)) || null;
      } else {
        return list;
      }
    }

    convertStringToDateObject(time: string) {
      return DateTime.fromJSDate(new Date(time)).toUTC();
    }

    filterByDateRange() {
      return this.historicEvents?.filter(item => {
        return this.convertStringToDateObject(item.time) > this.dateRangeOldestDate.toUTC();
      });
    }

    renderList(dateGroupArray: Array<{ date: string; events: CustomerEvent[] }>) {
      if (this.errorMessage) {
        return html`
          <div class="empty-state">
            <span class="timeline-statement error">${this.errorMessage}</span>
          </div>
        `;
      }
      if (this.getEventsInProgress) {
        return html`
          <div class="empty-state">
            <md-spinner size="32"></md-spinner>
          </div>
        `;
      } else if (dateGroupArray.length > 0) {
        return html`
          ${repeat(
            dateGroupArray,
            singleDaysEvents => singleDaysEvents.date,
            singleDaysEvents => this.renderTimelineItems(singleDaysEvents)
          )}
        `;
      } else {
        return this.renderEmptyState();
      }
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
        <div class="wrapper" part="timeline-wrapper">
          <section class="controls" part="controls">
            <div class="row first-row">
              <div class="flex-apart">
                ${this.renderDateRangeButtons(this.timeFrame)}
              </div>
              <div class="filter-button-wrapper">
                ${this.renderFilterButton()}
              </div>
            </div>
            <div class="row second-row">
              ${this.renderNewEventQueueToggle()}
            </div>
          </section>
          <section class="stream" part="stream">
            ${this.renderList(dateGroupArray)}
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
    "cjaas-timeline": Timeline.ELEMENT;
  }
}
