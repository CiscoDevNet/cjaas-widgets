import { internalProperty, LitElement, property, PropertyValues, query } from "lit-element";
import { html, nothing } from "lit-html";
import { ParseError, parsePhoneNumberWithError } from "libphonenumber-js";
import * as linkify from "linkifyjs";

import "@momentum-ui/web-components/dist/comp/md-progress-bar";
import styles from "./scss/identity.scss";
import { Input } from "@momentum-ui/web-components";
import { customElementWithCheck } from "@/mixins/CustomElementCheck";

export interface IdentityData {
  id: string;
  createdAt: string;
  modifiedAt: string;
  aliases: Array<string>;
}

export interface JourneyEvent {
  data: {
    [key: string]: string;
  };
  dataContentType: string;
  id: string;
  person: string;
  source: string;
  specVersion: string;
  time: string;
  type: string;
}

export interface AliasObject {
  type: RawAliasTypes;
  value: string;
}

export enum RawAliasTypes {
  Phone = "phone",
  Email = "email",
  CustomerId = "customerId",
  Unknown = "unknown",
  Unselected = "",
}

export enum ReadableAliasTypes {
  Phone = "Phone",
  Email = "Email",
  CustomerId = "Customer ID",
  Unknown = "Unknown",
  Unselected = "",
}

export enum PhoneErrors {
  NOT_A_NUMBER = "Not a number",
  INVALID_COUNTRY = "Invalid country code",
  TOO_SHORT = "Too short",
  TOO_LONG = "Too long",
}

// @customElementWithCheck("customer-journey-widget")
// export default class CustomerJourneyWidget extends LitElement {

export namespace Identity {
  @customElementWithCheck("cjaas-identity")
  export class ELEMENT extends LitElement {
    @property() customer: string | null = null;
    @property() aliasDeleteInProgress: { [key: string]: boolean } = {};
    @property({ type: Boolean }) aliasAddInProgress = false;
    @property({ type: Boolean }) aliasGetInProgress = false;
    @property({ type: Boolean }) disableAddButton = false;
    @property({ attribute: false }) aliasObjects: undefined | Array<AliasObject> = undefined;
    @property({ type: String, attribute: "error-message", reflect: true }) errorMessage = "";
    @property({ type: Boolean, attribute: "read-only" }) readOnly = false;

    @internalProperty() newAliasInputValue = "";
    @internalProperty() aliasFirstNameInputValue = "";
    @internalProperty() aliasLastNameInputValue = "";
    @internalProperty() selectedRawAliasType: RawAliasTypes = RawAliasTypes.Unselected;
    @internalProperty() isAliasValid = false;

    @internalProperty() aliasValidationErrorMessage = "";
    @internalProperty() inputMessageArray: Array<Input.Message> = [];
    @internalProperty() invalidParsedPhoneErrorMessage = "";

    @query("#alias-input") aliasInput!: Input.ELEMENT;

    invalidEmailMessage = "Invalid email address";
    invalidPhoneMessage = "Invalid phone number";
    invalidCustomerId = "AlphaNumeric characters only";
    noAliasTypeMessage = "Alias type selection is required";

    updated(changedProperties: PropertyValues) {
      super.updated(changedProperties);
      if (
        (changedProperties.has("aliasGetInProgress") && !this.aliasGetInProgress) ||
        (changedProperties.has("aliasAddInProgress") && !this.aliasAddInProgress)
      ) {
        this.newAliasInputValue = "";
      }

      if (changedProperties.has("customer")) {
        this.newAliasInputValue = "";
      }

      if (changedProperties.has("selectedAliasType") || changedProperties.has("newAliasInputValue")) {
        this.aliasValidationErrorMessage = "";
      }

      if (changedProperties.has("aliasValidationErrorMessage")) {
        if (this.aliasValidationErrorMessage) {
          const errorMessage: Input.Message = {
            type: "error",
            message: this.aliasValidationErrorMessage,
          };
          this.inputMessageArray = [errorMessage];
        } else {
          this.inputMessageArray = [];
        }
      }
    }

    deleteAlias(type: string, alias: string) {
      this.dispatchEvent(
        new CustomEvent("delete-alias", {
          detail: {
            type,
            alias,
          },
        })
      );
    }

    aliasInputKeydown(event: CustomEvent) {
      const { code } = event?.detail?.srcEvent;

      if (code === "Enter") {
        this.addAlias();
      }
    }

    aliasInputChange(event: CustomEvent) {
      this.newAliasInputValue = event?.detail?.value?.trim();
      this.isAliasValid = this.validateAlias(this.selectedRawAliasType, this.newAliasInputValue);
    }

    aliasFirstNameInputChange(event: CustomEvent) {
      this.aliasFirstNameInputValue = event?.detail?.value?.trim();
    }

    aliasLastNameInputChange(event: CustomEvent) {
      this.aliasLastNameInputValue = event?.detail?.value?.trim();
    }

    validatePhoneNumber(value: string) {
      let parsedNumber;

      try {
        parsedNumber = parsePhoneNumberWithError(value, "US");
        this.invalidParsedPhoneErrorMessage = "";
      } catch (error) {
        if (error instanceof ParseError) {
          this.invalidParsedPhoneErrorMessage = error.message;
        } else {
          throw error;
        }
      }

      const isPhoneNumberValid = parsedNumber?.isValid();
      return isPhoneNumberValid || false;
    }

    validateAlias(type: RawAliasTypes, value: string) {
      if (type === RawAliasTypes.Email) {
        const isEmailValid = linkify.test(value, "email");
        return isEmailValid;
      } else if (type === RawAliasTypes.Phone) {
        return this.validatePhoneNumber(value);
      } else if (type === RawAliasTypes.CustomerId) {
        const re = new RegExp("^[a-zA-Z0-9]*$"); // alphaNumeric only
        const isCustomerIdValid = re.test(value);
        return isCustomerIdValid;
      }

      return false;
    }

    readablePhoneError(error: string): string {
      let result = ": ";
      switch (error) {
        case "INVALID_COUNTRY":
          result += PhoneErrors.INVALID_COUNTRY;
          break;
        case "NOT_A_NUMBER":
          result += PhoneErrors.NOT_A_NUMBER;
          break;
        case "TOO_SHORT":
          result += PhoneErrors.TOO_SHORT;
          break;
        case "TOO_LONG":
          result += PhoneErrors.TOO_LONG;
          break;
        default:
          result = "";
      }
      return result;
    }

    addAlias() {
      if (this.aliasAddInProgress || !this.newAliasInputValue) {
        return;
      }

      const alias = this.newAliasInputValue?.trim();

      if (!this.isAliasValid) {
        if (!this.selectedRawAliasType) {
          this.aliasValidationErrorMessage = this.noAliasTypeMessage;
        } else if (this.selectedRawAliasType === RawAliasTypes.Phone) {
          this.aliasValidationErrorMessage = `${this.invalidPhoneMessage}${this.readablePhoneError(
            this.invalidParsedPhoneErrorMessage
          )}`;
        } else if (this.selectedRawAliasType === RawAliasTypes.Email) {
          this.aliasValidationErrorMessage = this.invalidEmailMessage;
        } else if (this.selectedRawAliasType === RawAliasTypes.CustomerId) {
          this.aliasValidationErrorMessage = this.invalidCustomerId;
        }
        return;
      }

      this.dispatchEvent(
        new CustomEvent("add-alias", {
          detail: {
            type: this.selectedRawAliasType,
            alias,
          },
        })
      );
    }

    getRawAliasType(readableAliasType: ReadableAliasTypes): RawAliasTypes {
      switch (readableAliasType) {
        case ReadableAliasTypes.Email:
          return RawAliasTypes.Email;
        case ReadableAliasTypes.Phone:
          return RawAliasTypes.Phone;
        case ReadableAliasTypes.CustomerId:
          return RawAliasTypes.CustomerId;
        case ReadableAliasTypes.Unknown:
          return RawAliasTypes.Unknown;
        default:
          return RawAliasTypes.Unselected;
      }
    }

    getReadableAliasType(rawAliasType: RawAliasTypes): ReadableAliasTypes {
      switch (rawAliasType) {
        case RawAliasTypes.Email:
          return ReadableAliasTypes.Email;
        case RawAliasTypes.Phone:
          return ReadableAliasTypes.Phone;
        case RawAliasTypes.CustomerId:
          return ReadableAliasTypes.CustomerId;
        case RawAliasTypes.Unknown:
          return ReadableAliasTypes.Unknown;
        default:
          return ReadableAliasTypes.Unselected;
      }
    }

    static get styles() {
      return styles;
    }

    renderErrorMessage() {
      return html`
        <p class="alias-text error">${this.errorMessage}</p>
      `;
    }

    renderContent() {
      if (this.aliasGetInProgress) {
        return html`
          <div class="spinner-container">
            <md-spinner size="32"></md-spinner>
          </div>
        `;
      } else if (!this.aliasObjects || !this.aliasObjects?.length) {
        return html`
          <p class="alias-text">${`No aliases exist for ${this.customer || "this user"}.`}</p>
        `;
      } else {
        return this.renderAliasList();
      }
    }

    renderDeleteAliasUI(aliasObject: AliasObject) {
      const { type: rawType, value } = aliasObject;

      const renderInlineDeleteIcon = (type: string, alias: string) => html`
        <md-tooltip class="delete-icon-tooltip cell" message="Delete Alias">
          <md-icon
            class="alias-delete-icon"
            name="icon-delete_14"
            @click=${() => this.deleteAlias(type, alias)}
          ></md-icon
        ></md-tooltip>
      `;

      return this.aliasDeleteInProgress[value] ? this.renderInlineSpinner() : renderInlineDeleteIcon(rawType, value);
    }

    renderAliasList() {
      const aliases = (this.aliasObjects?.slice().reverse() || []).map((aliasObject: AliasObject) => {
        const { type: rawType, value } = aliasObject;
        return html`
          <p class="alias-type-label cell">${this.getReadableAliasType(rawType)}</p>
          <p class="alias-type-value cell">${value}</p>

          ${this.readOnly ? nothing : this.renderDeleteAliasUI(aliasObject)}
        `;
      });

      return html`
        <div class=${`alias-grid ${this.readOnly ? "read-only" : ""}`} part="list">
          ${aliases}
        </div>
      `;
    }

    renderInlineSpinner() {
      return html`
        <md-spinner class="cell" size="12"></md-spinner>
      `;
    }

    handleDropdownSelection(event: CustomEvent) {
      this.aliasValidationErrorMessage = "";
      this.aliasInput.value = "";
      this.selectedRawAliasType = this.getRawAliasType(event?.detail?.option);
    }

    getPlaceholderText() {
      if (this.selectedRawAliasType === RawAliasTypes.Email) {
        return "ex. jon@gmail.com";
      } else if (this.selectedRawAliasType === RawAliasTypes.Phone) {
        return "ex. +18003008000";
      } else if (this.selectedRawAliasType === RawAliasTypes.CustomerId) {
        return "ex. 123";
      } else {
        return "Enter a new alias";
      }
    }

    renderAliasAddRow() {
      const aliasTypeOptions = [
        this.getReadableAliasType(RawAliasTypes.Phone),
        this.getReadableAliasType(RawAliasTypes.Email),
        this.getReadableAliasType(RawAliasTypes.CustomerId),
      ];

      return html`
        <div class="flex alias-input-row">
          <md-dropdown
            class="alias-type-dropdown"
            .options=${aliasTypeOptions}
            title=${"Select type..."}
            @dropdown-selected=${this.handleDropdownSelection}
          ></md-dropdown>
          <md-input
            class="alias-input"
            placeholder=${this.getPlaceholderText()}
            id="alias-input"
            value=${this.newAliasInputValue}
            @input-change=${this.aliasInputChange}
            @input-keydown=${this.aliasInputKeydown}
            .messageArr=${this.inputMessageArray}
          ></md-input>
          <md-button
            .disabled=${this.aliasAddInProgress || !this.newAliasInputValue}
            variant="secondary"
            @click=${this.addAlias}
          >
            ${this.aliasAddInProgress ? this.renderInlineSpinner() : "Add"}
          </md-button>
        </div>
      `;
    }

    render() {
      const renderNullCustomerView = html`
        <p class="alias-text">No customer provided. Cannot execute any alias related actions.</p>
      `;

      const readOnlyTooltipMessage = `Aliases are alternate ways to identify a customer.`;
      const editableTooltipMessage = `Aliases are alternate ways to identify a customer. Adding aliases can help you form a more complete profile of your customer.`;

      const tooltipMessage = this.readOnly ? readOnlyTooltipMessage : editableTooltipMessage;

      if (this.customer) {
        return html`
          ${this.readOnly ? nothing : this.renderAliasAddRow()}
          <div part="aliases-container" class="aliases">
            <div part="alias-header-container" class="header-container">
              <h3 class="aliases-header">Aliases</h3>
              <md-tooltip class="alias-info-tooltip" .message=${tooltipMessage}>
                <md-icon class="alias-info-icon" name="info_14"></md-icon>
              </md-tooltip>
            </div>
            <div class="alias-content">
              ${this.errorMessage ? this.renderErrorMessage() : this.renderContent()}
            </div>
          </div>
        `;
      } else {
        return html`
          ${renderNullCustomerView}
        `;
      }
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "cjaas-identity": Identity.ELEMENT;
  }
}
