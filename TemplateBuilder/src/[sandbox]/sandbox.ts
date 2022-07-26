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
    // const profileWriteToken =
    //   "so=demoassure&sn=sandbox&ss=profile&sp=w&se=2022-05-11T13:22:08.801601300Z&sk=journeyUi&sig=J4K%2FuJqzGG%2F0RJhMc%2B7jhmKBLXhdnpMkz1RoaTOIKds%3D";
    // const profileReadToken =
    //   "so=demoassure&sn=sandbox&ss=profile&sp=r&se=2022-05-11T13:22:08.799987400Z&sk=journeyUi&sig=6TrHnhzW74AZFqXDAV9DZHC1CcV7cn2rAF3Q4tCkIOs%3D";

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
            <!-- template-id="second-template" -->
            <cjaas-template-builder
              template-id="journey-default-template"
              profile-read-token=${profileReadToken}
              profile-write-token=${profileWriteToken}
              .mockAction=${mockedTapeEvents}
              organization="demoassure"
              namespace="sandbox"
              base-url="https://uswest-nonprod.cjaas.cisco.com"
              bearerToken="eyJhbGciOiJSUzI1NiJ9.eyJjbHVzdGVyIjoiQTUyRCIsInByaXZhdGUiOiJleUpqZEhraU9pSktWMVFpTENKbGJtTWlPaUpCTVRJNFEwSkRMVWhUTWpVMklpd2lZV3huSWpvaVpHbHlJbjAuLlRYM1hLYzdONW9RYS1iTlh6MXRPSlEuOHIteHYwYlBTYlUtTFUzbUdDc0s4UE9OR0tvMm1lTHdXM0J1aTFHM3ZGYVAyblI2ZHpaSXdtREtsWlRCMHloWmI1QlJoLVl3aFBmSS10VnVNcUw1WEhhUVBOWVYwTDB6TnZXVWFTOVFXQ1ExUVpEYW1FVHlwcU9aWUdSQUxYZmlINmxLQl92aXltdlJsNVR2RXNoY1RuY2E4V2NHenNxTXhsQ2o2RWpHMWNOUDkxdWRtT0ZtRVZzWWk3Rjl5MkVqdU53bnRUOWNGR1BsbTNEMW9rVFJYTFBxak82MXEycU9xcWNvQldmbzVmOTVsZ2pwUHhOZTBlTGVmVXpRVTIxY1BFUzJmcHpCZEgwNUJjV3F4ZDduNDRaOFBRZHpPRC1LM0hrQ01xcS1TSWhqU1VQVDQ0a0RrTktENmdpZ0tpRXpSY2RYWTM1WXB1ZDVnckV1WHNTb2s5NGhmUEZyQ2JtRlVfVlNKY2dwOVRzS2RGdlJ3T1A4SGFJSkROZjFHc0lxcWRHTW5sSFZ0WHRQcXNMTmdUcVZQajNKRm9FcUhPLU9RQm1ET3FSbTRlbXQ5WDc0bF9XNVhXRjVYNFlQdXk2TnoxY016dm9JdFlPYXJUMVVjbTBpb21IMlhEQnM2UG5JUXM4SVJWRTF1ZE94aFhwZVppOURqMVFtZjRZM3k5ejkyTnZxdF9kbUk1c0RyblVQSVpjSU1wcFEtM1R2VkVhbm10NEUyMzlQRnpKWTN5U3ZUV01OYnlmVWZNODNYUm01UjE3UFFsY2pjbG8xcm9ORi14bGxkMzlPSTBMeUVhdG5KN1VsbExtUVZmRTBHTWMzVzFfWVJleHN1dmZVanBSdkl3aTMyMElIQnQ5eFBLRVJHc2o1Q1dJYzZKWFdIMTdIVTE5RmY5ZDd5MzB2SlZua0lPVTNBZXNYZF9GaUc0NElqamZiLVpQUm4xVXFTeHNyY0dPR0N6VTBSc0VpTk9MR1FvYnNPb1d0SXE2elFPTGpMNU16dzhMdTYtMDhhaG9IalVXcGVnZVBOXzdOUWlPM3pmejloQWM3YWh6NE1NaHFObjJoaHBSUzllZjUtRkdRVjlXa3NKelZPaXFKam5QTkoyMmYtbTlpNktxRWx0dmhqZTZ1blF2dkhMdF9iV2htMVQ3cGlXandJa19iZ1lCakxMby16X0pyY3dvNjVxem84eDBPTHp2elpnOVJiSmhrUEVqcnFmX3ZZOXd4RnJoTGVDSmo2Q1ZHYnY4RTRjY1pqLU5pWmxmRDl0M25meWkyV0p0cmtRN0ktOElKNEV3Zm0zemVwZy55X2MzVlh5a3lMbmJFSHRCU3FsSUR3IiwidXNlcl90eXBlIjoidXNlciIsInRva2VuX2lkIjoiQWFaM3IwTlRSaVl6ZG1NemN0WVRGak1DMDBaR1k1TFRrM1lqTXRZVFEwTVdWaU4yVmlZbVUzTmpreVlqRm1PREF0TjJabSIsInJlZmVyZW5jZV9pZCI6ImYxYWFhMTAwLWQxZDMtNGJhOC04ZTRmLTUyNGU2Y2UyN2Y4MyIsImlzcyI6Imh0dHBzOlwvXC9pZGJyb2tlcmJ0cy53ZWJleC5jb21cL2lkYiIsInVzZXJfbW9kaWZ5X3RpbWVzdGFtcCI6IjIwMjIwNzI2MDY1MzI1LjIxNFoiLCJyZWFsbSI6IjFlYjY1ZmRmLTk2NDMtNDE3Zi05OTc0LWFkNzJjYWUwZTEwZiIsImNpc191dWlkIjoiOGIwMTU5NDMtMTNmNy00NzRjLTgwOGUtNWEyYTQzZDEyYjRiIiwidG9rZW5fdHlwZSI6IkJlYXJlciIsImV4cGlyeV90aW1lIjoxNjU4OTMyODM3OTc5LCJjbGllbnRfaWQiOiJDYzFlYjljYWJmOTdjYThiMzFiMGU0MTI1MDdjMGJlNmJiNWE2MmI5MTZhM2IxZDY4MDNkMWM4ZGU0YzM3MjM0ZiJ9.b_pSiY7d8DGw2Ym_vPSi12OSzEgIdxBTsvBB0fwb5uccUJ6iNjzTTdVo69FLsu6ngG-r6hlhcR_tyvGwFwQxZrMqoLFcma-qrf9e2ZVpU42aKt2fCYTiANrz_1DSkNn1rYh34E1Ws4JOAyKWb4_IFthC8pwu179HwwcexjFgJCvXgOzVN3J5X4HoZOq8lMPMxZAhvtn7t1SPXRaQr4gFPMofAHYNTESOCkxeyM_yXmyKkql8Bn_vO299aHdI0rywLEkDARhbR2hF2ebye1jVrQVUmcI99Sekoc1jcX_T_3Js-4p7KulbMzaBZ1EtSA8SifF51drqrgR15Yjrpnm9Eg"
            ></cjaas-template-builder>
          </div>
          <hr />
        </div>
      </md-theme>
    `;
  }
}
