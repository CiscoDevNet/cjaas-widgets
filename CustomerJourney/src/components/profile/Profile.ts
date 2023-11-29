/**
 * Copyright (c) Cisco Systems, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { customElementWithCheck } from "@/mixins/CustomElementCheck";

import { LitElement, html, property, PropertyValues, internalProperty, query } from "lit-element";
import { ifDefined } from "lit-html/directives/if-defined";
import styles from "./scss/module.scss";
import "@momentum-ui/web-components/dist/comp/md-avatar";
import "@momentum-ui/web-components/dist/comp/md-badge";
import "@momentum-ui/web-components/dist/comp/md-icon";
import "@momentum-ui/web-components/dist/comp/md-spinner";
import { Input } from "@momentum-ui/web-components";

export namespace ProfileView {
  interface ContactChannel {
    [key: string]: string;
  }
  export interface ContactData {
    contactChannels?: ContactChannel;
    email?: string;
    name?: string;
    label?: string;
    imgSrc?: string;
  }

  export enum EditablePropertyNames {
    None = "none",
    FirstName = "First Name",
    LastName = "Last Name",
  }

  @customElementWithCheck("cjaas-profile")
  export class ELEMENT extends LitElement {
    /**
     * @prop customer
     * Customer Name used to call api
     */
    @property({ type: String }) customer = "";
    /**
     * @prop contactData
     * Data object specific to contact details
     */
    @property() contactData: ContactData | undefined = undefined;
    /**
     * @prop profileData
     * The profile Data provided from the template fetch, populated in the table view
     */
    @property() profileData: any = undefined;
    /**
     * @prop snapshot
     * Toggle snapshot view render (a small preview UI)
     */
    @property({ type: Boolean }) snapshot = false;
    /**
     * @prop compact
     * Toggle compact view render (smaller UI for Lists)
     */
    @property({ type: Boolean }) compact = false;
    /**
     * @prop getProfileDataInProgress
     * Whether or not to render loading spinner or not
     */
    @property({ type: Boolean }) getProfileDataInProgress = false;
    /**
     * @prop error-message
     * Resulting error message from profile api call
     */
    @property({ type: String, attribute: "error-message" }) errorMessage = "";

    @property({ type: String, attribute: "name-api-error-message" }) nameApiErrorMessage = "";

    @property({ type: String, attribute: "first-name" }) firstName = "";
    @property({ type: String, attribute: "last-name" }) lastName = "";

    // @internalProperty() activePropertyEdit: EditablePropertyNames = EditablePropertyNames.None;
    @internalProperty() activePropertyEdit = "";

    // @internalProperty() editHeaderNamesIconVisible = false;
    @internalProperty() editingNames = false;

    @internalProperty() firstNameInputValue = "";
    @internalProperty() lastNameInputValue = "";

    @internalProperty() firstNameInvalid = false;
    @internalProperty() lastNameInvalid = false;

    @internalProperty() firstNameErrorMessage = "";
    @internalProperty() lastNameErrorMessage = "";

    @internalProperty() firstNameInputMessageArray: Array<Input.Message> = [];
    @internalProperty() lastNameInputMessageArray: Array<Input.Message> = [];

    @property({ type: Boolean, attribute: "names-loading" }) namesLoading = false;

    @query("#edit-property-input") editInputField!: HTMLInputElement;

    @query("#first-name-input") firstNameInput!: HTMLInputElement;
    @query("#last-name-input") lastNameInput!: HTMLInputElement;

    nonAlphaNameErrorMessage = "Alpha characters only";
    undefinedNameErrorMessage = (nameType: "First" | "Last") => `${nameType} name required`;

    connectedCallback() {
      super.connectedCallback();
      this.extractDataPoints();
    }

    firstUpdated(changedProperties: PropertyValues) {
      super.firstUpdated(changedProperties);

      if (!this.firstName && !this.lastName) {
        this.editingNames = true;
      }
    }

    updated(changedProperties: PropertyValues) {
      super.updated(changedProperties);
      if (changedProperties.has("profileData")) {
        this.extractDataPoints(true);
        this.requestUpdate();
      }

      if (changedProperties.has("firstName") || changedProperties.has("lastName")) {
        this.nameApiErrorMessage = "";
        this.lastNameInvalid = false;
        this.firstNameInvalid = false;
        this.editingNames = !(this.firstName && this.lastName);
      }

      if (changedProperties.has("firstName")) {
        this.firstNameErrorMessage = "";
        this.firstNameInputValue = this.firstName;
      }

      if (changedProperties.has("lastName")) {
        this.lastNameErrorMessage = "";
        this.lastNameInputValue = this.lastName;
      }

      if (changedProperties.has("firstNameInputValue")) {
        this.firstNameErrorMessage = "";
        this.nameApiErrorMessage = "";
      }

      if (changedProperties.has("lastNameInputValue")) {
        this.lastNameErrorMessage = "";
        this.nameApiErrorMessage = "";
      }

      if (changedProperties.has("firstNameErrorMessage")) {
        if (this.firstNameErrorMessage) {
          const errorMessage: Input.Message = {
            type: "error",
            message: this.firstNameErrorMessage,
          };
          this.firstNameInputMessageArray = [errorMessage];
        } else {
          this.firstNameInputMessageArray = [];
        }
      }

      if (changedProperties.has("lastNameErrorMessage")) {
        if (this.lastNameErrorMessage) {
          const errorMessage: Input.Message = {
            type: "error",
            message: this.lastNameErrorMessage,
          };
          this.lastNameInputMessageArray = [errorMessage];
        } else {
          this.lastNameInputMessageArray = [];
        }
      }

      if (changedProperties.has("nameApiErrorMessage")) {
        if (this.nameApiErrorMessage) {
          const errorMessage: Input.Message = {
            type: "error",
            message: this.nameApiErrorMessage,
          };
          this.firstNameInputMessageArray = [errorMessage];
        } else {
          this.firstNameInputMessageArray = [];
        }
      }
    }

    emailContactItem() {
      // TODO: This ought to be a stand-alone web component geared to provide various icons/colors
      // Accept a type parameter to render phone / email / etc.
      // See the "contactData.contactChannels" property, parse an array of objects.
      if ((this.contactData?.imgSrc || this.contactData?.name) && this.contactData?.email) {
        return html`
          <div class="contact-item">
            <md-badge circle color="violet">
              <md-icon name="icon-email-active_12" size="8"></md-icon>
            </md-badge>
            <span>${this.contactData?.email}</span>
          </div>
        `;
      }
    }

    dataPointFilter(dataPoint: string) {
      // Usage agnostic, simply retrieves the usable data. Specific to CJaaS API
      if (Array.isArray(this.profileData)) {
        const dataAttribute = this.profileData?.filter((x: any) => x.query.metadata === dataPoint);
        return dataAttribute[0]?.result[0] ? dataAttribute[0].result[0] : undefined;
      }
    }

    /**
     * @method extractDataPoints
     * @param update
     * @returns void
     * Method to parse and set the contact data from the template return
     */
    extractDataPoints(update?: boolean) {
      if ((!this.contactData && this.profileData) || update) {
        // TODO: Pending more API development, populate the contactChannels here as well

        const first = this.dataPointFilter("firstName");
        const last = this.dataPointFilter("lastName");

        let firstLastName;
        if (first || last) {
          firstLastName = `${first ? `${first} ` : ""}${last ? last : ""}`;
        } else {
          firstLastName = undefined;
        }

        const contactDetails = {
          name: this.dataPointFilter("name") || firstLastName,
          email: this.dataPointFilter("email"),
          label: this.dataPointFilter("label"),
          imgSrc: this.dataPointFilter("imgSrc"),
        };
        this.contactData = contactDetails;
      }
    }

    renderAvatar() {
      if (this.contactData?.imgSrc || this.contactData?.name) {
        return html`
          <md-avatar
            class="profile-avatar"
            part="avatar"
            title=${ifDefined(this.contactData?.name)}
            alt=${ifDefined(this.contactData?.name)}
            src=${ifDefined(this.contactData?.imgSrc)}
            .size=${48}
          ></md-avatar>
        `;
      }
    }

    renderCustomerLabel() {
      if (this.contactData?.label) {
        return html`
          <h5 title="Label" class="customer-label" part="label">
            ${this.contactData?.label}
          </h5>
        `;
      }
    }

    //   <!-- <h5 title="Name" class="customer-name">
    //   ${this.contactData?.name}
    // </h5> -->

    getTopContent() {
      return html`
        <section part="top-content" class="top-content">
          ${html`
            ${this.renderHeaderNames()} ${this.renderCustomerLabel()} ${this.emailContactItem()}
          `}
        </section>
      `;
    }

    validateName(type: "first" | "last", nameValue: string) {
      const re = new RegExp("^[a-zA-Z]+$"); // only alpha characters

      if (type === "first") {
        this.firstNameInvalid = !nameValue || !re.test(nameValue);
      }

      if (type === "last") {
        this.lastNameInvalid = !nameValue || !re.test(nameValue);
      }
    }

    firstNameInputChange(event: CustomEvent) {
      this.firstNameInputValue = event?.detail?.value?.trim();
      this.validateName("first", this.firstNameInputValue);
    }

    lastNameInputChange(event: CustomEvent) {
      this.lastNameInputValue = event?.detail?.value?.trim();

      this.validateName("last", this.lastNameInputValue);
    }

    // class=${`cell edit-names-button ${this.editHeaderNamesIconVisible ? "make-visible" : ""}`}
    renderHeaderNames() {
      if (this.editingNames) {
        return html`
          <h5 class="customer-name-header-row input-fields">
            <md-input
              id="first-name-input"
              class="cell first-name-input name-input"
              value=${this.firstNameInputValue}
              placeholder="First Name"
              .messageArr=${this.firstNameInputMessageArray}
              @input-change=${this.firstNameInputChange}
            ></md-input>
            <md-input
              id="last-name-input"
              class=${`cell last-name-input name-input ${this.nameApiErrorMessage ? "input-error" : ""}`}
              value=${this.lastNameInputValue}
              placeholder="Last Name"
              .messageArr=${this.lastNameInputMessageArray}
              @input-change=${this.lastNameInputChange}
            ></md-input>
            ${this.renderNameButtonIcons()}
          </h5>
        `;
      } else {
        return html`
          <h5 class="customer-name-header-row text">
            ${this.firstNameInputValue} ${this.lastNameInputValue}
            <md-button class=${`cell edit-names-button`} iconActive circle @click=${this.editNames}
              ><md-icon name="edit_12"></md-icon
            ></md-button>
          </h5>
        `;
      }
    }

    renderNameButtonIcons() {
      if (this.namesLoading) {
        return html`
          <div class="name-spinner-wrapper">
            <md-spinner size=${16}></md-spinner>
          </div>
        `;
      } else {
        return html`
          <span class="button-row">
            <md-button
              class=${`cell names-control-button cancel-names-button`}
              iconActive
              circle
              @click=${this.submitNames}
              ><md-icon name="check-circle_16"></md-icon
            ></md-button>
          </span>
        `;
      }
    }

    editNames() {
      this.editingNames = true;
    }

    submitNames() {
      if (
        this.firstNameInputValue &&
        this.lastNameInputValue &&
        this.firstName === this.firstNameInputValue &&
        this.lastName === this.lastNameInputValue
      ) {
        this.editingNames = false;
        return;
      }

      if (this.firstNameInvalid || !this.firstNameInputValue) {
        this.firstNameErrorMessage = this.firstNameInputValue
          ? this.nonAlphaNameErrorMessage
          : this.undefinedNameErrorMessage("First");
      }

      if (this.lastNameInvalid || !this.lastNameInputValue) {
        this.lastNameErrorMessage = this.lastNameInputValue
          ? this.nonAlphaNameErrorMessage
          : this.undefinedNameErrorMessage("Last");
      }

      if (!this.firstNameErrorMessage && !this.lastNameErrorMessage) {
        this.namesLoading = true;

        this.dispatchEvent(
          new CustomEvent("edit-names", {
            detail: {
              firstName: this.firstNameInputValue,
              lastName: this.lastNameInputValue,
            },
          })
        );
      }
    }

    editProperty(propertyName: string) {
      this.activePropertyEdit = propertyName;
    }

    handleInputEdit(event: CustomEvent) {
      const { code } = event?.detail?.srcEvent;

      if (code === "Enter") {
        const newPropretyValue = this.editInputField?.value;
        // this.activePropertyEdit = "";
      }
    }

    basicProfileProperties = ["Name", "First Name", "Last Name", "Email", "Phone"];

    renderEditButton(propertyName: string, propertyValue: string) {
      // const makeVisible = (propertyName === "First Name" || propertyName === "Last Name") && !propertyValue;
      const makeVisible = propertyName === "First Name" || propertyName === "Last Name";

      if (this.activePropertyEdit === propertyName) {
        return html`
          <div class="input-edit-button-group">
            <!-- <md-button
               class=${`cell edit-property-button ${makeVisible ? "make-visible" : ""}`}
               iconActive
               circle
               @click=${() => (this.activePropertyEdit = "")}
               ><md-icon name="check-circle_16"></md-icon
             ></md-button> -->
            <md-button
              class=${`cell edit-property-button ${makeVisible ? "make-visible" : ""}`}
              iconActive
              circle
              @click=${() => (this.activePropertyEdit = "")}
              ><md-icon name="cancel_16"></md-icon
            ></md-button>
          </div>
        `;
      } else {
        return html`
          <md-button
            class=${`cell edit-property-button ${makeVisible ? "make-visible" : ""}`}
            iconActive
            circle
            @click=${this.editProperty.bind(this, propertyName)}
            ><md-icon name="edit_16"></md-icon
          ></md-button>
        `;
      }
    }

    renderPropertyValueDisplay(propertyName: string, propertyValue: string) {
      if (this.activePropertyEdit === propertyName) {
        return html`
          <md-input
            id="edit-property-input"
            class="cell property-input"
            value=${propertyValue}
            @input-keydown=${this.handleInputEdit}
          ></md-input>
        `;
      } else {
        return html`
          <div class="cell property-text property-value">${propertyValue}</div>
        `;
      }
    }

    getTable() {
      return html`
        <div class="grid" title="Profile Details">
          ${this.profileData
            ?.filter((x: any) => x.query.type === "table" || x.query?.widgetAttributes?.type === "table")
            .map((x: any) => {
              const { displayName } = x?.query;
              const propertyValue = this.getValue(x);
              if (
                this.basicProfileProperties.includes(displayName) ||
                (this.getValue(x) !== "-" && displayName !== "imgSrc")
              ) {
                return html`
                  <div class="cell property-text property-name">${displayName}</div>
                  <div class="cell property-value">${propertyValue}</div>
                `;
              }
            })}
        </div>
      `;
    }

    // editable profile properties
    // ${this.renderPropertyValueDisplay(displayName, propertyValue)}
    // ${this.renderEditButton(displayName, propertyValue)}

    getValue(x: any) {
      let result = null;

      if (x.query.formatValue) {
        try {
          result = x.result.map(x.query.formatValue).join(", ");
        } catch (err) {
          console.log("JDS Profile: Unable to format table value", err);
        }
      }

      if (result === null) {
        result = x.result.join(", ") || "-";
      }

      return result;
    }

    renderSpinner(size = 32) {
      return html`
        <md-spinner size=${size}></md-spinner>
      `;
    }

    getSnapshot() {
      return html`
        <section
          class=${`snapshot ${this.getProfileDataInProgress ? "loading" : ""}`}
          part="profile-snapshot"
          title="Customer Profile"
        >
          ${this.getProfileDataInProgress ? this.renderSpinner() : this.getTopContent()}
        </section>
      `;
    }

    getCompact() {
      const name = this.contactData?.name || "";
      return html`
        <section class="compact" part="profile-compact" title="Customer Profile">
          ${this.getProfileDataInProgress
            ? this.renderSpinner(34)
            : html`
                ${this.renderAvatar()}
                <div class="customer-titles">
                  <h5 title="Name" class="customer-name">
                    ${name}
                  </h5>
                  ${this.renderCustomerLabel()}
                </div>
              `}
        </section>
      `;
    }

    static get styles() {
      return styles;
    }

    renderFullProfileView() {
      if (this.getProfileDataInProgress) {
        return html`
          <div class="loading-wrapper">${this.renderSpinner()}</div>
        `;
      } else {
        return html`
          <section class="profile" part="profile" title="Customer Profile">
            ${this.getTopContent()}
            <hr part="separator" />
            ${this.getTable()}
          </section>
        `;
      }
    }

    renderProfileText(message: string, isError = false) {
      return html`
        <slot name="l10n-no-data-message">
          <p class=${`profile-text ${isError ? "error" : ""}`}>${message}</p>
        </slot>
      `;
    }

    render() {
      if (this.errorMessage) {
        return this.renderProfileText(this.errorMessage, true);
      } else if (this.getProfileDataInProgress || (this.contactData && this.profileData?.length > 0)) {
        return this.compact ? this.getCompact() : this.snapshot ? this.getSnapshot() : this.renderFullProfileView();
      } else {
        return this.renderProfileText(`No profile data found for ${this.customer || "this user"}.`);
      }
    }
  }
}
declare global {
  interface HTMLElementTagNameMap {
    "cjaas-profile": ProfileView.ELEMENT;
  }
}
