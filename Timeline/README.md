# CJaaS Timeline Widget

This widget uses CJaaS Common Components to output a combined customer Timeline that includes Timeline information.

## Timeline Widget Properties

The CJaaS Timeline Widget accepts specific properties to interact with the CJaaS API

- `type: string` - setting for stream style
- `template: any | JSON | Object` - for data-shape template.
- `tape-token: string` - SAS Token for tape GET operations
- `stream-token: string` - SAS Token for tape stream subscription operations
- `limit: number` - set how many events to display
- `base-url: string` - defaults to "https://trycjaas.exp.bz" at present, can be modified for changing APIs

```html
 <cjaas-timeline-widget
    id="timeline-widget"
    type="journey-and-stream"
    tape-token="so=demoassure&sn=sandbox&ss=tape&sp=r&se=2022-06-16T19:11:33.176Z&sk=sandbox&sig=7G8UdEipQHnWOV3hRbTqkNxxjQNHkkQYGDlCrgEhK0k="
    stream-token="so=demoassure&sn=sandbox&ss=stream&sp=r&se=2022-06-17T19:18:05.538Z&sk=sandbox&sig=nJOri1M66leDMnfL93UlufHegDf3hAwoQ/Mj37ReQBs="
    limit=15
    base-url="https://uswest-nonprod.cjaas.cisco.com"
></cjaas-timeline-widget>
```

## Getting Started
- `cd` into the project folder
- run `yarn install`
- run `yarn start`
- navigate browser to `localhost:8888`

## Build and Deploy Modules
Once your widget is complete, it must be exported as a JS module that can be delivered via CDN. The build is configured to export a Web Component that can be used in your project.
- run `yarn dist` to create a compiled, minified JS module
- rename and upload the bundled module to your hosting service
- import according to your web application's config.
A basic usage may look like this, inside your applications `index.html`:
```html
<!-- Timeline widget -->
<script src="https://cjaas.cisco.com/web-components/v6/timeline-3.0.0.js"></script>
```

### Sharing widget information with Agent/Supervisor Desktop administrator

To be able to place your custom widget within Agent/Supervisor Desktop, Contact Center administrator will need three pieces of information:

1. The URL to the `***.js` file that you had previously generated and placed on a CDN.
2. Information regarding any properties/attributes that are required to be set for the widget to function (e.g. for Maps widget in th Examples folder, one will require to pass Google Maps API key to an `api-key` attribute).

   If you require dynamic data from Agent/Supervisor Desktop, you might want to either request it though [`wxcc-js-api`](https://apim-dev-portal.appstaging.ciscoccservice.com/documentation/guides/desktop#javascript-api) methods within your widget, or through properties - when the list of [Data Providers](https://apim-dev-portal.appstaging.ciscoccservice.com/documentation/guides/desktop#data-provider%E2%80%94widget-properties-and-attributes) contains the required information.

3. A quick preview/screenshot or the aspect ratio that is optimal for this widget. This way, an administrator will be able to make the best decision while placing it on the Desktop layout.

### Placing Widget in JSON layout

**Reference**: [Desktop Layout Reference guide for Administrator](https://www.cisco.com/c/en/us/td/docs/voice_ip_comm/cust_contact/contact_center/CJP/SetupandAdministrationGuide_2/b_mp-release-2/b_cc-release-2_chapter_011.html#topic_8230815F4023699032326F948C3F1495).

In case you are an administrator for Contact Center Agent Desktop or are working with an administrator, you might be trying to place this component in a JSON layout specification file to test in your Contact Center environment.

This specific Widget Starter is designed to be places in a ["panel"](https://www.cisco.com/c/en/us/td/docs/voice_ip_comm/cust_contact/contact_center/CJP/SetupandAdministrationGuide_2/b_mp-release-2/b_cc-release-2_chapter_011.html#topic_BF0EBDF65DCB0A552164D6306657C892__AuxPane) area of JSON layout specification. This is due to this widget relying on a task-specific information with the reference derived from the current location/address bar value.

## Localization

By default, if a timeline cannot be returned the widget will print "No Timeline available". This can be replaced via a named slot for your custom or localized text content:

```html
<cjaas-timeline-widget
  id="timeline-widget"
  type="journey-and-stream"
  auth-token="missing"
  limit="15"
>
  <h3 slot="ll10n-no-timeline-message">No hay línea de tiempo disponible</h3>
</cjaas-timeline-widget>
```

Please feel free to reach out to your partner or Cisco directly with any additional questions.
