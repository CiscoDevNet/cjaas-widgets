export const defaultTemplate = {
  Name: "Default Template",
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
      Metadata: "firstName",
      DisplayName: "First Name",
      Limit: 1,
      AggregationMode: "Value",
      tag: "name",
      type: "inline"
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
