/**
 * Copyright (c) Cisco Systems, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

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