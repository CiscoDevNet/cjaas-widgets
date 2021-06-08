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
  query,
} from "lit-element";
import { customElementWithCheck } from "./mixins/CustomElementCheck";
import styles from "./assets/styles/action-builder.scss";

import "@momentum-ui/web-components/dist/comp/md-alert-banner";
import "@momentum-ui/web-components/dist/comp/md-button";
import "@momentum-ui/web-components/dist/comp/md-dropdown";

const SUPPORTED_TRIGGER_TYPES: triggerType[] = [
  "WebexWalkin",
  "AgentOffer",
  "WebhookTrigger",
  "IMIFlowTrigger",
  "ChatBot",
];
@customElementWithCheck("cjaas-action-builder")
export default class CjaasActionBuilder extends LitElement {
  @property() mockAction: any;
  @property() mockTemplate: any;
  @property({ attribute: "action-id" }) actionName: string | undefined;
  @property({ attribute: "template-id" }) templateId: string | undefined;
  @property({ attribute: "sas-token" }) sasToken:
    | string
    | null
    | undefined = null;

  @property({ type: String, attribute: "base-url" }) baseURL:
    | string
    | undefined = undefined;

  @internalProperty() conditions: ACTION["rules"] = {};

  defaultCondition: any;
  actionPayload: any;

  @internalProperty() actionConfig: ACTION | undefined;
  @internalProperty() triggerType: triggerType | undefined;
  @internalProperty() showSuccessMessage = false;
  @internalProperty() showErrorMessage = false;
  @internalProperty() errorMessage = "";
  @internalProperty() _templateResponse: any;
  @internalProperty() conditionTypes: any[] = [];

  @query(".action-name") actionNameElement: any;
  @internalProperty() targets: ACTION["actions"] = [];
  @internalProperty() templateAPIInProgress = false;
  @internalProperty() actionAPIInProgress = false;

  updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);

    if (
      changedProperties.has("sasToken") ||
      changedProperties.has("templateId")
    ) {
      this.getTemplates()?.then((x: any) => {
        this._templateResponse = x;

        this.conditionTypes = x.attributes;
      });
    }

    if (
      changedProperties.has("sasToken") ||
      changedProperties.has("actionId")
    ) {
      this.getAction().then((x: ACTION) => {
        this.actionConfig = x;
        this.conditions = x.rules;
        this.targets = x.actions;

        this.requestUpdate();
      });
    }
  }

  static get styles() {
    return styles;
  }

  getAction(): Promise<ACTION> {
    let url = `${this.baseURL}/v1/journey/actions/${this.actionName}`;

    if (this.mockAction) {
      return new Promise((resolve, reject) => {
        resolve(this.mockAction);
      });
    }

    this.actionAPIInProgress = true;

    return fetch(url, {
      headers: {
        Authorization: `SharedAccessSignature ${this.sasToken}`,
        "content-type": "application/json; charset=UTF-8",
      },
      method: "GET",
    }).then((x) => {
      this.actionAPIInProgress = false;
      return x.json();
    });
  }

  getTemplates() {
    let url = `${this.baseURL}/v1/views?id=${this.templateId}`;

    if (this.mockTemplate) {
      return new Promise((resolve, reject) => {
        resolve(this.mockTemplate);
      });
    }

    if (!this.baseURL || !this.sasToken) {
      return null;
    }

    this.templateAPIInProgress = true;

    return fetch(url, {
      headers: {
        Authorization: `SharedAccessSignature ${this.sasToken}`,
        "content-type": "application/json; charset=UTF-8",
      },
      method: "GET",
    }).then((x) => {
      this.templateAPIInProgress = false;
      return x.json();
    });
  }

  render() {
    let relation = <"AND" | "OR">Object.keys(this.conditions || {})[0];

    if (this.templateAPIInProgress || this.actionAPIInProgress) {
      return html`
        <md-spinner></md-spinner>
      `;
    }

    return html`
      <div class="name-container">
        <md-input
          .disabled=${!!this.actionConfig?.name}
          .value=${this.actionConfig?.name || ""}
          id="action-name"
          .helpText=${this.actionConfig?.name
            ? ""
            : "This cannot be changed later!"}
        >
        </md-input>
      </div>
      <div>
        <md-icon name="icon-location_32" size="24"></md-icon
        ><span>Journey</span>
      </div>

      <cjaas-condition-block
        .root=${true}
        .innerRelation=${relation}
        .conditions=${this.conditions[relation]}
        .conditionTypes=${this.conditionTypes}
      ></cjaas-condition-block>

      <div class="targets">
        ${this.getTargets()}
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

  getTargets() {
    if (this.targets.length === 0) {
      return html`
        <div class="target-container">
          <md-icon name="icon-flag_24" size="18"></md-icon>
          then trigger
          <md-dropdown
            .options=${SUPPORTED_TRIGGER_TYPES}
            placeholder="Target"
            @dropdown-selected=${(ev: any) => {
              this.setTarget(ev.detail.option, 0);
            }}
          ></md-dropdown>
        </div>
      `;
    } else {
      return this.targets.map((x, i) => {
        return html`
          <div class="target-container">
            <md-icon name="icon-flag_24" size="18"></md-icon>
            ${i === 0 ? "then" : "and"} trigger
            <md-dropdown
              .options=${SUPPORTED_TRIGGER_TYPES}
              .selectedKey=${<any>x.type}
              placeholder="Target"
              @dropdown-selected=${(ev: any) => {
                this.setTarget(ev.detail.option, i);
              }}
            >
            </md-dropdown>
            ${this.getPayloadTemplate(<triggerType>x.type, x.actionConfig)}
            <div class="add-below-icon" title="Add New Condition">
              <md-icon
                name="icon-add_24"
                size="18"
                @click=${() => this.addNewTarget(i)}
              ></md-icon>
            </div>
            <div
              class="delete-icon"
              title="Delete Condition"
              @click=${() => this.deleteTarget(i)}
            >
              <md-icon name="icon-delete_24" size="18"></md-icon>
            </div>
          </div>
        `;
      });
    }
  }

  setTarget(option: string, index: number) {
    if (this.targets[index]) {
      this.targets[index].type = option;
    } else {
      this.targets[index] = {
        type: option,
        actionConfig: {},
      };
    }

    this.requestUpdate();
  }

  addNewTarget(index: number = 0) {
    this.targets.splice(index + 1, 0, {
      type: undefined,
      actionConfig: undefined,
    });

    this.requestUpdate();
  }

  deleteTarget(index: number) {
    this.targets.splice(index, 1);
    this.requestUpdate();
  }

  getWalkinTemplate(config: any) {
    return html`
      <div>
        <md-input
          id="walkin_agent_id"
          placeholder="Agent Id"
          .value=${config?.agentId || null}
        ></md-input>
        <md-input
          id="walkin_agent_name"
          placeholder="Nick Name"
          .value=${config?.nickName || null}
        ></md-input>
        <md-input
          id="preferred_message"
          placeholder="Welcome Message"
          .value=${config?.welcomeMessage || null}
        ></md-input>
      </div>
    `;
  }

  getAgentOfferTemplate(config: any) {
    return html`
      <div>
        <md-input
          id="offer_url"
          .value=${config?.imageURL || null}
          placeholder="Image URL"
        ></md-input>
        <md-input
          id="max_width"
          .value=${config?.imageWidth || null}
          placeholder="Image Width (pixels)"
        ></md-input>
      </div>
    `;
  }

  getWebhookTemplate(config: any) {
    return html`
      <div>
        <md-input
          id="webhook_url"
          .value=${config?.url || null}
          placeholder="URL"
        ></md-input>
      </div>
    `;
  }

  getIMIFlowTemplate(config: any) {
    return html`
      <md-input
        id="imi_flow_url"
        .value=${config?.url || null}
        placeholder="IMI FLOW URL"
      ></md-input>
    `;
  }

  getChatBotTemplate(config: any) {
    return html`
      <div>
        <md-input
          id="chatbot_url"
          .value=${config.botUrl || null}
          placeholder="ChatBot URL"
        ></md-input>
        <md-input
          id="chatbot_width"
          .value=${config?.botWidth || null}
          placeholder="ChatBot Width (pixels)"
        ></md-input>
      </div>
    `;
  }

  getPayloadTemplate(triggerType: triggerType | undefined, config: any) {
    if (triggerType === "WebexWalkin") {
      return this.getWalkinTemplate(config);
    } else if (triggerType === "AgentOffer") {
      return this.getAgentOfferTemplate(config);
    } else if (triggerType === "WebhookTrigger") {
      return this.getWebhookTemplate(config);
    } else if (triggerType === "IMIFlowTrigger") {
      return this.getIMIFlowTemplate(config);
    } else if (triggerType == "ChatBot") {
      return this.getChatBotTemplate(config);
    }
  }

  saveTrigger() {
    this.conditions = this.getConditions();

    if (this.targets.length === 0 || this.targets[0].type === undefined) {
      this.errorMessage = "No Trigger Configured.";
      this.showErrorMessage = true;
      return;
    }

    // this.validateConditions()
    let _name = this.actionNameElement?.value.trim();

    let result: ACTION = {
      name: this.actionConfig?.name || _name,
      version: this.actionConfig?.version || "1.0",
      active: this.actionConfig?.active || true,
      templateId: <string>this.templateId,
      rules: this.conditions,
      actions: this.targets
        .map((x) => {
          return this.getPayload(<triggerType>x.type);
        })
        .filter((x) => x),
    };

    this.postResult(result);
  }

  postResult(result: ACTION) {
    let url = `${this.baseURL}/v1/journey/actions`;

    fetch(url, {
      headers: {
        Authorization: `SharedAccessSignature ${this.sasToken}`,
        "content-type": "application/json; charset=UTF-8",
      },
      method: "POST",
      body: JSON.stringify(result),
    }).then(
      (x) => {
        if (x) {
          this.setSuccessMessage();
        }
      },
      (err) => {
        this.showErrorMessage = true;
        console.log(err);
      }
    );
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

  getPayload(
    triggerType: triggerType
  ): { type: triggerType; actionConfig: any } {
    if (triggerType == "AgentOffer") {
      let imageURL = (<HTMLInputElement>(
        this.shadowRoot?.querySelector("#offer_url")
      ))?.value.trim();
      let imageWidth = (<HTMLInputElement>(
        this.shadowRoot?.querySelector("#max_width")
      ))?.value.trim();

      return {
        type: triggerType,
        actionConfig: {
          imageURL,
          imageWidth,
        },
      };
    } else if (triggerType === "WebexWalkin") {
      let agentId = (<HTMLInputElement>(
        this.shadowRoot?.querySelector("#walkin_agent_id")
      ))?.value.trim();
      let welcomeMessage = (<HTMLInputElement>(
        this.shadowRoot?.querySelector("#preferred_message")
      ))?.value.trim();
      let nickName = (<HTMLInputElement>(
        this.shadowRoot?.querySelector("#walkin_agent_name")
      ))?.value.trim();

      return {
        type: triggerType,
        actionConfig: {
          agentId,
          nickName,
          welcomeMessage,
        },
      };
    } else if (triggerType === "WebhookTrigger") {
      const url = (<HTMLInputElement>(
        this.shadowRoot?.querySelector("#webhook_url")
      ))?.value.trim();

      return {
        type: triggerType,
        actionConfig: {
          url,
        },
      };
    } else if (triggerType === "IMIFlowTrigger") {
      const url = (<HTMLInputElement>(
        this.shadowRoot?.querySelector("#imi_flow_url")
      ))?.value.trim();

      return {
        type: triggerType,
        actionConfig: {
          url,
        },
      };
    } else {
      //(triggerType === "ChatBot")
      const botUrl = (<HTMLInputElement>(
        this.shadowRoot?.querySelector("#chatbot_url")
      ))?.value.trim();

      const botWidth = (<HTMLInputElement>(
        this.shadowRoot?.querySelector("#chatbot_width")
      ))?.value.trim();

      return {
        type: triggerType,
        actionConfig: {
          botUrl,
          botWidth,
        },
      };
    }
  }

  getConditions() {
    let element = this.shadowRoot?.querySelector("cjaas-condition-block");
    let conditions: ACTION["rules"] = <ACTION["rules"]>element?.getValue();

    return conditions;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "cjaas-action-builder": CjaasActionBuilder;
  }
}

export interface CONDITION {
  type: string;
  param: any;
  operator: "AND" | "OR";
}

export type triggerType =
  | "WebexWalkin"
  | "WebhookTrigger"
  | "AgentOffer"
  | "ChatBot"
  | "IMIFlowTrigger";

export interface CONFIG {
  conditions: Array<CONDITION>;
  triggerType: triggerType;
  payload: any;
}

export type LogicalOperator = "OR" | "AND";
export type Comparator = "EQ" | "NEQ" | "GTE" | "GT" | "LTE" | "LT";
export interface ACTION {
  name: string;
  version: string;
  active: boolean;
  org?: string;
  namespace?: string; //"sandbox",
  templateId: string; // "xxx",
  rules: {
    [key: string]: Array<{
      field: string;
      operator: Comparator;
      value: string;
    }>;
  };
  actions: Array<{
    type: string | undefined;
    actionConfig: any;
  }>;
}
