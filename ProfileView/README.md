# CJaaS Profile View Widget

This widget uses CJaaS Common Components to output a combined customer profile view that includes Profile information an ACtivity Timeline side by side.

## Profile Widget Properties

The CJaaS Profile Widget accepts specific properties to interact with the CJaaS API

- `customer: string` - an identifier of the customer, i.e. "560000-John"
- `template: any | JSON | Object` - for user-provided data-shape template.
- `tape-read-token: string` - SAS token for CJaaS tape GET operations
- `profile-read-token: string` - SAS token for profile endpoint GET operations
- `profile-write-token: string` - SAS token for profile endpoint POST operations (necessary for sending the template object)
- `stream-token: string` - SAS token for stream endpoint subscription
- `base-url: string` - Base URL for all typical CJaaS endpoints
- `base-stream-url: string` - Temp stream URL differs from Base URL

```html
<cjaas-profile-view-widget
    customer="560021-Venki"
    .template=${sampleTemplate}
    tape-read-token="so=demoassure&sn=sandbox&ss=tape&sp=r&se=2022-06-16T19:11:33.176Z&sk=sandbox&sig=etc"
    profile-write-token="so=demoassure&sn=sandbox&ss=profile&sp=w&se=2022-06-17T21:36:08.050Z&sk=sandbox&sig=etc"
    stream-token="so=demoassure&sn=sandbox&ss=stream&sp=r&se=2022-06-17T19:18:05.538Z&sk=sandbox&sig=etc"
    timelineType="journey-and-stream"
    base-url="https://uswest-nonprod.cjaas.cisco.com"
    base-stream-url="https://cjaas-devus1.azurewebsites.net"
></cjaas-profile-view-widget>
```

## Getting started

**NOTE:** _Use Node version 12_

To run your widget on `localhost`, please navigate to widget's root directory in Terminal (Command line tool) and run the following commands (Assuming you have [`yarn`](https://classic.yarnpkg.com/en/docs/install/#mac-stable) installed globally on your machine):

1. Clone this repo.
2. Navigate to the widget folder.
3. Run `yarn install`
4. Run `yarn start` to start the sandbox app.

## Build and Deploy Modules
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
<cjaas-profile-view-widget
  id="view"
  customer="560021-Venki"
  .template="${sampleTemplate}"
  auth-token="missing"
  timelineType="journey-and-stream"
>
  <h3 slot="l10n-header-text">Texto de encabezado personalizado</h3>
  <h4 slot="l10n-no-data-message">No hay datos para mostrar</h4>
  <h4 slot="l10n-no-profile-message">No hay perfil disponible</h4>
</cjaas-profile-view-widget>
```

Please feel free to reach out to your partner or Cisco directly with any
additional questions.
````
