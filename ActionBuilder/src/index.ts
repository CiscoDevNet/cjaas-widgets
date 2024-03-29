/**
 * Copyright (c) Cisco Systems, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// This file imports all of the webcomponents from "components" folder

import { html, internalProperty, property, LitElement, PropertyValues, query } from "lit-element";
import { customElementWithCheck } from "./mixins/CustomElementCheck";
import styles from "./assets/styles/action-builder.scss";

import "@momentum-ui/web-components/dist/comp/md-alert-banner";
import "@momentum-ui/web-components/dist/comp/md-button";
import "@momentum-ui/web-components/dist/comp/md-dropdown";
import "@momentum-ui/web-components/dist/comp/md-input";

import { nothing, TemplateResult } from "lit-html";
import "@cjaas/common-components/dist/comp/cjaas-condition-block";
import "@cjaas/common-components/dist/comp/cjaas-condition";

const SUPPORTED_TRIGGER_TYPES: triggerType[] = ["WebexWalkin", "AgentOffer", "Webhook", "IMIFlowTrigger", "ChatBot"];

@customElementWithCheck("cjaas-action-builder")
export default class CjaasActionBuilder extends LitElement {
  @property() mockAction: any;
  @property() mockTemplate: any;
  @property({ attribute: "action-name" }) actionName: string | undefined;
  @property({ attribute: "template-id" }) templateId: string | undefined;
  @property({ attribute: "action-read-sas-token" })
  actionReadSasToken: SASTOKEN = null;
  @property({ attribute: "action-write-sas-token" })
  actionWriteSasToken: SASTOKEN = null;
  @property({ attribute: "view-sas-token" }) viewSasToken: SASTOKEN = null;
  @property() bearerToken: any;
  @property() organizationId: any;
  @property() namespace: any;

  @property({ type: String, attribute: "base-url" }) baseUrl: string | undefined = undefined;
  @property() saveCallBack: any;

  @internalProperty() conditions: ConditionBlockInterface | undefined;

  @internalProperty() actionConfig: ACTION | undefined;
  @internalProperty() triggerType: triggerType | undefined;
  @internalProperty() showSuccessMessage = false;
  @internalProperty() showErrorMessage = false;
  @internalProperty() errorMessage = "";
  @internalProperty() _templateResponse: any;
  @internalProperty() optionsList: any[] = [];
  @internalProperty() readOnlyMode = false;
  @internalProperty() targets: ACTION["actionTriggers"] = [];
  @internalProperty() templateAPIInProgress = false;
  @internalProperty() actionAPIInProgress = false;

  @query("#action-name") actionNameElement: any;
  @query("#root-element") rootConditionBlockElement: any;
  disableSaveButton = false;

  updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);

    if (
      changedProperties.has("bearerToken") ||
      changedProperties.has("viewSasToken") ||
      changedProperties.has("templateId")
    ) {
      this.getTemplates()?.then((x: any) => {
        this._templateResponse = x;

        this.optionsList = x.attributes.map((y: any) => {
          y.idForAttribute = `'${y.event}','${y.metadata}','${y.aggregationMode}'`;

          return y;
        });
      });
    }

    if ((changedProperties.has("actionSasToken") || changedProperties.has("actionName")) && this.actionName) {
      this.getAction().then((x: ACTION) => {
        this.actionConfig = x;
        this.conditions = x.rules;
        this.targets = x.actionTriggers;

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
    let url = `${this.baseUrl}/v1/journey/actions/${this.actionName}`;

    if (this.mockAction) {
      return new Promise((resolve, reject) => {
        resolve(this.mockAction);
      });
    }

    const bearerToken = this.getBearerAuthorization();

    if (bearerToken) {
      url += `?organizationId=${this.organizationId}&namespaceName=${this.namespace}`;
    }

    this.actionAPIInProgress = true;

    return fetch(url, {
      headers: {
        Authorization: bearerToken || `SharedAccessSignature ${this.actionReadSasToken}`,
        "content-type": "application/json; charset=UTF-8",
      },
      method: "GET",
    })
      .then(x => {
        this.actionAPIInProgress = false;
        return x.json();
      })
      .then(x => x.data);
  }

  getBearerAuthorization() {
    if (this.bearerToken) {
      return `Bearer ${this.bearerToken}`;
    }
  }
  // fetch template from server or use mockTemplate
  getTemplates() {
    let url = `${this.baseUrl}/v1/journey/views/templates?id=${this.templateId}`;

    if (this.mockTemplate) {
      return new Promise((resolve, reject) => {
        resolve(this.mockTemplate);
      });
    }

    if (!this.baseUrl || (!this.bearerToken && !this.viewSasToken)) {
      return null;
    }

    this.templateAPIInProgress = true;

    const bearerToken = this.getBearerAuthorization();

    if (bearerToken) {
      url += `&organizationId=${this.organizationId}&namespaceName=${this.namespace}`;
    }

    return fetch(url, {
      headers: {
        Authorization: bearerToken || `SharedAccessSignature ${this.viewSasToken}`,
        "content-type": "application/json; charset=UTF-8",
      },
      method: "GET",
    })
      .then(x => {
        this.templateAPIInProgress = false;
        return x.json();
      })
      .then(x => x.data[0]);
  }

  // name input for action
  // templateid is formed from namespace-organization-actionName
  getNameInputTemplate() {
    return html`
      <div class="name-input-row">
        <p class="name-property-name">Action Name</p>
        <md-input
          .value=${this.actionConfig?.name || ""}
          id="action-name"
          placeholder="Enter a name for this action..."
          .required=${true}
        >
        </md-input>
      </div>
    `;
  }

  getEditActionTemplate() {
    let relation;
    if (this.conditions) {
      relation = typeof this.conditions !== "string" ? (this.conditions as MultiLineCondition)?.logic : "AND";
    }

    return html`
      <!-- <div class="header-row"><md-icon name="icon-location_32" size="24"></md-icon><span>Journey</span></div> -->
      ${this.renderRootConditionBlock(relation)}
      <div class="targets">
        ${this.getTargets()}
      </div>
      <div class="cta">
        <md-button color="green" .disabled=${this.disableSaveButton} @click=${() => this.saveTrigger()}>Save</md-button>
      </div>
      <md-alert-banner .show=${this.showSuccessMessage} type="default" message="Trigger Saved"></md-alert-banner>
      <md-alert-banner .show=${this.showErrorMessage} type="error" .message=${this.errorMessage}></md-alert-banner>
    `;
  }

  renderRootConditionBlock(relation: any) {
    return html`
      <cjaas-condition-block
        id="root-element"
        .root=${true}
        .innerRelation=${relation}
        .conditions=${this.conditions}
        .optionsList=${this.optionsList}
        @updated-condition=${(ev: CustomEvent) => this.updateConditions(ev)}
      >
      </cjaas-condition-block>
    `;
  }

  renderRootCondition() {
    return html`
      <cjaas-condition
        id="root-element"
        .index=${0}
        .dirty=${false}
        .condition=${(this.conditions as SingleLineCondition)?.condition}
        .relation=${"AND"}
        .optionsList=${this.optionsList}
      >
      </cjaas-condition>
    `;
  }

  updateConditions(event: CustomEvent) {
    const conditions = this.rootConditionBlockElement?.getValue();
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
        ${this.actionConfig?.name ? this.actionConfig?.name : this.getNameInputTemplate()}
      </div>
      <div>
        ${this.readOnlyMode && this.actionConfig?.name ? this.getReadOnlyTemplate() : this.getEditActionTemplate()}
      </div>
    `;
  }

  getActionSummary() {
    return html`
      <span class="title">Jouney</span>
      <div>
        ${this.getConditionBlockSummary(this.actionConfig?.rules as ConditionBlockInterface)}
      </div>
      <div class="targets-readonly">
        ${this.getTargetSummary()}
      </div>
    `;
  }

  getTargetSummary() {
    return this.actionConfig?.actionTriggers.map((x: any, i: number) => {
      let filler = "Then";
      if (i > 0) {
        filler = "and";
      }

      return html`
        <div class="target-summary"><span class="static">${filler} trigger</span> <b>${x.type}</b></div>
      `;
    });
  }

  getConditionBlockSummary(rules: ConditionBlockInterface | string, relation: string | null = null) {
    const innerRelation = typeof rules !== "string" ? rules?.logic : "AND";

    let conditionList: Array<TemplateResult> = [];

    if (typeof rules === "string") {
      conditionList = [this.getConditionSummary(rules)];
    } else if ((rules as MultiLineCondition).args) {
      const _rules: any = (rules as MultiLineCondition).args.map(
        (x: string | ConditionBlockInterface, index: number) => {
          if (this.isConditionBlock(x)) {
            return html`
              ${this.getConditionBlockSummary(x, innerRelation)}
            `;
          } else {
            return html`
              ${index > 0 ? innerRelation : ""} ${this.getConditionSummary(x as string | SingleLineCondition)}
            `;
          }
        }
      );
      conditionList.push(..._rules);
    } else if (rules.logic === "SINGLE") {
      conditionList.push(this.getConditionSummary(rules.condition));
    }

    let text = nothing;

    if (relation) {
      text = html`
        ${relation}
      `;
    }

    return html`
      <!-- pre block  -->
      ${text}${relation ? "(" : nothing}

      <!-- intedation starts for  -->
      <div class=${relation ? "intend" : nothing}>
        ${conditionList.map(
          (x: any, i: number) =>
            html`
              <div>${x}</div>
            `
        )}
      </div>
      ${relation ? `)` : nothing}
    `;
  }

  getConditionSummary(condition: string | SingleLineCondition) {
    const conditionAsString: string = (condition as SingleLineCondition)?.condition
      ? (condition as SingleLineCondition).condition
      : (condition as string);

    const [_original, field, operator, value] = conditionAsString?.match(/('.*')\s(.*?)\s(.*)/) || [];

    const _field = this.optionsList.find(x => x.idForAttribute === field)?.displayName || field;

    return html`
      <span class="static">if</span>
      <span class="field">&nbsp;${_field}&nbsp;</span>
      <span class="static">is</span>
      <span class="operator">${this.getReadableOperator(operator)}</span>
      ${value}
    `;
  }

  getReadableOperator(operator: any) {
    const operatorMap: any = {
      EQ: "equal to",
      NEQ: "not equal to",
      GTE: "greater than or equal to",
      GT: "greater than",
      LTE: "lesser than or equal to",
      LT: "lesser than",
      HAS: "containing",
    };

    return operatorMap[operator];
  }

  getFieldName(field: string) {
    const attribute = this.optionsList.find(x => x.metadata === field);
    return attribute?.displayName;
  }

  getReadOnlyTemplate() {
    return html`
      <div class="summary">${this.getActionSummary()}</div>
      <md-button class="edit-button" @click=${() => (this.readOnlyMode = false)}>Edit Action</md-button>
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
              this.setTargetType(ev.detail.option, 0);
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
              .selectedKey=${(x as any).type}
              placeholder="Target"
              @dropdown-selected=${(ev: any) => {
                this.setTargetType(ev.detail.option, i);
              }}
            >
            </md-dropdown>
            ${this.getPayloadTemplate(x.type as triggerType, x, i)}
            <md-tooltip message="Add Target" placement="top">
              <div class="add-below-icon">
                <md-icon name="icon-add_24" size="18" @click=${() => this.addNewTarget(i)}></md-icon>
              </div>
            </md-tooltip>
            <md-tooltip message="Delete Target" placement="top">
              <div class="delete-icon" @click=${() => this.deleteTarget(i)}>
                <md-icon name="icon-delete_24" size="18"></md-icon>
              </div>
            </md-tooltip>
          </div>
        `;
      });
    }
  }

  setTargetType(option: triggerType, index: number) {
    if (this.targets[index]) {
      this.targets[index].type = option;
    } else {
      this.targets[index] = {
        type: option,
      };
    }

    this.requestUpdate();
  }

  addNewTarget(index = 0) {
    this.setTarget();
    this.targets.splice(index + 1, 0, {
      type: undefined,
    });

    this.requestUpdate();
  }

  getElementByIndex(selector: string, index: number) {
    return this.shadowRoot?.querySelector(`.target-index-${index} ${selector}`);
  }

  deleteTarget(index: number) {
    this.setTarget();
    this.targets.splice(index, 1);
    this.requestUpdate();
  }

  getWalkinTemplate(config: any, index: number) {
    return html`
      <div class=${`target-index-${index}`}>
        <md-input
          id="walkin_agent_id"
          placeholder="Webex Teams Agent Id or SIP address"
          .value=${config?.agentId || null}
        ></md-input>
        <md-input id="interrupt_title" placeholder="Title" .value=${config?.title || null}></md-input>
        <md-input
          id="preferred_message"
          placeholder="Welcome Message"
          .value=${config?.welcomeMessage || null}
        ></md-input>
      </div>
    `;
  }

  getAgentOfferTemplate(config: any, index: number) {
    return html`
      <div class=${`target-index-${index}`}>
        <md-input id="offer_url" .value=${config?.imageURL || null} placeholder="Image URL"></md-input>
        <md-input
          id="max_width"
          type="number"
          .value=${config?.imageWidth || null}
          placeholder="Image Width (pixels)"
        ></md-input>
      </div>
    `;
  }

  getWebhookTemplate(config: any, index: number) {
    return html`
      <div class=${`webhook-target target-index-${index}`}>
        <md-input id="webhook_url" .value=${config?.webhookURL || null} placeholder="URL"></md-input>

        <md-dropdown
          id="webhook_httpverb"
          .options=${["get", "post"]}
          placeholder="HTTP Verb"
          .defaultOption=${config?.attributes?.httpverb || "get"}
        ></md-dropdown>

        <md-input
          id="webhook_request_body"
          .value=${config?.attributes?.requestbody || null}
          placeholder="Request Body"
        ></md-input>
        <md-input
          id="webhook_authorization_scheme"
          .value=${config?.attributes?.authorizationScheme || null}
          placeholder="Authorization Scheme"
        ></md-input>
        <md-input
          id="webhook_authorization"
          .value=${config?.attribute?.authorization || null}
          placeholder="Authorization"
        ></md-input>
      </div>
    `;
  }

  getIMIFlowTemplate(config: any, index: number) {
    return html`
      <div class=${`target-index-${index}`}>
        <md-input id="imi_flow_url" .value=${config?.flowURL || null} placeholder="IMI Flow URL"></md-input>
        <md-input id="imi_flow_id" .value=${config?.flowId || null} placeholder="IMI Flow Id"></md-input>
      </div>
    `;
  }

  getChatBotTemplate(config: any, index: number) {
    return html`
      <div class=${`target-index-${index}`}>
        <md-input id="chatbot_url" .value=${config?.botURL || null} placeholder="ChatBot URL"></md-input>
        <md-input
          id="chatbot_width"
          type="number"
          .value=${config?.botWidth || null}
          placeholder="ChatBot Width (pixels)"
        ></md-input>
      </div>
    `;
  }

  getPayloadTemplate(triggerType: triggerType | undefined, config: any, index: number) {
    if (triggerType === "WebexWalkin") {
      return this.getWalkinTemplate(config, index);
    } else if (triggerType === "AgentOffer") {
      return this.getAgentOfferTemplate(config, index);
    } else if (triggerType === "Webhook") {
      return this.getWebhookTemplate(config, index);
    } else if (triggerType === "IMIFlowTrigger") {
      return this.getIMIFlowTemplate(config, index);
    } else if (triggerType == "ChatBot") {
      return this.getChatBotTemplate(config, index);
    }
  }

  getNamespace(token: SASTOKEN) {
    const matches = token?.match(/sn=(.*?)&/);

    return matches && matches[1];
  }

  getOrganization(token: SASTOKEN) {
    const matches = token?.match(/so=(.*?)&/);

    return matches && matches[1];
  }

  isActionNamed(name: string) {
    if (!name || !name.trim()) {
      this.errorMessage = "Action is missing name.";
      this.showErrorMessage = true;
      return;
    }

    if (this.targets.length === 0 || this.targets[0].type === undefined) {
      this.errorMessage = "No Trigger Configured.";
      this.showErrorMessage = true;
      return;
    }

    return true;
  }

  areConditionsValid(conditions: ConditionBlockInterface) {
    const _name = this.actionNameElement?.value?.trim();
    if (!this.isActionNamed(_name || this.actionConfig?.name)) {
      return false;
    }

    const containsError = function(condition: MultiLineCondition) {
      let error;
      for (const x of (condition as MultiLineCondition)?.args) {
        if (!(x as MultiLineCondition).args) {
          continue;
        } else if ((x as MultiLineCondition).args.length < 2) {
          error = true;
          break;
        } else {
          const _error: any = containsError(x as MultiLineCondition);
          if (_error) {
            error = _error;
            break;
          }
        }
      }

      return error;
    };

    if ((conditions as MultiLineCondition).args) {
      const error = containsError(conditions as MultiLineCondition);

      if (error) {
        this.errorMessage = "A Block must have atleast 2 conditions";
        this.showErrorMessage = true;
        return false;
      }

      return true;
    }

    return true;
  }

  setTarget() {
    this.targets = this.targets?.map((x, i) => {
      return this.getPayload(x.type as triggerType, i);
    }) as ACTION["actionTriggers"];
  }

  saveTrigger() {
    this.conditions = this.getConditions();

    const _name = this.actionNameElement?.value?.trim();

    // any because filter is not recognized by TS type inference
    this.setTarget();
    const actionTriggers: any = this.targets.filter(x => !!x);

    // TODO:
    // implement an alert md dialog component
    if (!actionTriggers || actionTriggers.length === 0) {
      this.errorMessage = "No Actions configured";
      this.showErrorMessage = true;
      return;
    }

    if (!this.conditions || !this.areConditionsValid(this.conditions)) {
      return;
    }

    const result: ACTION = {
      organization: this.getOrganization(this.actionWriteSasToken) || "",
      namespace: this.getNamespace(this.actionWriteSasToken) || "",
      name: this.actionConfig?.name || _name,
      cooldownPeriodInMinutes: 1,
      active: this.actionConfig?.active || true,
      templateId: this.templateId as string,
      rules: this.conditions,
      actionTriggers,
    };

    this.postResult(result);
  }

  postResult(result: ACTION) {
    let url = `${this.baseUrl}/v1/journey/actions`;
    this.disableSaveButton = true;

    const bearerToken = this.getBearerAuthorization();

    if (bearerToken) {
      url += `?organizationId=${this.organizationId}&namespaceName=${this.namespace}`;
    }

    fetch(url, {
      headers: {
        Authorization: bearerToken || `SharedAccessSignature ${this.actionWriteSasToken}`,
        "content-type": "application/json; charset=UTF-8",
      },
      method: "POST",
      body: JSON.stringify(result),
    })
      .then(x => x.json())
      .then(
        x => {
          this.disableSaveButton = false;
          if (x.error) {
            this.errorMessage = x.error?.message[0]?.description;
            this.showErrorMessage = true;
          } else if (x) {
            this.setSuccessMessage();
          }
        },
        err => {
          this.disableSaveButton = false;

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
      this.saveCallBack?.();
    }, 5000);
  }

  getPayload(triggerType: triggerType, index: number): { type: triggerType; [key: string]: any } | undefined {
    if (triggerType == "AgentOffer") {
      return this.getAgentOfferPayload(index);
    } else if (triggerType === "WebexWalkin") {
      return this.getWebexWalkinPayload(index);
    } else if (triggerType === "Webhook") {
      return this.getWebhookPayload(index);
    } else if (triggerType === "IMIFlowTrigger") {
      return this.getIMIFlowPayload(index);
    } else if (triggerType === "ChatBot") {
      return this.getChatBotPayload(index);
    }
  }

  getAgentOfferPayload(index: number) {
    const imageURL = (this.getElementByIndex("#offer_url", index) as HTMLInputElement)?.value?.trim();
    const imageWidth = parseInt((this.getElementByIndex("#max_width", index) as HTMLInputElement)?.value || "0", 10);

    return {
      type: "AgentOffer" as triggerType,
      imageURL,
      imageWidth,
    };
  }

  getWebexWalkinPayload(index: number) {
    const agentId = (this.getElementByIndex("#walkin_agent_id", index) as HTMLInputElement)?.value?.trim();
    const welcomeMessage = (this.getElementByIndex("#preferred_message", index) as HTMLInputElement)?.value?.trim();
    const title = (this.getElementByIndex("#interrupt_title", index) as HTMLInputElement)?.value?.trim();

    return {
      type: "WebexWalkin" as triggerType,
      agentId,
      title,
      welcomeMessage,
    };
  }

  getWebhookPayload(index: number) {
    const webhookURL = (this.getElementByIndex("#webhook_url", index) as HTMLInputElement)?.value?.trim();
    const httpverb = (this.getElementByIndex("#webhook_httpverb", index) as any)?.selectedKey;
    const requestbody = (this.getElementByIndex("#webhook_request_body", index) as HTMLInputElement)?.value?.trim();
    const authorizationScheme = (this.getElementByIndex(
      "#webhook_authorization_scheme",
      index
    ) as HTMLInputElement)?.value?.trim();
    const authorization = (this.getElementByIndex("#webhook_authorization", index) as HTMLInputElement)?.value?.trim();

    return {
      type: "Webhook" as triggerType,
      webhookURL,
      attributes: {
        httpverb,
        requestbody,
        authorizationScheme,
        authorization,
      },
    };
  }

  getIMIFlowPayload(index: number) {
    const flowURL = (this.getElementByIndex("#imi_flow_url", index) as HTMLInputElement)?.value?.trim();

    const flowId = (this.getElementByIndex("#imi_flow_id", index) as HTMLInputElement)?.value?.trim();

    return {
      type: "IMIFlowTrigger" as triggerType,
      flowURL,
      flowId,
    };
  }

  getChatBotPayload(index: number) {
    const botURL = (this.getElementByIndex("#chatbot_url", index) as HTMLInputElement)?.value?.trim();

    const botWidth = parseInt((this.getElementByIndex("#chatbot_width", index) as HTMLInputElement)?.value, 10);

    return {
      type: "ChatBot" as triggerType,
      botURL,
      botWidth,
    };
  }

  getConditions() {
    const conditions = this.rootConditionBlockElement?.getValue();

    if (conditions?.error) {
      this.errorMessage = conditions.description;
      this.showErrorMessage = true;
      return;
    }

    if (typeof conditions === "string") {
      return {
        condition: conditions,
        logic: "SINGLE",
      };
    }

    return conditions;
  }

  isConditionBlock(x: any) {
    if (!x) {
      return false;
    }

    if (typeof x === "object" && x.args) {
      return true;
    }
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

export type triggerType = "WebexWalkin" | "Webhook" | "AgentOffer" | "ChatBot" | "IMIFlowTrigger";

export interface CONFIG {
  conditions: Array<CONDITION>;
  triggerType: triggerType;
  payload: any;
}

export type LogicalOperator = "OR" | "AND";
export type Comparator = "EQ" | "NEQ" | "GTE" | "GT" | "LTE" | "LT" | "HAS";
export interface ACTION {
  name: string;
  active: boolean;
  organization?: string;
  cooldownPeriodInMinutes: 1;
  namespace?: string; //"sandbox",
  templateId: string; // "xxx",
  rules: ConditionBlockInterface;
  actionTriggers: Array<{
    type: triggerType | undefined;
    [key: string]: any;
  }>;
}

export interface ConditionInterface {
  field: string;
  operator: Comparator;
  value: string;
}

type ConditionBlockInterface = MultiLineCondition | SingleLineCondition;

export interface MultiLineCondition {
  args: Array<string | ConditionBlockInterface>;
  logic: "AND" | "OR";
}

export interface SingleLineCondition {
  logic: "SINGLE";
  condition: string;
}

export type SASTOKEN = string | null | undefined;
