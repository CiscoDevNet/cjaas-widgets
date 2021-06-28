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
import { nothing } from "lit-html";

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
  @property({ attribute: "action-read-sas-token" })
  actionReadSasToken: SASTOKEN = null;
  @property({ attribute: "action-write-sas-token" })
  actionWriteSasToken: SASTOKEN = null;

  @property({ attribute: "view-sas-token" }) viewSasToken: SASTOKEN = null;

  @property({ type: String, attribute: "base-url" }) baseURL:
    | string
    | undefined = undefined;

  @internalProperty() conditions: ConditionBlockInterface = {};

  @internalProperty() actionConfig: ACTION | undefined;
  @internalProperty() triggerType: triggerType | undefined;
  @internalProperty() showSuccessMessage = false;
  @internalProperty() showErrorMessage = false;
  @internalProperty() errorMessage = "";
  @internalProperty() _templateResponse: any;
  @internalProperty() optionsList: any[] = [];
  @internalProperty() readOnlyMode = false;
  @internalProperty() targets: ACTION["actions"] = [];
  @internalProperty() templateAPIInProgress = false;
  @internalProperty() actionAPIInProgress = false;

  @query("#action-name") actionNameElement: any;
  @query("cjaas-condition-block") rootConditionBlockElement: any;

  // rootInnerRelation: "AND" | "OR" = "AND";

  updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);

    if (
      changedProperties.has("viewSasToken") ||
      changedProperties.has("templateId")
    ) {
      this.getTemplates()?.then((x: any) => {
        this._templateResponse = x;

        this.optionsList = x.attributes;
      });
    }

    if (
      (changedProperties.has("actionSasToken") ||
        changedProperties.has("actionName")) &&
      this.actionName
    ) {
      this.getAction().then((x: ACTION) => {
        this.actionConfig = x;
        this.conditions = x.rules;
        this.targets = x.actions;

        this.readOnlyMode = true;

        this.requestUpdate();
      });
    }
  }

  static get styles() {
    return styles;
  }

  // fetch action from server or use mockAction
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
        Authorization: `SharedAccessSignature ${this.actionReadSasToken}`,
        "content-type": "application/json; charset=UTF-8",
      },
      method: "GET",
    })
      .then((x) => {
        this.actionAPIInProgress = false;
        return x.json();
      })
      .then((x) => x.data);
  }

  // fetch template from server or use mockTemplate
  getTemplates() {
    let url = `${this.baseURL}/v1/views?id=${this.templateId}`;

    if (this.mockTemplate) {
      return new Promise((resolve, reject) => {
        resolve(this.mockTemplate);
      });
    }

    if (!this.baseURL || !this.viewSasToken) {
      return null;
    }

    this.templateAPIInProgress = true;

    return fetch(url, {
      headers: {
        Authorization: `SharedAccessSignature ${this.viewSasToken}`,
        "content-type": "application/json; charset=UTF-8",
      },
      method: "GET",
    })
      .then((x) => {
        this.templateAPIInProgress = false;
        return x.json();
      })
      .then((x) => x.data);
  }

  // name input for action
  // templateid is formed from namespace-organization-actionName
  getNameInputTemplate() {
    return html`
      <md-input
        .value=${this.actionConfig?.name || ""}
        id="action-name"
        placeholder="Action Name"
        .helpText=${this.actionConfig?.name
          ? ""
          : "Action Name cannot be changed later!"}
      >
      </md-input>
    `;
  }

  getEditActionTemplate() {
    let relation = <"AND" | "OR">Object.keys(this.conditions || {})[0];

    return html`
      <div>
        <md-icon name="icon-location_32" size="24"></md-icon
        ><span>Journey</span>
      </div>

      <cjaas-condition-block
        .root=${true}
        .innerRelation=${relation}
        .conditions=${this.conditions && this.conditions[relation]
          ? this.conditions[relation]
          : []}
        .optionsList=${this.optionsList}
        @updated-condition=${(ev: CustomEvent) => this.updateConditions(ev)}
      >
      </cjaas-condition-block>

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

  updateConditions(event: CustomEvent) {
    let conditions = this.rootConditionBlockElement?.getValue();
    if (conditions) {
      this.conditions = conditions;
    }
  }

  // Readonly view should showup when editing an action
  render() {
    if (this.templateAPIInProgress || this.actionAPIInProgress) {
      return html`
        <div class="spinner-container">
          <md-spinner></md-spinner>
        </div>
      `;
    }

    return html`
      <div class="name-container">
        ${this.actionConfig?.name
          ? this.actionConfig?.name
          : this.getNameInputTemplate()}
      </div>
      <div>
        ${this.readOnlyMode && this.actionConfig?.name
          ? this.getReadOnlyTemplate()
          : this.getEditActionTemplate()}
      </div>
    `;
  }

  getActionSummary() {
    return html`
      Jouney
      <div>
        ${this.getConditionBlockSummary(this.actionConfig?.rules)}
      </div>
      <div class="targets-readonly">
        ${this.getTargetSummary()}
      </div>
    `;
  }

  getTargetSummary() {
    return this.actionConfig?.actions.map((x: any, i: number) => {
      let filler = "then";
      if (i > 0) {
        filler = "and";
      }

      return html`
        <div class="target-summary">
          ${filler} trigger <b>${x.actionType}</b>
        </div>
      `;
    });
  }

  getConditionBlockSummary(rules: any, relation: string | null = null) {
    let innerRelation = Object.keys(rules)[0];

    let conditionList = rules[innerRelation].map((x: any) => {
      if (this.isConditionBlock(x)) {
        return html`
          ${this.getConditionBlockSummary(x, innerRelation)}
        `;
      } else {
        return html`
          ${this.getConditionSummary(x)}
        `;
      }
    });

    let text = nothing;

    if (relation) {
      text = html`
        ${relation}
      `;
    }

    return html`
      ${text}${relation ? "(" : nothing}

      <div class=${relation ? "intend" : nothing}>
        ${conditionList.map(
          (x: any, i: number) =>
            html`
              <div>${x} ${i === conditionList.length - 1 ? nothing : text}</div>
            `
        )}
      </div>
      ${relation ? ")" : nothing}
    `;
  }

  getConditionSummary(condition: {
    field: string;
    operator: string;
    value: string;
  }) {
    return html`
      if ${this.getFieldName(condition.field)} is
      ${this.getReadableOperator(condition.operator)} ${condition.value}
    `;
  }

  getReadableOperator(operator: any) {
    let operatorMap: any = {
      EQ: "equal to",
      NEQ: "not equal to",
      GTE: "greater than or equal to",
      GT: "greater than",
      LTE: "lesser than or equal to",
      LT: "lesser than",
    };

    return operatorMap[operator];
  }

  isConditionBlock(x: any) {
    let keys = Object.keys(x);

    if (["AND", "OR"].indexOf(keys[0]) !== -1) {
      return true;
    }
  }

  getFieldName(field: string) {
    let attribute = this.optionsList.find((x) => x.metadata === field);
    return attribute?.displayName;
  }

  getReadOnlyTemplate() {
    return html`
      <div>${this.getActionSummary()}</div>
      <md-button class="edit-button" @click=${() => (this.readOnlyMode = false)}
        >Edit Action</md-button
      >
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
              .selectedKey=${<any>x.actionType}
              placeholder="Target"
              @dropdown-selected=${(ev: any) => {
                this.setTarget(ev.detail.option, i);
              }}
            >
            </md-dropdown>
            ${this.getPayloadTemplate(
              <triggerType>x.actionType,
              x.actionConfig
            )}
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
      this.targets[index].actionType = option;
    } else {
      this.targets[index] = {
        actionType: option,
        actionConfig: {},
      };
    }

    this.requestUpdate();
  }

  addNewTarget(index: number = 0) {
    this.targets.splice(index + 1, 0, {
      actionType: undefined,
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
          .value=${config?.nickname || null}
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
          type="number"
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
          .value=${config.botURL || null}
          placeholder="ChatBot URL"
        ></md-input>
        <md-input
          id="chatbot_width"
          type="number"
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

  getNamespace(token: SASTOKEN) {
    let matches = token?.match(/sn=(.*?)\&/);

    return matches && matches[1];
  }

  getOrganization(token: SASTOKEN) {
    let matches = token?.match(/so=(.*?)&/);

    return matches && matches[1];
  }

  saveTrigger() {
    this.conditions = this.getConditions();

    if (this.targets.length === 0 || this.targets[0].actionType === undefined) {
      this.errorMessage = "No Trigger Configured.";
      this.showErrorMessage = true;
      return;
    }

    // TODO:
    // Add more validations
    // this.validateConditions()
    let _name = this.actionNameElement?.value?.trim();

    // any because filter is not recognized by TS type inference
    const actions: any = this.targets
      ?.map((x) => {
        return this.getPayload(<triggerType>x.actionType) || null;
      })
      .filter((x) => !!x);

    // TODO:
    // implement an alert md dialog component
    if (!actions || actions.length === 0) {
      alert("No Actions configured");
      return;
    }

    let result: ACTION = {
      organization: this.getOrganization(this.actionWriteSasToken) || "",
      namespace: this.getNamespace(this.actionWriteSasToken) || "",
      name: this.actionConfig?.name || _name,
      version: this.actionConfig?.version || "1.0",
      active: this.actionConfig?.active || true,
      templateId: <string>this.templateId,
      rules: this.conditions,
      actions,
    };

    this.postResult(result);
  }

  postResult(result: ACTION) {
    let url = `${this.baseURL}/v1/journey/actions`;

    fetch(url, {
      headers: {
        Authorization: `SharedAccessSignature ${this.actionWriteSasToken}`,
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
  ): { actionType: triggerType; actionConfig: any } | undefined {
    if (triggerType == "AgentOffer") {
      return this.getAgentOfferPayload();
    } else if (triggerType === "WebexWalkin") {
      return this.getWebexWalkinPayload();
    } else if (triggerType === "WebhookTrigger") {
      return this.getWebhookPayload();
    } else if (triggerType === "IMIFlowTrigger") {
      return this.getIMIFlowPayload();
    } else if (triggerType === "ChatBot") {
      return this.getChatBotPayload();
    }
  }

  getAgentOfferPayload() {
    let imageURL = (<HTMLInputElement>(
      this.shadowRoot?.querySelector("#offer_url")
    ))?.value?.trim();
    let imageWidth = (<HTMLInputElement>(
      this.shadowRoot?.querySelector("#max_width")
    ))?.value;

    return {
      actionType: "AgentOffer" as triggerType,
      actionConfig: {
        imageURL,
        imageWidth,
      },
    };
  }

  getWebexWalkinPayload() {
    let agentId = (<HTMLInputElement>(
      this.shadowRoot?.querySelector("#walkin_agent_id")
    ))?.value?.trim();
    let welcomeMessage = (<HTMLInputElement>(
      this.shadowRoot?.querySelector("#preferred_message")
    ))?.value?.trim();
    let nickname = (<HTMLInputElement>(
      this.shadowRoot?.querySelector("#walkin_agent_name")
    ))?.value?.trim();

    return {
      actionType: "WebexWalkin" as triggerType,
      actionConfig: {
        agentId,
        nickname,
        welcomeMessage,
      },
    };
  }

  getWebhookPayload() {
    const url = (<HTMLInputElement>(
      this.shadowRoot?.querySelector("#webhook_url")
    ))?.value?.trim();

    return {
      actionType: "WebhookTrigger" as triggerType,
      actionConfig: {
        url,
      },
    };
  }

  getIMIFlowPayload() {
    const url = (<HTMLInputElement>(
      this.shadowRoot?.querySelector("#imi_flow_url")
    ))?.value?.trim();

    return {
      actionType: "IMIFlowTrigger" as triggerType,
      actionConfig: {
        url,
      },
    };
  }

  getChatBotPayload() {
    const botURL = (<HTMLInputElement>(
      this.shadowRoot?.querySelector("#chatbot_url")
    ))?.value?.trim();

    const botWidth = (<HTMLInputElement>(
      this.shadowRoot?.querySelector("#chatbot_width")
    ))?.value;

    return {
      actionType: "ChatBot" as triggerType,
      actionConfig: {
        botURL,
        botWidth,
      },
    };
  }

  getConditions() {
    let conditions = this.rootConditionBlockElement?.getValue();

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
  organization?: string;
  namespace?: string; //"sandbox",
  templateId: string; // "xxx",
  rules: ConditionBlockInterface;
  actions: Array<{
    actionType: string | undefined;
    actionConfig: any;
  }>;
}

export interface ConditionInterface {
  field: string;
  operator: Comparator;
  value: string;
}

export interface ConditionBlockInterface {
  [key: string]: Array<ConditionInterface | ConditionBlockInterface>;
}

export type SASTOKEN = string | null | undefined;
