/**
 * Copyright (c) Cisco Systems, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { LitElement, html, property } from "lit-element";
import { nothing } from "lit-html";
import { classMap } from "lit-html/directives/class-map";
import { DateTime } from "luxon";
import styles from "./scss/module.scss";
import { getIconData, getTimeStamp } from "./utils";
import { customElementWithCheck } from "@/mixins/CustomElementCheck";

import { Timeline } from "./Timeline";
import * as iconData from "@/assets/defaultIcons.json";
import * as linkify from "linkifyjs";

export namespace TimelineItem {
  export type ShowcaseList = string[];
  @customElementWithCheck("cjaas-timeline-item")
  export class ELEMENT extends LitElement {
    /**
     * @attr id
     */
    @property({ type: String }) id = "";
    /**
     * @attr eventTitle
     */
    @property({ type: String, attribute: "event-title" }) eventTitle = "";
    /**
     * @attr sub-title
     */
    @property({ type: String, attribute: "sub-title" }) subTitle = "";
    /**
     * @attr time
     */
    @property({ type: String }) time = "";
    /**
     * @prop data
     */
    @property() data: any = null;
    /**
     * @attr person
     */
    @property({ type: String }) person: string | null = null;
    /**
     * @attr expanded
     */
    @property({ type: Boolean, reflect: true }) expanded = false;
    /**
     * @attr groupItem
     */
    @property({ type: Boolean, attribute: "group-item" }) groupItem = false;
    /**
     * Property to pass in data template to set color and icon settings and showcased data
     * @prop eventIconTemplate
     */
    @property({ attribute: false }) eventIconTemplate: Timeline.TimelineCustomizations = iconData;

    /**
     * @prop badgeKeyword
     * set badge icon based on declared keyword from dataset
     */
    @property({ type: String, attribute: "badge-keyword" }) badgeKeyword = "channelType";

    @property({ type: Boolean, attribute: "is-cluster" }) isCluster = false;

    @property({ type: Boolean, attribute: "is-date-cluster" }) isDateCluster = false;

    @property({ type: String, attribute: "group-icon-map-keyword" }) groupIconMapKeyword = "";

    static get styles() {
      return styles;
    }

    /**
     * @method copyValue
     * @param {Event} e
     * Copies text to clipboard
     */
    copyValue = (e: Event) => {
      /* Get the text field */
      const copyText = (e.target as HTMLElement).innerText as string;
      /* Copy the text inside the text field */
      navigator.clipboard.writeText(copyText);
    };

    /**
     * @method createTableRecursive
     * @param data
     * @returns Template
     * Builds the timeline item's data table
     */
    createTableRecursive(data: any): any {
      if (!data) {
        return nothing;
      } else {
        return html`
          ${Object.keys(data).map((x: string) => {
            if (typeof data[x] !== "object") {
              if (data[x]) {
                let renderValue = data[x] || "-";
                if (typeof data[x] === "string" && linkify.test(data[x], "url")) {
                  renderValue = html`
                    <a href=${data[x]} target="_blank">${renderValue}</a>
                  `;
                }
                /* eslint disable */
                return html`
                  <div title=${x} class="cell">${x}</div>
                  <div title=${data[x]} class="cell" @click=${(e: Event) => this.copyValue(e)}>${renderValue}</div>
                `;
              }
            } else {
              return this.createTableRecursive(data[x]);
            }
          })}
        `;
      }
    }

    renderExpandedDetails = () => {
      if (this.data === nothing) return nothing;
      return html`
        <div class="details grid">
          ${this.createTableRecursive(this.data)}
        </div>
      `;
    };

    renderSubTitle() {
      // let label;
      // let dataPoint;

      // if (this.data) {
      //   const dataPoints = Object.keys(this.data);
      //   let usableDataPointIndex = 0;
      //   label = dataPoints[usableDataPointIndex];
      //   dataPoint = this.data[label];
      //   const dataPointIsString = false;

      //   while (!dataPointIsString) {
      //     if (typeof dataPoint === "string") {
      //       break;
      //     } else {
      //       if (dataPoint === undefined) {
      //         return nothing;
      //       }
      //       usableDataPointIndex++;
      //       label = dataPoints[usableDataPointIndex];
      //       dataPoint = this.data[label];
      //     }
      //   }
      // }

      // return html`
      //   <div class="sub-title">
      //     <span>${label || "NA"}: </span>
      //     ${dataPoint || "NA"}
      //   </div>
      // `;

      return html`
        <div class="sub-title">
          ${this.subTitle}
        </div>
      `;
    }

    renderShowcase = () => {
      const timeStamp = getTimeStamp(DateTime.fromISO(this.time) || DateTime.local(), this.isDateCluster);

      // const parsedIconMap = JSON.parse(JSON.stringify(this.eventIconTemplate)).default;
      // const npsScore = this.data["NPS"];
      // if (this.title.toLowerCase().includes("survey")) {
      //   return html`
      //     <div class="nps" style="background-color: var(--response-${npsScore});">
      //       ${npsScore || "-"}
      //     </div>
      //   `;
      // }
      // try {
      //   const { showcase } = parsedIconMap![this.title];
      //   if (showcase && this.data[showcase]) {
      //     return this.data[showcase];
      //   } else {
      //     return timeStamp;
      //   }
      // } catch {
      //   if (this.title.includes("events")) return;
      // }

      const dateAndTimeArray = timeStamp?.split(",");

      let renderTimeRow = nothing;
      if (dateAndTimeArray && dateAndTimeArray?.length > 1) {
        renderTimeRow = html`
          <div class="time-row">
            <span class="time-value">${dateAndTimeArray?.[1]}</span>
          </div>
        `;
      }

      return html`
        <div class="date-time-container">
          <p class="date">${dateAndTimeArray?.[0]}</p>
          ${renderTimeRow}
        </div>
      `;
    };

    expandDetails = () => {
      this.expanded = !this.expanded;
    };

    private get groupClassMap() {
      return {
        "group-item": this.groupItem,
        "cluster-item": this.isCluster,
        expanded: this.expanded,
      };
    }

    render() {
      let iconData;
      let iconKeyword;

      if (this.data) {
        const isAgent = this.data?.currentState ? "agent" : "";

        if (this.groupIconMapKeyword) {
          iconKeyword = this.groupIconMapKeyword;
        } else {
          iconKeyword = this.data[this.badgeKeyword] || isAgent || "";
        }
        iconData = getIconData(iconKeyword, this.eventIconTemplate!) || {
          name: "icon-meetings_16",
          color: "grey", // TODO CHANGE
        };
      }

      return html`
        <div class="timeline-item ${classMap(this.groupClassMap)}">
          <div class="top-content" @click=${this.expandDetails}>
            <md-badge class="badge" .circle=${true} size="40" .color=${iconData?.color}>
              ${iconData?.name
                ? html`
                    <md-icon class="badge-icon" .name=${iconData?.name}></md-icon>
                  `
                : html`
                    <img src=${iconData?.src} />
                  `}
            </md-badge>
            <div class="info-section">
              <div class="title">${this.eventTitle}</div>
              ${this.subTitle ? this.renderSubTitle() : nothing}
            </div>
            <div class="time-stamp">${this.renderShowcase()}</div>
          </div>
          ${this.expanded ? this.renderExpandedDetails() : nothing}
        </div>
      `;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "cjaas-timeline-item": TimelineItem.ELEMENT;
  }
}
