# CJaaS Timeline Widget

This widget uses CJaaS Common Components to output a combined customer Timeline that includes Timeline information.

## Timeline Widget Properties

The CJaaS Timeline Widget accepts specific properties to interact with the CJaaS API

- _customer: string_ - an identifier of the customer, i.e. "560000-John"
- _template: any | JSON | Object_ - for user-provided data-shape template.
- _auth-token: string_ - an unique Auth token to enable the CJaaS tape stream. You can get a token here: https://forms.office.com/Pages/ResponsePage.aspx?id=Yq_hWgWVl0CmmsFVPveEDqqpouLp2otDkH7uBREgKh5URVhNWkY2M0lOTE83M05FTzg2TERLMVdTWS4u
- _base-url: string_ - defaults to "https://trycjaas.exp.bz" at present, can be modified for changing APIs

```html
<cjaas-timeline-widget
  type="journey-and-stream"
  auth-token="<your-auth-token>"
  limit="15"
></cjaas-timeline-widget>
```

## Setup

Install dependencies:

`npm install` or `yarn`

## Development

### Getting started

To run your widget on `localhost`, please navigate to widget's root directory in Terminal (Command line tool) and run the following commands (Assuming you have [`yarn`](https://classic.yarnpkg.com/en/docs/install/#mac-stable) installed globally on your machine):

1. Clone this repo.
2. Navigate to th widget/widget starter folder.
3. Run `yarn` from the root of the repo.
4. Run `yarn start` or `npm run start` to start the playground (sandbox) app.

### Editing widget

There is generally no need for you to modify anything outside of the `src/components` folder. To customize you widget, we suggest for you to work within this directory. You are free to create your components and structure them however you see fit.

### Building/exporting widget

Once you are ready to export your widget, all you need is to run the following command in Terminal (Command line tool):
Note: Built on Node version 10.13.0 (will be upgraded in near future)

```
yarn dist
```

This will create a `dist` folder in the root directory of your widget with generated files.
`index.js` file that contains your entire set of widgets. `widget.js` contains the Timeline widget that can be plugged into dashboards like Webex CC Agent Dashboard. Additionally, it generates the fonts, icons and its styles necessary for the components to use momentum icons & fonts. Your host web page needs to import these resources. These files can be renamed and uploaded to a preferred location on a CDN (e.g. an S3 bucket on AWS. Please keep in mind that this file has to be publicly available over the internet to be accessible to Agent or Supervisor Desktop).

```
<script src="PATH TO YOUR WIDGET/INDEX.JS"></script>
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

**NOTE**: If you place this widget in another area in JSON layout specification ("header" or a custom page in "navigation"), some task-specific function might not work. This is to be expected.

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

Please feel free to reach out to your partner or Cisco directly with any
additional questions.