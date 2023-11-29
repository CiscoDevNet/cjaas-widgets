/**
 * Copyright (c) Cisco Systems, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { LitElement, html, property } from "lit-element";
import styles from "./scss/module.scss";
import { customElementWithCheck } from "@/mixins/CustomElementCheck";

import { TimelineV2 } from "./TimelineV2";
import "@momentum-ui/web-components/dist/comp/md-chip";
import * as iconData from "../assets/defaultIcons.json";
import { formattedOrigin } from "./utils";

export namespace TimelineItemGroupV2 {
  @customElementWithCheck("cjaas-timeline-item-group-v2")
  export class ELEMENT extends LitElement {
    /**
     * @attr id
     */
    @property({ type: String }) id = "";
    /**
     * @attr title
     */
    @property({ type: String, attribute: "event-title" }) eventTitle = "";
    /**
     * @attr cluster-sub-title
     */
    @property({ type: String, attribute: "cluster-sub-title" }) clusterSubTitle = "";
    /**
     * @attr type
     */
    @property({ type: String, attribute: "group-icon" }) groupIcon = "";
    /**
     * @attr time
     */
    @property({ type: String }) time = "";
    /**
     * @attr grouped
     */
    @property({ type: Boolean, reflect: true }) grouped = true;
    /**
     * @prop events
     */
    @property({ type: Array, attribute: false }) events: TimelineV2.CustomerEvent[] = [];
    /**
     * @prop activeTypes
     */
    @property({ type: Array, attribute: false }) activeTypes: Array<string> = [];
    /**
     * @prop activeDates
     */
    @property({ type: Array, attribute: false }) activeDates: Array<string> = [];
    /**
     * Property to pass in data template to set color and icon settings and showcased data
     * @prop eventIconTemplate
     */
    @property({ attribute: false })
    eventIconTemplate: TimelineV2.TimelineCustomizations = iconData;

    static get styles() {
      return styles;
    }

    renderId() {
      return html`
        <div class="sub-title">
          <span>ID:</span>
          ${this.id || "NA"}
        </div>
      `;
    }

    /**
     * @method expandDetails
     * @fires toggle-group
     * Toggles a grouped view for like events
     */
    expandDetails = () => {
      this.grouped = !this.grouped;
      this.dispatchEvent(
        new CustomEvent("toggle-group", {
          bubbles: true,
          composed: true,
        })
      );
    };

    renderSingleton(event: TimelineV2.CustomerEvent) {
      return html`
        <cjaas-timeline-item
          .event=${event}
          event-title=${event.renderingData?.title || formattedOrigin(event?.data?.origin, event?.data?.channelType)}
          sub-title=${event.renderingData?.subTitle || ""}
          .time=${event.time}
          .data=${event.data}
          .id=${event.id}
          .person=${event.person || null}
          group-item
          .eventIconTemplate=${this.eventIconTemplate}
          class="has-line"
        ></cjaas-timeline-item>
      `;
    }

    render() {
      return this.grouped
        ? html`
            <cjaas-timeline-item
              @click=${this.expandDetails}
              event-title=${this.eventTitle}
              sub-title=${this.clusterSubTitle}
              time=${this.time}
              class="has-line"
              ?is-cluster=${true}
              group-icon-map-keyword=${this.groupIcon}
              .data=${{ "Event Group": this.eventTitle }}
              .eventIconTemplate=${this.eventIconTemplate}
            ></cjaas-timeline-item>
          `
        : html`
            <md-chip class="group-item" small value="collapse events" @click=${this.expandDetails}></md-chip>
            ${this.events?.map(event => {
              return this.renderSingleton(event);
            })}
          `;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "cjaas-timeline-item-group-v2": TimelineItemGroupV2.ELEMENT;
  }
}
