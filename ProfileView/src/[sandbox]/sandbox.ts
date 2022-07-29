/**
 * Copyright (c) Cisco Systems, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import "@momentum-ui/web-components";
import "@cjaas/common-components";
import { customElement, html, internalProperty, LitElement } from "lit-element";
import "..";
import styles from "./sandbox.scss";
import { generateSasToken, TokenArgs } from "../generatesastoken";

/**
 * ATTENTION: Apps using this widget must provide the following values from the application configuration.
 * These details allow easy and discreet generation of SAS tokens with correct permissions needed to access the API.
 */
//@ts-ignore
const PRIVATE_KEY = process.env.DOTENV.PRIVATE_KEY;
// @ts-ignore
const TAPE_READ_TOKEN = process.env.DOTENV.TAPE_READ_TOKEN;
// @ts-ignore
const STREAM_READ_TOKEN = process.env.DOTENV.STREAM_READ_TOKEN;
// @ts-ignore
const PROFILE_READ_TOKEN = process.env.DOTENV.PROFILE_READ_TOKEN;
// @ts-ignore
const PROFILE_WRITE_TOKEN = process.env.DOTENV.PROFILE_WRITE_TOKEN;
// @ts-ignore
const IDENTITY_READ_TOKEN = process.env.DOTENV.IDENTITY_READ_TOKEN;
// @ts-ignore
const IDENTITY_WRITE_TOKEN = process.env.DOTENV.IDENTITY_WRITE_TOKEN;

const ORGANIZATION = "demoassure";
const NAMESPACE = "sandbox";
const APP_NAME = "sandbox";

const mockedTapeEvents = [
  {
    data: {
      agentId: "55de70fc-af58-40e8-b7f8-c23536a53e76",
      createdTime: 1658437179769,
      currentState: "wrapup",
      origin: "egiere@cisco.com",
      queueId: "ee472d93-7b28-483e-9cd9-6ed59db2dc9a",
      taskId: "f484abb1-0937-11ed-994c-bf6de601ac80",
      teamId: "9c73f123-0a33-414c-98db-b1169cccc8ce",
    },
    dataContentType: "string",
    id: "cac7ec98-e119-4ad6-9d8d-909d83d3b979",
    person: "egiere@cisco.com",
    previously: "",
    source: "wxcc",
    specVersion: "1.0",
    time: "2022-07-21T20:59:39.769Z",
    type: "agent:state_change",
  },
  {
    data: {
      channelType: "chat",
      createdTime: 1658437179722,
      destination: "Chat_temp_WXC-CHAT-EP1",
      direction: "INBOUND",
      origin: "egiere@cisco.com",
      outboundType: null,
      queueId: "ee472d93-7b28-483e-9cd9-6ed59db2dc9a",
      reason: "Agent Left",
      taskId: "f484abb1-0937-11ed-994c-bf6de601ac80",
      terminatingParty: "Agent",
      workflowManager: null,
    },
    dataContentType: "string",
    id: "b3828547-3b7a-40f4-8393-1058fb2d2ad6",
    person: "egiere@cisco.com",
    previously: "",
    source: "wxcc",
    specVersion: "1.0",
    time: "2022-07-21T20:59:39.722Z",
    type: "task:ended",
  },
];

/**
 * Private SAS Tokens generated and stored in component instance
 */

function getTokens() {
  return {
    getTToken: function() {
      const tapeArgs: TokenArgs = {
        secret: PRIVATE_KEY!,
        organization: ORGANIZATION!,
        namespace: NAMESPACE!,
        service: "tape",
        permissions: "r",
        keyName: APP_NAME!,
        expiration: 1000,
      };
      return generateSasToken(tapeArgs);
    },

    getSToken: function() {
      const tapeArgs: TokenArgs = {
        secret: PRIVATE_KEY!,
        organization: ORGANIZATION!,
        namespace: NAMESPACE!,
        service: "stream",
        permissions: "r",
        keyName: APP_NAME!,
        expiration: 1000,
      };
      return generateSasToken(tapeArgs);
    },

    getPToken: function() {
      const tapeArgs: TokenArgs = {
        secret: PRIVATE_KEY!,
        organization: ORGANIZATION!,
        namespace: NAMESPACE!,
        service: "profile",
        permissions: "rw",
        keyName: APP_NAME!,
        expiration: 1000,
      };
      return generateSasToken(tapeArgs);
    },
  };
}

@customElement("cjaas-component-sandbox")
export class Sandbox extends LitElement {
  @internalProperty() darkTheme = false;
  @internalProperty() containerWidth = "1000px";
  @internalProperty() containerHeight = "80vh";
  @internalProperty() selectedComponent = "Activity Item";
  static get styles() {
    return styles;
  }

  themeToggle() {
    return html`
      <div class="toggle-container">
        <md-checkbox
          type="checkbox"
          id="theme-switch"
          class="theme-switch"
          data-aspect="darkTheme"
          label="Dark Mode"
          @checkbox-change=${(e: MouseEvent) => this.toggleSetting(e)}
          ?checked=${this.darkTheme}
          >Dark Mode</md-checkbox
        >
        <div class="switch-container">
          <md-label class="switch" text="Responsive">
            Widget Boundary
          </md-label>
          <md-input
            type="text"
            id="width-switch"
            class="theme-switch"
            data-aspect="responsive-width"
            @click=${(e: MouseEvent) => this.toggleSetting(e)}
            @input-change=${(e: MouseEvent) => this.toggleSetting(e)}
            value=${this.containerWidth}
          ></md-input>
          <md-label>x</md-label>
          <md-input
            type="text"
            id="height-switch"
            class="theme-switch"
            data-aspect="responsive-height"
            @click=${(e: MouseEvent) => this.toggleSetting(e)}
            @input-change=${(e: MouseEvent) => this.toggleSetting(e)}
            value=${this.containerHeight}
          ></md-input>
        </div>
      </div>
    `;
  }

  toggleSetting(e: MouseEvent) {
    const composedPath = e.composedPath();
    const target = (composedPath[0] as unknown) as HTMLInputElement;
    const aspect: string = target.dataset.aspect!;
    if (aspect === "responsive-width") {
      this.containerWidth = target.value;
    } else if (aspect === "responsive-height") {
      this.containerHeight = target.value;
    } else if (aspect === "darkTheme") {
      this.darkTheme = !this.darkTheme;
    } else return console.error("Invalid data-aspect input");
  }

  render() {
    // TODO: Verify that the JavaScript SAS Token script is still working. Below are keys made using Java from Srini.
    const { getTToken, getSToken, getPToken } = getTokens();
    return html`
      <div class="toggle">
        ${this.themeToggle()}
      </div>
      <md-theme ?darkTheme=${this.darkTheme}>
        <div class="container">
          <h2 class="sandbox-header">Profile</h2>
          <div
            style=${`width: ${this.containerWidth}; height: ${this.containerHeight}; overflow: auto;`}
            class="widget-container"
          >
            <cjaas-profile-view-widget
              template-id="journey-default-template"
              customer="+14806754084"
              base-url="https://jds-us1.cjaas.cisco.com"
              .externalEvents=${mockedTapeEvents}
              .tapeReadToken=${TAPE_READ_TOKEN}
              .streamReadToken=${STREAM_READ_TOKEN}
              .profileReadToken=${PROFILE_READ_TOKEN}
              .profileWriteToken=${PROFILE_WRITE_TOKEN}
            ></cjaas-profile-view-widget>
          </div>
        </div>
      </md-theme>
    `;
  }
}
