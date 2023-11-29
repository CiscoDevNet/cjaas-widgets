import { customElementWithCheck } from "@/mixins/CustomElementCheck";

import { LitElement, property, internalProperty, PropertyValues } from "lit-element";
import { nothing, html } from "lit-html";
import { MILLISECONDS_PER_SECOND } from "../constants";
import styles from "./scss/module.scss";

import "@momentum-ui/web-components/dist/comp/md-progress-bar";

export namespace Timer {
  @customElementWithCheck("cjaas-timer")
  export class ELEMENT extends LitElement {
    @property({ type: Number }) seconds = 180;

    @internalProperty() progressValue: number | null = null;
    @internalProperty() intervalID: any;

    connectedCallback() {
      super.connectedCallback();
      this.startTimer();
    }

    disconnectedCallback() {
      super.disconnectedCallback();
      clearInterval(this.intervalID);
    }

    updated(changedProperties: PropertyValues) {
      super.updated(changedProperties);

      if (changedProperties.has("timer")) {
        this.startTimer();
      }
    }

    public startTimer() {
      this.progressValue = 100;
      if (this.intervalID !== undefined) {
        clearInterval(this.intervalID);
      }

      this.intervalID = setInterval(() => {
        this.progressValue =
          (this.progressValue as number) - MILLISECONDS_PER_SECOND / (this.seconds * MILLISECONDS_PER_SECOND);

        this.requestUpdate();

        if (this.progressValue <= 0) {
          this.progressValue = 0;
          clearInterval(this.intervalID);
          const event = new CustomEvent("timed-out", {
            composed: true,
            bubbles: true,
          });

          this.dispatchEvent(event);
        }
      }, 10);
    }

    static get styles() {
      return styles;
    }

    render() {
      return this.progressValue
        ? html`
            <md-progress-bar
              dynamic
              type="determinate"
              .value=${this.progressValue}
              displayFormat="none"
            ></md-progress-bar>
          `
        : nothing;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "cjaas-timer": Timer.ELEMENT;
  }
}
