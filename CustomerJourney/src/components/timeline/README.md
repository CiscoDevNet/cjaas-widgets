## Timeline Component

This component will represent the activity events both past and realtime based on the given set of filters.

Filters can be used to dice the data for a matching user and other custom criteria.

## Usage

```html
<cjaas-timeline
  id="cjaas-timeline"
  type="journey-and-stream"
  stream-id="xyz"
  pagination="$top=15"
  render-as="bullets"
  limit="15"
>
</cjaas-timeline>
```

## Attributes

### stream-id (String)

SAS Authorization token for streaming events.

### filter (String)

Enables the component to build a query to fetch matching events.

- Comparison Operators: eq, ne, gt, ge, lt & le
- Logical Operators: and, or & not
- Precedence: (), not, gt, ge, lt & le
- Aggregation Modifiers: sort, count & distinct

Example:

- id eq ‘123XX’ and (event eq ‘Login’ or event eq ‘Add To Cart’)
- id eq ‘123XX’ and source eq ‘Website’

Properties (like id, event, source) used in the filter are combination of standard properties and custom properties. Such properties separated by spaces form the filter.

### paginations (string)

String sparated by '&' with key as one of the bottom 2 properties.

- \$top - returns top n records
- \$skip - skip n records

Example:

- $top=20&$skip=10

### type (string)

Configures the widget to any of three functional modes

- 'journey' - returns list of events that match the given filter
- 'livestream' - connects to the livestream of events that match the given filters in realtime
- 'journey-and-stream' - starts with journey data and then connects to livestream
