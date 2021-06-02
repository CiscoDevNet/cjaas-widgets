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
  PropertyValues,
} from "lit-element";
import { customElementWithCheck } from "./mixins/CustomElementCheck";
import styles from "./assets/styles/action-builder.scss";
import { nothing } from "lit-html";

export const conditionType = ["SOURCE", "EVENT", "DATA"];
import "@momentum-ui/web-components/dist/comp/md-alert-banner";
import "@momentum-ui/web-components/dist/comp/md-button";

@customElementWithCheck("cjaas-action-builder")
export default class CjaasActionBuilder extends LitElement {
  @property({ type: String }) baseURL = "https://trycjaas.exp.bz";

  @internalProperty() conditions: Array<any> = [];

  defaultCondition: any;
  @internalProperty() triggerType: triggerType | undefined;
  @internalProperty() showSuccessMessage = false;
  @internalProperty() showErrorMessage = false;
  @internalProperty() errorMessage = "";
  updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);
  }

  static get styles() {
    return styles;
  }

  render() {
    return html`
      <div>
        <md-icon name="icon-location_32" size="24"></md-icon
        ><span>Journey</span>
      </div>

      ${this.conditions.length > 0
        ? this.conditions.map((x, i) => {
            return html`
              <cjaas-condition
                .index=${i}
                .optionsList=${conditionType}
                .conditionType=${x.type}
                .param=${x.param}
                .showDelete=${this.conditions.length > 1}
                @updated-condition=${(ev: CustomEvent) =>
                  this.updateCondition(ev)}
                @add-condition=${(ev: Event) => this.addNewCondition(ev, i)}
                @delete-condition=${(ev: Event) => this.discardCondition(ev, i)}
              ></cjaas-condition>
            `;
          })
        : html`
            <cjaas-condition
              .index=${0}
              .optionsList=${conditionType}
              @updated-condition=${(ev: CustomEvent) =>
                this.updateCondition(ev)}
              @add-condition=${(ev: Event) => this.addNewCondition(ev, 0)}
            ></cjaas-condition>
          `}
      <div class="footer">
        <md-icon name="icon-flag_24" size="18"></md-icon>
        then trigger
        <md-dropdown
          .options=${["Walk In", "Offer Image"]}
          @dropdown-selected=${(ev: any) => {
            this.triggerType = ev.detail.option;
          }}
        ></md-dropdown>
        ${this.getPayloadTemplate()}
      </div>
      <div class="cta">
        <md-button color="green" @click=${() => this.saveTrigger()}
          >Save</md-button
        >
      </div>
      <md-alert-banner
        .show=${this.showSuccessMessage}
        type="default"
        message="Trigger Saved"
      ></md-alert-banner>
      <md-alert-banner
        .show=${this.showErrorMessage}
        type="error"
        .message=${this.errorMessage}
      ></md-alert-banner>
    `;
  }

  updateCondition(event: CustomEvent) {
    // update this condition
    let index = event.detail.fromIndex;

    let elements = this.shadowRoot?.querySelectorAll("cjaas-condition");

    if (elements) {
      this.conditions[index] = elements.item(index).value();
    }
  }

  addNewCondition(ev: Event, index: number) {
    let array = this.conditions.slice();

    array.splice(index + 1, 0, {
      type: undefined,
      param: undefined,
      operator: "AND",
    });

    this.conditions = array;
  }

  discardCondition(ev: Event, index: number) {
    let array = this.conditions.slice();

    array.splice(index, 1);

    this.conditions = array;
  }

  getPayloadTemplate() {
    if (this.triggerType === "Walk In") {
      return html`
        <div>
          <md-input id="walkin_agent_id" placeholder="Agent Id"></md-input>
          <md-input
            id="preferred_message"
            placeholder="Welcome Message"
          ></md-input>
        </div>
      `;
    } else if (this.triggerType === "Offer Image") {
      return html`
        <div>
          <md-input id="offer_url" placeholder="Image URL"></md-input>
          <md-input
            id="max_width"
            placeholder="Image Width (pixels)"
          ></md-input>
        </div>
      `;
    }
  }

  saveTrigger() {
    if (!this.triggerType) {
      this.errorMessage = "No Trigger Selected.";
      this.showErrorMessage = true;
      return;
    }

    // this.validateConditions()
    let conditions: CONDITION[][] = this.getConditions();
    let payload = this.getPayload();
    let triggerType = this.triggerType;

    let result: CONFIG = {
      conditions: conditions[0],
      triggerType,
      payload,
    };

    console.log(result);

    this.setSuccessMessage();
  }

  setSuccessMessage() {
    this.showSuccessMessage = true;
    this.showErrorMessage = false;
    // autodismiss message
    // cancellable does not allow it to be brought back ?
    setTimeout(() => {
      this.showSuccessMessage = false;
    }, 5000);
  }

  getPayload() {
    if (this.triggerType == "Offer Image") {
      let imageURL = (this.shadowRoot?.querySelector("#offer_url") as any)
        ?.value;
      let maxWidth = (this.shadowRoot?.querySelector("#max_width") as any)
        ?.value;

      return {
        imageURL,
        maxWidth,
      };
    } else if (this.triggerType === "Walk In") {
      let agentId = (this.shadowRoot?.querySelector("#walkin_agent_id") as any)
        ?.value;
      let welcomeMessage = (this.shadowRoot?.querySelector(
        "#preferred_message"
      ) as any)?.value;

      return {
        agentId,
        welcomeMessage,
      };
    }
  }

  getConditions() {
    let elements = this.shadowRoot?.querySelectorAll("cjaas-condition");
    let conditions: CONDITION[] = [];
    elements?.forEach((element) => {
      let value = element && element.value();
      if (value) {
        conditions.push(value);
      }
    });

    // array of conditions for future AND OR bucketing
    return [conditions];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "cjaas-action-builder": CjaasActionBuilder;
  }
}

export interface CONDITION {
  type: "DATA" | "SOURCE" | "EVENT";
  param: any;
  operator: "AND" | "OR";
}

export type triggerType = "Walk In" | "Offer Image";

export interface CONFIG {
  conditions: Array<CONDITION>;
  triggerType: triggerType;
  payload: any;
}
