/**
 * Copyright (c) Cisco Systems, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export const agentContactData: any /** Service.Aqm.Contact.AgentContact["data"] **/ = {
  mediaResourceId:
    "Y2lzY29zcGFyazovL3VzL1JPT00vZjU2ZGZkYjAtNDBjNi0xMWVhLWFkZmEtMjUxMTJkZWVhNmEz",
  eventType: "RoutingMessage",
  agentId: "df276f7a-5113-4d30-831b-ba2d51010203",
  destAgentId: "",
  trackingId: "144389db-4ff8-448f-9fae-58a1ab020699",
  consultMediaResourceId: "43bfcdef-5551-45b1-a8f9-a0b33e66e3fe",
  interaction: {
    isFcManaged: false,
    isTerminated: false,
    mediaType: "chat",
    previousVTeams: ["3380"],
    state: "new",
    currentVTeam: "3381",
    participants: {
      customer: {
        id: "customer@gmail.com",
        pType: "Customer",
        type: "Customer",
      },
      "df276f7a-5113-4d30-831b-ba2d51010203": {
        name: "",
        pType: "Agent",
        teamName: "Dont_Use_Team",
        lastUpdated: 1590303024017,
        teamId: "964",
        isConsulted: false,
        hasJoined: true,
        dn: "9997770098",
        queueId: "3381",
        id: "df276f7a-5113-4d30-831b-ba2d51010203",
        sessionId: "088b040d-5480-4841-9b4b-f92a2f37797f",
        queueMgrId: "aqm",
        siteId: "472",
        type: "Agent",
        channelId: "0c80138c-1ed9-4b44-bb71-2c2ce8a5b0c7",
        isWrapUp: false,
      },
    },
    interactionId: "1627c9fb-7fdd-49a6-a7a9-56c69c4e6199",
    orgId: "f222e3af-1a53-42ef-9deb-7520034b8a10",
    callProcessingDetails: {
      QMgrName: "aqm",
      taskToBeSelfServiced: "false",
      ani: "paul@gmail.com",
      dnis: "AgentX",
      tenantId: "133",
      QueueId: "3381",
      vteamId: "AXCZ08NEefBr7nI0lIIV",
      pauseResumeEnabled: "true",
      pauseDuration: "30",
      isPaused: "false",
      recordInProgress: "false",
      ctqInProgress: "false",
      outdialTransferToQueueEnabled: "true",
      convIvrTranscript: "true",
      fromAddress: "paul@gmail.com",
      customerName: "Paul Potter",
      virtualTeamName: "TeamX",
      ronaTimeout: "30",
      category: "none",
      reason: "none",
      sourceNumber: "100",
      sourcePage: "100",
      appUser: "user",
      customerNumber: "+12065554518",
      reasonCode: "33",
      IvrPath: "none",
      pathId: "100",
    },
    media: {},
    owner: "43bfcdef-5551-45b1-a8f9-a0b33e66e3fe",
    mediaChannel: "chat",
    contactDirection: {
      type: "INBOUND",
    },
    callFlowParams: {
      Sales: {
        name: "Sales",
        qualifier: "vteam",
        description: "(vteam, A valid VTeam.)",
        valueDataType: "string",
        value: "3381",
      },
    },
  },
  interactionId: "1627c9fb-7fdd-49a6-a7a9-56c69c4e6199",
  orgId: "f222e3af-1a53-42ef-9deb-7520034b8a10",
  owner: "43bfcdef-5551-45b1-a8f9-a0b33e66e3fe",
  ronaTimeout: 30,
  isConsulted: false,
  isConferencing: false,
  updatedBy: undefined,
  queueMgr: "",
  type: "",
};

export const buddyAgentPayload: any /** Service.Aqm.Contact.BuddyAgents **/ = {
  agentProfileId: "AXCLfZhH9S1oTdqE1OFw",
  channelName: "chat",
  state: "Available",
};

export const vTeamListpayload: any /** Service.Aqm.Contact.VTeam **/ = {
  agentProfileId: "AXCLfZhH9S1oTdqE1OFw",
  agentSessionId: "5a84d32c-691b-4500-b163-d6cdba2a3163",
  channelType: "chat",
  type: "inboundqueue",
};

export const consultQueue: any /** Service.Aqm.Contact.ConsultQueue **/ = {
  agentId: "df276f7a-5113-4d30-831b-ba2d51010203",
  queueId: "3268",
  trackingId: "3d0ab7d7-e92a-4b24-a238-92f940e64489",
};

export const consultAgent: any /** Service.Aqm.Contact.ConsultAgent **/ = {
  agentId: "df276f7a-5113-4d30-831b-ba2d51010203",
  destAgentDN: "9997770095",
  destAgentId: "299b728a-d6f8-4934-8fad-577525c0b7fc",
  destAgentTeamId: "960",
  destSiteId: "472",
  mediaType: "telephony",
  trackingId: "3d0ab7d7-e92a-4b24-a198-92f940e64489",
};

export const consultDN: any /** Service.Aqm.Contact.ConsultDN **/ = {
  destAgentId: "9997770095",
  destinationType: "DN",
  mediaType: "telephony",
  trackingId: "3d0ab7d7-e92a-2324-a198-92f940e64489",
};

export const vteamTransferMockPayLoad = {
  vteamId: "AXDiuOLjKin42Ov3QJXN",
  vteamType: "inboundqueue",
};

export const blindTransferMockPayLoad = {
  agentId: "f795f41f-3782-44fa-97a4-c8b4dc029477",
  destAgentId: "299b728a-d6f8-4934-8fad-577525c0b7fc",
  mediaType: "chat",
  destAgentTeamId: "964",
  destAgentDN: "9997770095",
  destSiteId: "472",
};

export const consultTransferMockPayLoad = {
  agentId: "43bfcdef-5551-45b1-a8f9-a0b33e66e3fe",
  destAgentId: "f795f41f-3782-44fa-97a4-c8b4dc029477",
  mediaType: "telephony",
  mediaResourceId: "b102ed10-fac2-4f8e-bece-1c2da6ba6dd8",
};

export const sampleEvent = {
  data: {
    page: {
      path: "/auto",
      referrer: "",
      search: "",
      title: "Car Insurance | Full Coverage Auto Insurance | Demo Assure",
      url: "https://www.demoassure.com/auto",
    },
  },
  datacontenttype: "application/json",
  id: "8783c5ff-8f93-46ec-81a3-ee55b859416c",
  person: "560018-Venki",
  source: "Website",
  specversion: "1.0",
  time: "2021-01-18T06:19:16.783Z",
  type: "Page Visit",
};

export const sampleTemplate = {
  Name: "Test Template 2",
  DatapointCount: 1000,
  Attributes: [
    {
      Version: "0.1",
      Event: "Quote",
      Metadata: "email",
      DisplayName: "Email",
      AggregationMode: "Value",
      tag: "email",
      Limit: 1,
      attributes: {
        type: "tab",
      },
    },
    {
      Version: "0.1",
      Event: "Quote",
      Metadata: "Make",
      DisplayName: "Make",
      AggregationMode: "Value",
      Limit: 1,
      attributes: {
        type: "table",
      },
    },
    {
      Version: "0.1",
      Event: "Quote",
      Metadata: "Model",
      DisplayName: "Model",
      Limit: 1,
      AggregationMode: "Value",
      attributes: {
        type: "table",
      },
    },
    {
      Version: "0.1",
      Event: "Quote",
      Metadata: "License Plate",
      DisplayName: "License Plate",
      Limit: 1,
      AggregationMode: "Value",
      attributes: {
        type: "table",
      },
    },
    {
      Version: "0.1",
      Event: "Quote",
      Metadata: "ltv",
      DisplayName: "LTV",
      AggregationMode: "Value",
      Limit: 1,
      attributes: {
        type: "table",
      },
      // eslint-disable-next-line prettier/prettier
      formatValue: (val: string) => {
        if (val) {
          return `$${val.match(/\d\d\d/g)?.join(",")}`;
        }

        return val;
      },
    },
    {
      Version: "0.1",
      Event: "Quote",
      Metadata: "firstName",
      DisplayName: "First Name",
      Limit: 1,
      AggregationMode: "Value",
      tag: "name",
    },
    {
      Version: "0.1",
      Event: "Entered ZipCode",
      Limit: 1,
      Metadata: "zipCode",
      DisplayName: "Zip Code",
      AggregationMode: "Value",
      attributes: {
        type: "table",
      },
    },
    {
      Version: "0.1",
      Event: "Quote",
      Metadata: "street",
      DisplayName: "Street",
      Limit: 1,
      AggregationMode: "Value",
      attributes: {
        type: "table",
      },
    },
    {
      Version: "0.1",
      Event: "Quote",
      Limit: 1,
      Metadata: "apt",
      DisplayName: "Apt",
      AggregationMode: "Value",
      attributes: {
        type: "table",
      },
    },
    {
      Version: "0.1",
      Event: "Quote",
      Limit: 1,
      Metadata: "city",
      DisplayName: "City",
      AggregationMode: "Value",
      attributes: {
        type: "table",
      },
    },
    {
      Version: "0.1",
      Limit: 1,
      Event: "Quote",
      Metadata: "lastName",
      DisplayName: "Last Name",
      AggregationMode: "Value",
      tag: "name",
    },
  ],
};
