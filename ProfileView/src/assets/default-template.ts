export const defaultTemplate = {
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
