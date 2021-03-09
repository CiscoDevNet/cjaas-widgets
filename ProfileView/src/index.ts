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
  customElement,
  LitElement
} from "lit-element";
// import "./components/ActivityStream/ActivityItem";
// import "./components/View/View";
import "@cjaas/common-components";
import { Profile } from "./types/cjaas";
import styles from "./assets/styles/View.scss";

/**
 * Please give your widget a unique name. We recommend using prefix to identify the author and help avoid naming conflict. e.g. "2ring-timer-widget"
 */
@customElement("cjaas-profile-view-widget")
export default class CjaasProfileWidget extends LitElement {
  @property() customer: string | undefined;
  @property() template: any | null | undefined = null;
  @property({ attribute: "auth-token" }) authToken:
    | string
    | null
    | undefined = null;

  @property({ type: String, attribute: "base-url" }) baseURL =
    "https://trycjaas.exp.bz";

  @internalProperty() profile: any;
  @internalProperty() presetTags: any = {};
  @internalProperty() showSpinner = false;

  updated(changedProperties: any) {
    changedProperties.forEach((oldValue: string, name: string) => {
      console.log(oldValue);
      if (
        (name === "template" || name === "customer") &&
        this.customer &&
        this.template
      ) {
        this.getProfile();
      }
    });
  }

  getProfile() {
    const url = `${this.baseURL}/profileview?personid=${this.customer}`;
    this.showSpinner = true;
    this.requestUpdate();

    // set verbose as true for tabbed attributes
    const template = Object.assign({}, this.template);
    template.Attributes = template.Attributes.map((x: any) => {
      if (x.type === "tab") {
        x.Verbose = true;
      }
      return x;
    });

    const body = JSON.stringify(template);

    return fetch(url, {
      headers: {
        "Content-type": "application/json",
        Authorization: "SharedAccessSignature " + this.authToken
      },
      method: "POST",
      body
    })
      .then((x: Response) => x.json())
      .then((x: Profile) => {
        this.profile = this.template.Attributes.map((y: any, i: number) => {
          // if attribute is of tab type
          // save journey events as well
          let journeyEvents = null;
          if (y.type === "tab") {
            try {
              journeyEvents = JSON.parse(
                x.attributeView[i].journeyEvents || "null"
              );
            } catch {
              console.error("Error while parsing Journey Event");
            }
          }

          return {
            query: y,
            result: x.attributeView[i].result.split(","),
            journeyEvents
          };
        });

        // extracts tagged data from result
        this.setTaggedResults();
        this.showSpinner = false;
        this.requestUpdate();
      })
      .catch((err: Error) => {
        console.log(err);
        this.showSpinner = false;
        this.requestUpdate();
      });
  }

  // result from api is split and stored back to the input template.
  // This is because the api does not return reliable template back.
  setTaggedResults() {
    const PRESET_TAGS = ["name", "email"];

    PRESET_TAGS.forEach((x: string) => {
      let matches = this.profile.filter((y: any) => y.query.tag === x);
      if (x === "name") {
        matches = matches.sort((a: any) => {
          if (a.query.Metadata === "firstName") {
            return -1;
          } else if (a.query.Metadata === "lastName") {
            return 1;
          } else return 0;
        });
        // latest first name & last name
        this.presetTags["name"] = [matches[0].result[0], matches[1].result[0]];
      } else if (x === "email") {
        this.presetTags["email"] = matches.map((y: any) => y.result).join(", ");
      } else {
        this.presetTags[x] = matches.map((y: any) => y.result);
      }
    });
  }

  getFormattedProfile() {
    return html`
      <div class="profile-bound default-template">
        <profile-view
          .profile=${this.profile}
          .presetTags=${this.presetTags}
        ></profile-view>
        <section class="customer-journey" title="Customer Journey">
          <div class="header inner-header">
            <h4>Customer Journey</h4>
          </div>
          ${this.getTabs()}
        </section>
      </div>
    `;
  }

  getLoadingSpinner() {
    return this.showSpinner
      ? html`
          <div class="spinner-container">
            <md-spinner size="20"></md-spinner>
          </div>
        `
      : html`
          <md-button
            .circle=${true}
            color="white"
            size="28"
            title="Reload Profile"
            @click=${() => this.getProfile()}
          >
            <img
              height="20px"
              src="https://cjaas.cisco.com/web-components/icons/refresh_24.svg"
            />
          </md-button>
        `;
  }

  getTabs() {
    // tab data should return the event as such.. Should be rendered by stream component.
    const tabs = this.profile.filter((x: any) => x.query.type === "tab");
    // TODO: Track the selected tab to apply a class to the badge for color synching, making blue when selected
    const activityTab = this.authToken
      ? html`
          <md-tab slot="tab">
            <span>All</span>
          </md-tab>
          <md-tab-panel slot="panel">
            <cjs-timeline
              .streamId=${this.authToken}
              .filter=${`person eq '${this.customer}'`}
              type="journey-and-stream"
            ></cjs-timeline>
          </md-tab-panel>
        `
      : html`
          <div class="center full-height">
            <div>No data to show</div>
          </div>
        `;
    if (tabs && tabs.length > 0) {
      return html`
        <md-tabs>
          ${activityTab}
          ${tabs.map((x: any) => {
            console.log(x);
            return html`
              <md-tab slot="tab">
                <span>${x.query.DisplayName}</span
                ><md-badge small>${x.journeyEvents.length}</md-badge>
              </md-tab>
              <md-tab-panel slot="panel">
                <!-- use verbose journey events with timeline comp -->
                <cjs-timeline .tapeEvents="${x.journeyEvents}"></cjs-timeline>
              </md-tab-panel>
            `;
          })}
        </md-tabs>
      `;
    } else {
      return activityTab;
    }
  }

  static get styles() {
    return styles;
  }

  render() {
    return html`
      <div class="outer-container">
        ${this.profile
          ? this.getFormattedProfile()
          : html`
              <div class="empty-state">
                ${this.showSpinner
                  ? html`
                      <div class="spinner-container">
                        <md-spinner size="32"></md-spinner>
                      </div>
                    `
                  : html`
                      <div class="spinner-container">No Profile available</div>
                    `}
              </div>
            `}
      </div>
    `;
  }
}
