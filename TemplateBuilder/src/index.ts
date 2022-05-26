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
import styles from "./assets/styles/template-builder.scss";

import "@momentum-ui/web-components/dist/comp/md-alert-banner";
import "@momentum-ui/web-components/dist/comp/md-button";
import "@momentum-ui/web-components/dist/comp/md-dropdown";
import "@momentum-ui/web-components/dist/comp/md-input";
import "@momentum-ui/web-components/dist/comp/md-tooltip";
import { nothing } from "lit-html";
import { JourneyEvent } from "./types/cjaas";
import { Dropdown } from "@momentum-ui/web-components";

const metadataTypes = ["string", "integer", "double", "utc_datetime"];
const lookbackPeriodTypes = ["days", "hours", "minutes"];
const displayTypes = ["table", "tab"];
const aggregationModes = ["Value", "Count", "Sum", "Max", "Min", "Average", "Distinct"];
const defaultAttribute: Attribute = {
  version: "0.1",
  event: "",
  metadataType: "string",
  metadata: null,
  limit: 1,
  displayName: "",
  lookbackDurationType: "days",
  lookbackPeriod: 50,
  aggregationMode: "Value",
  eventDataAggregators: null,
  widgetAttributes: { type: "table" },
  verbose: false,
};

@customElementWithCheck("cjaas-template-builder")
export default class CjaasTemplateBuilder extends LitElement {
  @property() mockAction: any;
  @property() mockTemplate: any;
  @property({ attribute: "template-id" }) templateId: string | undefined;
  @property({ attribute: "profile-read-sas-token" })
  profileReadSasToken: SASTOKEN = null;
  @property({ attribute: "profile-write-sas-token" })
  profileWriteSasToken: SASTOKEN = null;
  @property({ attribute: "tape-read-sas-token" })
  tapeReadSasToken: SASTOKEN = null;

  @property() bearerToken: any = null;
  @property() organization: any = null;
  @property() namespace: any = null;

  @property({ type: String, attribute: "base-url" }) baseURL: string | undefined = undefined;
  @property() saveCallBack: any = null;
  @internalProperty() readOnlyMode = false;
  @internalProperty() templateAPIInProgress = false;
  @internalProperty() templateSaveAPIInProgress = false;
  @internalProperty() streamAPIInProgress = false;
  @internalProperty() template: any = null;
  @internalProperty() tapeEvents: Array<JourneyEvent> | null = null;
  @internalProperty() templateAttributes: Array<Attribute> = [{ ...defaultAttribute }];

  @query("#template-name") nameInput: any;
  @internalProperty() nameRequiredError: boolean = false;
  @internalProperty() nameDuplicateError: boolean = false;
  @internalProperty() saveStatus: boolean = false;
  @internalProperty() saveError: any;

  existingTemplateNames: string[] = [];

  disableSaveButton = false;
  scriptAdded = false;

  updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);
    if (changedProperties.has("bearerToken") || changedProperties.has("profileReadSasToken")) {
      this.getTemplateNames().then((names: string[]) => {
        this.existingTemplateNames = names.filter(x => x != this.templateId);
      });
    }

    if (
      (changedProperties.has("bearerToken") ||
        changedProperties.has("profileReadSasToken") ||
        changedProperties.has("templateId")) &&
      this.templateId
    ) {
      this.templateAPIInProgress = true;
      this.readOnlyMode = true;
      this.getTemplate()?.then(
        (template: any) => {
          this.templateAPIInProgress = false;
          this.template = template;
          this.templateAttributes = template.attributes;
        },
        err => {
          console.log(err);
        }
      );
    }

    if (changedProperties.has("bearerToken") || changedProperties.has("tapeReadSasToken")) {
      this.getTapeEvents().then((events: Array<JourneyEvent>) => {
        this.tapeEvents = events;
        this.requestUpdate();
      });
    }
  }

  static get styles() {
    return styles;
  }

  getBearerAuthorization() {
    if (this.bearerToken) {
      return `Bearer ${this.bearerToken}`;
    } else {
      return null;
    }
  }

  profileSourceScript() {
    if (this.scriptAdded) {
      return;
    }

    this.scriptAdded = true;
    let script = document.createElement("script");
    script.id = "profile-component";
    // script.onload = (this as any).onLoad.bind(this);
    script.src = "https://cjaas.cisco.com/web-components/v9/profile-5.1.0.js";
    return script;
  }

  // fetch action from server or use mockAction
  getTapeEvents(): Promise<Array<JourneyEvent>> {
    let url = `${this.baseURL}/streams/v1/journey/historic`;

    if (this.mockAction) {
      return new Promise((resolve, reject) => {
        resolve(this.mockAction);
      });
    }
    let bearerToken = this.getBearerAuthorization();

    if (bearerToken) {
      url += `?organization=${this.organization}&namespace=${this.namespace}`;
    }

    return fetch(url, {
      headers: {
        Authorization: bearerToken || `SharedAccessSignature ${this.tapeReadSasToken}`,
        "content-type": "application/json; charset=UTF-8",
      },
      method: "GET",
    })
      .then(response => response.json())
      .then(data => data.events);
  }

  getTemplateNames() {
    let url = `${this.baseURL}/v1/journey/views/templates`;

    let bearerToken = this.getBearerAuthorization();

    if (bearerToken) {
      url += `?organization=${this.organization}&namespace=${this.namespace}`;
    }

    return fetch(url, {
      headers: {
        Authorization: bearerToken || `SharedAccessSignature ${this.profileReadSasToken}`,
        "content-type": "application/json; charset=UTF-8",
      },
      method: "GET",
    })
      .then(response => response.json())
      .then(response => response.data.map((template: any) => template.name));
  }

  // fetch template from server or use mockTemplate
  getTemplate() {
    let url = `${this.baseURL}/v1/journey/views/templates?id=${this.templateId}`;

    if (this.mockTemplate) {
      return new Promise((resolve, reject) => {
        resolve(this.mockTemplate);
      });
    }

    if ((!this.bearerToken && !this.profileReadSasToken) || !this.baseURL) {
      return null;
    }

    let bearerToken = this.getBearerAuthorization();

    if (bearerToken) {
      url += `&organization=${this.organization}&namespace=${this.namespace}`;
    }

    this.templateAPIInProgress = true;

    return fetch(url, {
      headers: {
        Authorization: bearerToken || `SharedAccessSignature ${this.profileReadSasToken}`,
        "content-type": "application/json; charset=UTF-8",
      },
      method: "GET",
    })
      .then(response => {
        this.templateAPIInProgress = false;
        return response.json();
      })
      .then(json => {
        if (json.error) {
          throw new Error(json.error.message[0].description);
        } else {
          return json.data[0];
        }
      });
  }

  // name input for template
  getNameInputTemplate() {
    let messages: any = [];
    if (this.nameRequiredError) {
      messages.push({ type: "error", message: "Name is mandatory to save" });
    } else if (this.nameDuplicateError) {
      messages.push({ type: "error", message: "Name already exists" });
    }

    return html`
      <md-input id="template-name" placeholder="Template Name" .required=${true} .messageArr=${messages}> </md-input>
    `;
  }

  updateTemplateAttribute(value: { data: string; key: keyof Attribute | "displayType"; index: number }) {
    const { data, key, index } = value;
    const dupAttributes = this.templateAttributes?.slice();

    if (key === "displayType") {
      dupAttributes[index].widgetAttributes = { type: data as "table" | "tab" };
      if (data === "tab") {
        dupAttributes[index].verbose = true;
      } else {
        dupAttributes[index].verbose = false;
      }
    } else if (key == "limit" || (key == "lookbackPeriod" && data.match(/^\d+$/))) {
      dupAttributes[index][key] = parseInt(data, 10);
    } else {
      (dupAttributes[index] as any)[key] = data;
    }

    this.templateAttributes = dupAttributes;
  }

  deleteAttribute(index: number) {
    if (this.templateAttributes[index] && this.templateAttributes.length > 1) {
      const _dupcliateAttributes = this.templateAttributes.slice();
      _dupcliateAttributes.splice(index, 1);

      this.templateAttributes = _dupcliateAttributes;
    } else if (this.templateAttributes.length === 1) {
      this.templateAttributes = [{ ...defaultAttribute }];
    }
  }

  getAttributeRow(attribute: Attribute, index: number) {
    return html`
      <tr @attribute-updated=${(ev: CustomEvent) => this.updateTemplateAttribute(ev.detail)}>
        <td class="delete-cell">
          <md-tooltip message="Delete Attribute">
            <md-button circle hasRemoveStyle @click=${() => this.deleteAttribute(index)}>
              <md-icon name="icon-delete_24" size="18"></md-icon>
            </md-button>
          </md-tooltip>
        </td>
        <td>
          <md-input
            value=${attribute.displayName}
            @input-change=${(ev: CustomEvent) =>
              this.updateTemplateAttribute({
                data: (ev?.target as any)?.value?.trim(),
                key: "displayName",
                index,
              })}
          ></md-input>
        </td>
        <td>
          <md-input
            value=${attribute.event}
            @input-change=${(ev: Event) =>
              this.updateTemplateAttribute({
                data: (ev?.target as any)?.value?.trim(),
                key: "event",
                index,
              })}
          ></md-input>
        </td>
        <td>
          <md-input
            value=${attribute.metadata || ""}
            @input-change=${(ev: Event) =>
              this.updateTemplateAttribute({
                data: (ev?.target as any)?.value?.trim(),
                key: "metadata",
                index,
              })}
          ></md-input>
        </td>
        <td>
          <md-dropdown
            .defaultOption=${attribute.metadataType}
            .options=${metadataTypes}
            @dropdown-selected="${(e: CustomEvent<Dropdown.EventDetail["dropdown-selected"]>) => {
              this.updateTemplateAttribute({
                data: e?.detail?.option as string,
                key: "metadataType",
                index,
              });
            }}"
          ></md-dropdown>
        </td>
        <td>
          <md-dropdown
            .defaultOption=${attribute.aggregationMode}
            .options=${aggregationModes}
            @dropdown-selected="${(e: CustomEvent<Dropdown.EventDetail["dropdown-selected"]>) => {
              this.updateTemplateAttribute({
                data: e.detail.option as string,
                key: "aggregationMode",
                index,
              });
            }}"
          ></md-dropdown>
        </td>
        <td>
          <md-input
            value=${attribute.lookbackPeriod}
            @input-change=${(ev: Event) =>
              this.updateTemplateAttribute({
                data: (ev?.target as any)?.value?.trim(),
                key: "lookbackPeriod",
                index,
              })}
          ></md-input>
        </td>
        <td>
          <md-dropdown
            .defaultOption=${attribute.lookbackDurationType}
            .options=${lookbackPeriodTypes}
            @dropdown-selected="${(e: CustomEvent<Dropdown.EventDetail["dropdown-selected"]>) => {
              this.updateTemplateAttribute({
                data: e.detail.option as string,
                key: "lookbackDurationType",
                index,
              });
            }}"
          ></md-dropdown>
        </td>
        <td>
          <md-dropdown
            .defaultOption=${attribute?.widgetAttributes?.type as string}
            .options=${displayTypes}
            @dropdown-selected="${(e: CustomEvent<Dropdown.EventDetail["dropdown-selected"]>) => {
              this.updateTemplateAttribute({
                data: e.detail.option as string,
                key: "displayType",
                index,
              });
            }}"
          ></md-dropdown>
        </td>
      </tr>
    `;
  }

  addNewAttributeRow() {
    const _dupcliateAttributes = this.templateAttributes.slice();

    _dupcliateAttributes.push({ ...defaultAttribute });

    this.templateAttributes = _dupcliateAttributes;
  }

  postTemplate() {
    let url = `${this.baseURL}/v1/journey/views/templates`;

    this.templateSaveAPIInProgress = true;

    let bearerToken = this.getBearerAuthorization();

    if (bearerToken) {
      url += `?organization=${this.organization}&namespace=${this.namespace}`;
    }

    fetch(url, {
      headers: {
        Authorization: bearerToken || `SharedAccessSignature ${this.profileWriteSasToken}`,
        "content-type": "application/json; charset=UTF-8",
      },
      method: "POST",
      body: JSON.stringify(this.template),
    })
      .then(response => response.json())
      .then(response => {
        this.templateSaveAPIInProgress = false;
        if (response?.error) {
          this.saveError = response.error?.message?.map((message: any) => message.description);
          return;
        }

        if (response) {
          this.saveStatus = true;
          this.saveError = null;
          setTimeout(() => {
            this.saveStatus = false;
            this.saveCallBack?.();
          }, 3500);
        }
      });
  }

  saveTemplate() {
    const name = this.nameInput?.value.trim();

    if (!this.template?.name) {
      if (!name) {
        this.nameRequiredError = true;
        return;
      } else {
        this.nameRequiredError = false;
      }

      const names = this.existingTemplateNames.filter(_name => _name === name);
      if (names?.length > 0) {
        this.nameDuplicateError = true;
        return;
      } else {
        this.nameDuplicateError = false;
      }
    }

    if (this.template) {
      this.template.attributes = this.templateAttributes;
      this.template.id = this.template.name;
    } else {
      this.template = {
        id: name,
        attributes: this.templateAttributes,
      };
    }

    this.postTemplate();
  }

  getTemplateEditor() {
    const buttonSpinner = html`
      <md-spinner size="14"></md-spinner>
    `;

    const successMesage = html`
      <div class="success-msg">Template Saved successfully</div>
    `;

    // Attributes[0].DisplayName: Missing Displayname
    const formatError = (err: string) => {
      return err?.replace(/Attributes\[(\d+)\]\.(.*?):/, (...matches) => {
        const rowNum = parseInt(matches[1]);
        return `Error with Row #${rowNum}:`;
      });
    };

    const errorText = (err: string) => html`
      <div class="error-msg">${formatError(err)}</div>
    `;

    const errorMessage = html`
      <div>
        ${this.saveError?.map((err: string) => errorText(err))}
      </div>
    `;

    return html`
      <table>
        <thead>
          <tr>
            <th></th>
            <th>
              Attribute
            </th>
            <th>
              Event Type
            </th>
            <th>
              Metadata
            </th>
            <th>
              Data Type
            </th>
            <th>
              Aggregator
            </th>
            <th>
              Lookback period
            </th>
            <th>
              Period Type
            </th>
            <th>
              Visual Style
            </th>
          </tr>
        </thead>
        <tbody>
          ${this.templateAttributes?.map((value, index) => this.getAttributeRow(value, index))}
          <tr>
            <td colspan="2">
              <md-button @click=${(ev: any) => this.addNewAttributeRow()}>+ Add New Row</md-button>
            </td>
          </tr>
        </tbody>
      </table>
      <br />
      <div>
        <md-button .disabled=${this.templateSaveAPIInProgress} variant="primary" @click=${() => this.saveTemplate()}>
          ${this.templateSaveAPIInProgress ? buttonSpinner : "Save Template"}
        </md-button>
        ${this.saveStatus ? successMesage : nothing} ${this.saveError ? errorMessage : nothing}
      </div>
      <br />
      <div class="footer">
        <b>Note:</b>
        <div>
          <p>
            <em>
              Name, Email, Label and ImgSrc are auto rendered from name, email, label and imgSrc Metadata respectively.
            </em>
          </p>
          <p><em> Tabs are supported only in Profile Widget. </em></p>
          <p>
            <em>
              'All' tab appears in profile widget by default
            </em>
          </p>
        </div>
      </div>
    `;
  }

  getProfilePreview() {
    const profileData = this.templateAttributes.map((x: any) => {
      const _query = {
        ...x,
      };

      if (!x.widgetAttributes) {
        _query.widgetAttributes = {
          type: "table",
        };
      }
      return {
        query: _query,
        result: [_query.metadataType === "string" ? "lorem ipsum" : 12345],
      };
    });
    return html`
      ${this.profileSourceScript()}
      <cjaas-profile-view-widget
        .profileData=${profileData}
        .tapeReadToken=${this.tapeReadSasToken}
        .events=${this.tapeEvents}
        .baseURL=${this.baseURL}
      >
      </cjaas-profile-view-widget>
    `;
  }

  // Readonly view should showup when editing an action
  render() {
    if (this.templateAPIInProgress) {
      return html`
        <div class="spinner-container">
          <md-spinner></md-spinner>
        </div>
      `;
    }

    if (this.templateId && !this.template) {
      return html`
        <div class="spinner-container">Template named &nbsp;<b>${this.templateId}</b>&nbsp; is not found</div>
      `;
    }

    const editButton = html`
      <md-button @click=${() => (this.readOnlyMode = false)}>Edit Template</md-button>
    `;

    return html`
      <div class="name-container">
        ${this.template?.name ? this.template?.name : this.getNameInputTemplate()}
        ${this.readOnlyMode ? editButton : nothing}
      </div>
      <div>
        ${this.getProfilePreview()} ${!this.readOnlyMode ? this.getTemplateEditor() : nothing}
      </div>
    `;
  }

  getNamespace(token: SASTOKEN) {
    let matches = token?.match(/sn=(.*?)\&/);

    return matches && matches[1];
  }

  getOrganization(token: SASTOKEN) {
    let matches = token?.match(/so=(.*?)&/);

    return matches && matches[1];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "cjaas-template-builder": CjaasTemplateBuilder;
  }
}

export type SASTOKEN = string | null | undefined;

export interface Attribute {
  version: "0.1";
  event: string;
  metadataType: "string" | "number";
  metadata: string | null;
  limit: number;
  displayName: string;
  lookbackDurationType: "days" | "hours" | "minutes";
  lookbackPeriod: number;
  aggregationMode: "Value" | "Count";
  eventDataAggregators: null;
  widgetAttributes?: { type: "table" | "tab" } | null;
  verbose: boolean;
}
