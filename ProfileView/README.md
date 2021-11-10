# CJaaS Profile View Widget

This widget uses CJaaS Common Components to output a combined customer profile view that includes Profile information an ACtivity Timeline side by side. This code can be used as is, or be starter code for your own Custom Widget.

## Profile Widget Properties

The CJaaS Profile Widget accepts specific properties to interact with the CJaaS API

`@prop stream-read-token`: SAS Token for reading stream API
`@prop tape-read-token`: SAS Token for reading tape API
`@prop profile-token`: SAS Token for POST operations on Profile endpoint
`@attr customer` : Current customer ID to show
`@attr template-id` : ID of profile view template to retrieve from API
`@attr base-url` : Base URL for API calls
`@attr limit` : Set max number of timeline items to render by default

```html
<cjaas-profile-view-widget
  template-id="second-template"
  customer="30313-Carl"
  base-url="https://cjaas-devus2.azurewebsites.net"
  profile-token=${your-token}
  tape-read-token=${your-token}
  stream-read-token=${your-token}
></cjaas-profile-view-widget>
```

## Dev Environment: Getting Started
- Create a `.env` file that contains `PRIVATE_KEY="key from your admin portal when app created"`
- in `sandbox.ts`, pass the correct ORGANIZATION, NAMESPACE, and APP_NAME values from your admin portal
- run `yarn install`
- run `yarn start`
- navigate browser to `localhost:8888`

## Using in Deployment
- Create a `.env` file that contains `PRIVATE_KEY="key from your admin portal when app created"`
- Where used in your app, pass the correct ORGANIZATION, NAMESPACE, and APP_NAME values from your admin portal

## Build and Deploy Modules
If you are using this widget as a starter for your own custom needs, follow these steps to publish it for your use.

Once your widget is complete, it must be exported as a JS module that can be delivered via CDN. The build is configured to export a Web Component that can be used in your project.

- run `yarn dist` to create a compiled, minified JS module
- rename and upload the bundled module to your hosting service
- import according to your web application's config.
  A basic usage may look like this, inside your applications `index.html`:

```html
<!-- ProfileView widget -->
<script src="https://cjaas.cisco.com/web-components/v6/profile-3.0.0.js"></script>
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

## Localization & Named Slots

Default messages appear for conditions when profile data is missing or a profile cannot be fetched. These, as well as the widet header text, can be replaced with your own Localized language by targeting the correct named slots, as shown below:

````html
<cjaas-profile-view-widget>
  <h3 slot="l10n-header-text">Texto de encabezado personalizado</h3>
  <h4 slot="l10n-no-data-message">No hay datos para mostrar</h4>
  <h4 slot="l10n-no-profile-message">No hay perfil disponible</h4>
</cjaas-profile-view-widget>
```

Please feel free to reach out to your partner or Cisco directly with any additional questions.

