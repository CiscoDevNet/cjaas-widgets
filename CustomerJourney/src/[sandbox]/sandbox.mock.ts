/**
 * Copyright (c) Cisco Systems, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export const mockedProfileViewPayload = {
  "meta": {
    "orgId": "a5b3eae5-f59a-4b4d-bfbb-8f06b32d91f7"
  },
  "data": [
    {
      "name": "journey-default-template",
      "personId": "egiere@cisco.com",
      "searchFilter": "",
      "generatedAt": "2022-05-12T18:31:44.275Z",
      "attributeView": [
        {
            "queryTemplate": {
                "version": "0.1",
                "event": "cjds:any",
                "metadataType": "string",
                "metadata": "firstName",
                "limit": 1,
                "displayName": "First Name",
                "lookbackDurationType": "days",
                "lookbackPeriod": 50,
                "aggregationMode": "Value",
                "eventDataAggregators": null,
                "widgetAttributes": {
                    "type": "table"
                },
                "verbose": false
            },
            "result": "Elena",
            "error": null,
            "journeyEvents": null,
            "hasError": false
        },
        {
            "queryTemplate": {
                "version": "0.1",
                "event": "cjds:any",
                "metadataType": "string",
                "metadata": "lastName",
                "limit": 1,
                "displayName": "Last Name",
                "lookbackDurationType": "days",
                "lookbackPeriod": 50,
                "aggregationMode": "Value",
                "eventDataAggregators": null,
                "widgetAttributes": {
                    "type": "table"
                },
                "verbose": false
            },
            "result": "Giere",
            "error": null,
            "journeyEvents": null,
            "hasError": false
        },
        {
            "queryTemplate": {
                "version": "0.1",
                "event": "cjds:any",
                "metadataType": "string",
                "metadata": "phone",
                "limit": 1,
                "displayName": "Phone",
                "lookbackDurationType": "days",
                "lookbackPeriod": 50,
                "aggregationMode": "Value",
                "eventDataAggregators": null,
                "widgetAttributes": {
                    "type": "table"
                },
                "verbose": false
            },
            "result": "+180092347891",
            "error": null,
            "journeyEvents": null,
            "hasError": false
        },
        {
            "queryTemplate": {
                "version": "0.1",
                "event": "cjds:any",
                "metadataType": "string",
                "metadata": "email",
                "limit": 1,
                "displayName": "Email",
                "lookbackDurationType": "days",
                "lookbackPeriod": 50,
                "aggregationMode": "Value",
                "eventDataAggregators": null,
                "widgetAttributes": {
                    "type": "table"
                },
                "verbose": false
            },
            "result": "egiere@cisco.com",
            "error": null,
            "journeyEvents": null,
            "hasError": false
        },
        {
            "queryTemplate": {
                "version": "0.1",
                "event": "cjds:any",
                "metadataType": "string",
                "metadata": "address",
                "limit": 1,
                "displayName": "Address",
                "lookbackDurationType": "days",
                "lookbackPeriod": 50,
                "aggregationMode": "Value",
                "eventDataAggregators": null,
                "widgetAttributes": {
                    "type": "table"
                },
                "verbose": false
            },
            "result": "1 Bush St #1300, San Francisco, CA 94104",
            "error": null,
            "journeyEvents": null,
            "hasError": false
        }
      ]
    }
  ]
};

export const profileMock = [
  {
    query: {
      version: "0.1",
      event: "Quote",
      metadata: "email",
      displayName: "Email",
      aggregationMode: "Value",
      type: "tab",
      tag: "email",
      limit: 1,
      Verbose: true,
    },
    result: ["v3nki"],
    journeyevents: [
      {
        data: {
          firstName: "Venki",
          lastName: "V",
          email: "v3nki",
        },
        dataContentType: "application/json",
        id: "9cc22087-284d-46db-9e4e-fa7ed9723976",
        person: "560021-Venki",
        source: "Website",
        specVersion: "1.0",
        time: "2021-03-05T19:00:05.596Z",
        type: "Quote",
      },
    ],
  },
  {
    query: {
      version: "0.1",
      event: "Quote",
      metadata: "Make",
      displayName: "Make",
      aggregationMode: "Value",
      limit: 1,
      type: "table",
    },
    result: [""],
    journeyevents: null,
  },
  {
    query: {
      version: "0.1",
      event: "Quote",
      metadata: "Model",
      displayName: "Model",
      limit: 1,
      aggregationMode: "Value",
      type: "table",
    },
    result: [""],
    journeyevents: null,
  },
  {
    query: {
      version: "0.1",
      event: "Quote",
      metadata: "License Plate",
      displayName: "License Plate",
      limit: 1,
      aggregationMode: "Value",
      type: "table",
    },
    result: [""],
    journeyevents: null,
  },
  {
    query: {
      version: "0.1",
      event: "Quote",
      metadata: "ltv",
      displayName: "LTV",
      aggregationMode: "Value",
      limit: 1,
      type: "table",
    },
    result: [""],
    journeyevents: null,
  },
  {
    query: {
      version: "0.1",
      event: "Quote",
      metadata: "name",
      displayName: "First Name",
      limit: 1,
      aggregationMode: "Value",
      tag: "name",
      type: "inline",
    },
    result: ["Venki"],
    journeyevents: null,
  },
  {
    query: {
      version: "0.1",
      event: "Quote",
      limit: 1,
      metadata: "zipCode",
      displayName: "Zip Code",
      aggregationMode: "Value",
      type: "table",
    },
    result: [""],
    journeyevents: null,
  },
  {
    query: {
      version: "0.1",
      event: "Quote",
      metadata: "street",
      displayName: "Street",
      limit: 1,
      aggregationMode: "Value",
      type: "table",
    },
    result: ["street1"],
    journeyevents: null,
  },
  {
    query: {
      version: "0.1",
      event: "Quote",
      limit: 1,
      metadata: "apt",
      displayName: "Apt",
      aggregationMode: "Value",
      type: "table",
    },
    result: ["apt1"],
    journeyevents: null,
  },
  {
    query: {
      version: "0.1",
      event: "Quote",
      limit: 1,
      metadata: "city",
      displayName: "City",
      aggregationMode: "Value",
      type: "table",
    },
    result: ["bengaluru"],
    journeyevents: null,
  },
  {
    query: {
      version: "0.1",
      limit: 1,
      event: "Quote",
      metadata: "lastName",
      displayName: "Last Name",
      aggregationMode: "Value",
      tag: "name",
      type: "inline",
    },
    result: ["V"],
    journeyevents: null,
  },
];

export const profileViewMockTemplate = {
  Name: "Test Template 2",
  DatapointCount: 100,
  Attributes: [
    {
      version: "0.1",
      event: "Quote",
      metadata: "email",
      displayName: "Email",
      metadataType: "string",
      aggregationMode: "Value",
      type: "tab",
      limit: 1,
      tag: "email",
    },
    {
      version: "0.1",
      event: "Quote",
      metadata: "Make",
      metadataType: "string",
      displayName: "Make",
      aggregationMode: "Value",
      limit: 1,
      type: "table",
    },
    {
      version: "0.1",
      event: "Quote",
      metadataType: "string",
      metadata: "Model",
      displayName: "Model",
      aggregationMode: "Value",
      limit: 1,
      type: "table",
    },
    {
      version: "0.1",
      metadataType: "string",
      event: "Quote",
      metadata: "ltv",
      displayName: "LTV",
      aggregationMode: "Value",
      limit: 1,
      type: "table",
    },
    {
      version: "0.1",
      metadataType: "string",
      event: "Quote",
      metadata: "License Plate",
      displayName: "License Plate",
      aggregationMode: "Value",
      limit: 1,
      type: "table",
    },
    {
      version: "0.1",
      metadataType: "string",
      event: "Quote",
      metadata: "firstName",
      displayName: "First Name",
      aggregationMode: "Value",
      tag: "name",
      limit: 1,
      type: "inline",
    },
    {
      version: "0.1",
      event: "Entered ZipCode",
      metadataType: "string",
      metadata: "zipCode",
      displayName: "Zip Code",
      aggregationMode: "Value",
      limit: 1,
      type: "table",
    },
    {
      version: "0.1",
      event: "Quote",
      metadataType: "string",
      metadata: "street",
      displayName: "Street",
      aggregationMode: "Value",
      limit: 1,
      type: "table",
    },
    {
      version: "0.1",
      event: "Quote",
      metadataType: "string",
      metadata: "apt",
      displayName: "Apt",
      limit: 1,
      aggregationMode: "Value",
      type: "table",
    },
    {
      version: "0.1",
      event: "Quote",
      metadata: "city",
      displayName: "City",
      metadataType: "string",
      limit: 1,
      aggregationMode: "Value",
      type: "table",
    },
    {
      version: "0.1",
      event: "Quote",
      metadataType: "string",
      limit: 1,
      metadata: "lastName",
      displayName: "Last Name",
      aggregationMode: "Value",
      tag: "name",
      type: "inline",
    },
  ],
};

export const mockedTimelineItems: any = [
  {
    data: {
      firstName: "Jackson",
      lastName: "Browne",
      email: "jackson@gmail.com"
    },
    id: "mock22087-284d-46db-9e4e-0001",
    title: "Add To Cart",
    person: "560021-Venki",
    timestamp: "2021-02-16T05:00:05.596Z"
  },
  {
    data: {
      firstName: "Led",
      lastName: "Zeppelin",
      email: "zeppelin@gmail.com"
    },
    id: "mock22087-284d-46db-9e4e-2222",
    title: "Add To Cart",
    person: "560021-Venki",
    timestamp: "2021-03-17T01:00:05.596Z"
  },
  {
    data: {
      firstName: "Tom",
      lastName: "Petty",
      email: "tom@gmail.com"
    },
    id: "mock22087-284d-46db-9e4e-1110",
    title: "Add To Cart",
    person: "560021-Venki",
    timestamp: "2021-03-20T13:00:05.596Z"
  },
  {
    data: {
      firstName: "Bruce",
      lastName: "Springsteen",
      email: "springsteen@gmail.com"
    },
    id: "mock22087-284d-46db-9e4e-8888",
    title: "Add To Cart",
    person: "560021-Venki",
    timestamp: "2021-03-20T12:00:05.596Z"
  },
  {
    data: {
      firstName: "Janis",
      lastName: "Joplin",
      email: "joplin@gmail.com"
    },
    id: "mock22087-284d-46db-9e4e-4555",
    title: "Add To Cart",
    person: "560021-Venki",
    timestamp: "2021-03-05T19:00:05.596Z"
  }
];

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
      type: "tab",
      tag: "email",
      Limit: 1
    },
    {
      Version: "0.1",
      Event: "Quote",
      Metadata: "Make",
      DisplayName: "Make",
      AggregationMode: "Value",
      Limit: 1,
      type: "table"
    },
    {
      Version: "0.1",
      Event: "Quote",
      Metadata: "Model",
      DisplayName: "Model",
      Limit: 1,
      AggregationMode: "Value",
      type: "table"
    },
    {
      Version: "0.1",
      Event: "Quote",
      Metadata: "License Plate",
      DisplayName: "License Plate",
      Limit: 1,
      AggregationMode: "Value",
      type: "table"
    },
    {
      Version: "0.1",
      Event: "Quote",
      Metadata: "ltv",
      DisplayName: "LTV",
      AggregationMode: "Value",
      Limit: 1,
      type: "table",
      // eslint-disable-next-line prettier/prettier
      formatValue: (val: string) => {
        if (val) {
          return `$${val.match(/\d\d\d/g)?.join(",")}`;
        }

        return val;
      }
    },
    {
      Version: "0.1",
      Event: "Quote",
      Metadata: "firstName",
      DisplayName: "First Name",
      Limit: 1,
      AggregationMode: "Value",
      tag: "name",
      type: "inline"
    },
    {
      Version: "0.1",
      Event: "Quote",
      Limit: 1,
      Metadata: "zipCode",
      DisplayName: "Zip Code",
      AggregationMode: "Value",
      type: "table"
    },
    {
      Version: "0.1",
      Event: "Quote",
      Metadata: "street",
      DisplayName: "Street",
      Limit: 1,
      AggregationMode: "Value",
      type: "table"
    },
    {
      Version: "0.1",
      Event: "Quote",
      Limit: 1,
      Metadata: "apt",
      DisplayName: "Apt",
      AggregationMode: "Value",
      type: "table"
    },
    {
      Version: "0.1",
      Event: "Quote",
      Limit: 1,
      Metadata: "city",
      DisplayName: "City",
      AggregationMode: "Value",
      type: "table"
    },
    {
      Version: "0.1",
      Limit: 1,
      Event: "Quote",
      Metadata: "lastName",
      DisplayName: "Last Name",
      AggregationMode: "Value",
      tag: "name",
      type: "inline"
    }
  ]
};