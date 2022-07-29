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
import styles from "./sandbox.scss";
import "..";

@customElement("cjaas-component-sandbox")
export class Sandbox extends LitElement {
  @internalProperty() darkTheme = false;
  @internalProperty() containerWidth = "1400px";
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
    const profileWriteToken =
      "so=mailinatorone&sn=sandbox&ss=profile&sp=r&se=2023-06-29T21:46:58.884Z&sk=UITeamOne&sig=Aim35z%2BuSs48VOtvUzCW23ePZDIc%2BtbhLkU%2BBw98n7E%3D";
    const profileReadToken =
      "so=mailinatorone&sn=sandbox&ss=profile&sp=w&se=2023-06-29T21:46:58.884Z&sk=UITeamOne&sig=%2BSEtFE5PycBvKKMx1%2FPs8WVi43l2yn%2FvGClBCpSiiug%3D";

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
        person: "bob@cisco.com",
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

    return html`
      <div class="toggle">
        ${this.themeToggle()}
      </div>
      <md-theme ?darkTheme=${this.darkTheme}>
        <div class="container">
          <h2 class="sandbox-header">Template Builder</h2>
          <div
            style=${`width: ${this.containerWidth}; height: ${this.containerHeight}; overflow: auto;`}
            class="widget-container"
          >
            <cjaas-template-builder
              template-id="Elena-Test-Template"
              profile-read-token=${profileReadToken}
              profile-write-token=${profileWriteToken}
              .mockedHistoricalEvents=${mockedTapeEvents}
              organization="demoassure"
              namespace="sandbox"
              base-url="https://uswest-nonprod.cjaas.cisco.com"
              bearerToken="eyJhbGciOiJSUzI1NiJ9.eyJjbHVzdGVyIjoiQTUyRCIsInByaXZhdGUiOiJleUpqZEhraU9pSktWMVFpTENKbGJtTWlPaUpCTVRJNFEwSkRMVWhUTWpVMklpd2lZV3huSWpvaVpHbHlJbjAuLi1oN1F5VTlNZ21va0NyNFRpX2FxQlEua1c0NTRncGpwRnZPeVNqakVBcmw5RW11ZEdBZlp1NGM1SG9JSHpQelJQZGZ1NGhpaWp4NzNZa1JheHRKM0VzbFduWGduNTY4OGJNalFIQUoxZ01oQmkzRGlKaVp3elA0ZXZkdExOcWpLeWJfcGRsYTVvWmVWTkFzTlktVkFWNW5iTEJhbTlQRUlzNTVhOHJVQ1R6QnQ5MDVNbmRqeVE0WHo0LWdmZFQ3YWlfaHhQUjlJWXNXSVBFbFJHc3JPT0pxaTVJUThJei1fbldIUjhPM3JNc0ZIdjFydmRudDZ0VWt1THdMN3ZKYVdqdFBNYXB5Y0dsckFUZVNBdXNmVXFtV0xXWE1vMWZYdE5EZlZZcWJDT3FnTnduaWZtbEhKa1ViX1lZZi10Tjk5NXRXdnFYSzUtbm5YSVpVaEtQTzVXYWRsd0NhemhIRHRDbFBPbGlCbnlpLVhBOW5wMm5hX0hKWnZQTDRNTTI4OGVhc18xeThOZUsyR0VUaTFDQWNUbmFPMVlvMG5McHA3dk5OS19hOUt0cWJVUnlfUVB4aDViM2VwcDRSaENuWGRkcURNLTFoMHNVcmhycGYwRWtaUF9OaFhGbDJtTE1GelRPek5QV3BPeTdMNjNUeW5jYVJZSElTaGFQTGJ5ZXFqUHRxNW5NSVk3d3NTRmYxM1pCVV9DZnJVVzZEY0dDZHA5MkgteDJvY05GeU1JMXJuYmRnMzhjNlRCaFkxbmtxeGh6d19oRVNJeDhyeURjbFlvT0EtX2NvN2lsMktpQWw5WDRPVEZDMEdlRkVXS0hqNjBGWlBzVW1uTDY4blJ3TTJvRXJaLXhfRWlUXzdzaXN3R2VkaTFVSDlWNG5ScmNWRDZOT0l1bmNqRFV4dmNkYmtnaTlGMXVBN0JWTElYV0xWT3ZvcXpUbnFxNDhnUXdSUkFsY281MWlDNi14bHNzQjJzSXYtQzRGNjFvczJzby1YaHlRM1ZaWEZfZ0RtTDhUS2RKUGZLb0hXQkRCeDJfRGJiLU50cUdhRC1jM1BTbHBQTjEtdE8tRkU3UnRLS1hXNnBibW1pRVFQYlYtaGhnODlEbUJHNjVSbTNSZnFLb0RaOXFIbTU5UzBSc3RxSkd6cnM2RlpHM2lsNlVvXzN5R1dnWFJXdUhXZ3NnaXo4R0pma3RSN0J6NFFjMDVGbFhaWVdIYXdhZTJzN0J4dFl5Zi1PNFQtOUpVZGRnNF9TdFR2ZFlYUFdSazdzZ3pKRGVSeGRKQ1g3VWpCMkFXTFY4ME5UNU56VXVfYklnUlpYdXE5QndfQWlsX3Nod1lCZy5IR1pmQ0NmYzFDenZxQkFWbngzejJ3IiwidXNlcl90eXBlIjoidXNlciIsInRva2VuX2lkIjoiQWFaM3IwTmpJeU1XRXpPVGN0WkRJd1pDMDBOV0prTFdJNVltVXRNRGxtWVRrek5qYzBNRFJoWmpJMk9UQTFOamt0WkROaiIsInJlZmVyZW5jZV9pZCI6ImYxYWFhMTAwLWQxZDMtNGJhOC04ZTRmLTUyNGU2Y2UyN2Y4MyIsImlzcyI6Imh0dHBzOlwvXC9pZGJyb2tlcmJ0cy53ZWJleC5jb21cL2lkYiIsInVzZXJfbW9kaWZ5X3RpbWVzdGFtcCI6IjIwMjIwNzI3MDY1MDQwLjI2NFoiLCJyZWFsbSI6IjFlYjY1ZmRmLTk2NDMtNDE3Zi05OTc0LWFkNzJjYWUwZTEwZiIsImNpc191dWlkIjoiOGIwMTU5NDMtMTNmNy00NzRjLTgwOGUtNWEyYTQzZDEyYjRiIiwidG9rZW5fdHlwZSI6IkJlYXJlciIsImV4cGlyeV90aW1lIjoxNjU5MDAxNDEwODU1LCJjbGllbnRfaWQiOiJDYzFlYjljYWJmOTdjYThiMzFiMGU0MTI1MDdjMGJlNmJiNWE2MmI5MTZhM2IxZDY4MDNkMWM4ZGU0YzM3MjM0ZiJ9.AlyVAPoEvHYLJ3BqirIL8aSYh1AcCpxHzRGgBGe62eRmTUHTmFay9FoPkZrIZSdEPD8wReWrC86lmL0bN5M7TyqwwJcyC2RS94xKjdUdHA46PrMF8tYwMPVmASXFsRJW6ml_8e6njzPRqeD6XbXpX2uDyDpcT1N9QIEmG9_SZDbr6_jrAfLbWHOEt8-RC3iKkmRgYSfZuh4uK2X2mKnqupmZX7vgiECdEFKoxEYHogvqG3r4x29E6e2c4wwlslwCmgGkfTtaV5F04OJcqqhEFR5izQIlw2IvKbWiwnxxJNQxWjlhg6EdXxVbJMET0RHw8XV1AY-FmkJrm46RPSDZ3Q"
            ></cjaas-template-builder>
          </div>
          <hr />
        </div>
      </md-theme>
    `;
  }
}
