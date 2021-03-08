# This is a reference implementation

## View

Creates a snapshot of an end user (customer) for Agent to cross verify while resolving issues via Call/Walk In.

## Usage

```html
<cjs-view
  id="view"
  customer="customerid"
  authToken="st=demoassure&so=sandbox&ss=stream&sp=w&se=2021-04-06T07:38:17Z&sk=sandbox&sig=xyz="
></cjs-view>
```

## Attributes

### customer (String)

Customer ID that was sent as 'person' in the data thats stored in the datasink.

### authToken (String)

Auth Signature needed to access data

### template (json)

Template for profile to be shown

```javascript
let viewComp = document.querySelector("#view");
viewComp.template = {
  Name: "Test Template 2",
  DatapointCount: 50,
  Attributes: [
    {
      Version: "0.1",
      Event: "Quote",
      Metadata: "email",
      DisplayName: "Email",
      AggregationType: 0,
      type: "tab",
      tag: "email"
    },
    {
      Version: "0.1",
      Event: "Quote",
      Metadata: "Make",
      DisplayName: "Make",
      AggregationType: 0,
      type: "table"
    },
    {
      Version: "0.1",
      Event: "Quote",
      Metadata: "Model",
      DisplayName: "Model",
      AggregationType: 0,
      type: "table"
    },
    {
      Version: "0.1",
      Event: "Quote",
      Metadata: "License Plate",
      DisplayName: "License Plate",
      AggregationType: 0,
      type: "table"
    },
    {
      Version: "0.1",
      Event: "Quote",
      Metadata: "firstName",
      DisplayName: "First Name",
      AggregationType: 0,
      tag: "name",
      type: "inline"
    },
    {
      Version: "0.1",
      Event: "Quote",
      Metadata: "street",
      DisplayName: "Street",
      AggregationType: 0,
      type: "table"
    },
    {
      Version: "0.1",
      Event: "Quote",
      Metadata: "apt",
      DisplayName: "Apt",
      AggregationType: 0,
      type: "table"
    },
    {
      Version: "0.1",
      Event: "Quote",
      Metadata: "city",
      DisplayName: "City",
      AggregationType: 0,
      type: "table"
    },
    {
      Version: "0.1",
      Event: "Quote",
      Metadata: "lastName",
      DisplayName: "Last Name",
      AggregationType: 0,
      tag: "name",
      type: "inline"
    }
  ]
};
```

types:

- inline - shows only the data
- table - shows data with displayName
- tab - shows the data in tabs, Attribute will be marked as Verbose in the API request

tag:

Shows predefined data in right place

- name
- email
