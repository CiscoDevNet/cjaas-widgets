# JDS Customer Journey Widget

This widget uses the CJaaS API to display an individual customer's journey as a history of events. It first retrieves the complete event history from the tape endpoint and compiles toggles for all event types, and then subscribes to a live stream of new events so they appear in real time. This code can be used as is, or be starter code for your own Custom Widget. It also embodies Identity Alias management and Profile view with a tempate named 'journey-default-template' 

## Customer Journey Widget Properties

The CJaaS Profile Widget accepts specific properties to interact with the CJaaS API
<!-- THIS version adheres to the endpoints at `https://cjaas-devus2.azurewebsites.net` -->

`@attr stream-read-token`: SAS Token for reading stream API

`@attr tape-read-token`: SAS Token for reading tape API

`@attr profile-read-token`: SAS Token for read operations on Profile endpoint

`@attr profile-write-token`: SAS Token for POST operations on Profile endpoint

`@attr identity-read-token`: SAS Token for read operations on Identity endpoint

`@attr identity-write-token`: SAS Token for POST operations on Identity endpoint

`@attr base-url` : Path to the proper Customer Journey API deployment

`@attr customer` : Customer ID used for Journey lookup

`@attr user-search` : Toggles display of field to find new Journey profiles

`@attr limit` : Set the number of Timeline Events to display

`@attr template-id` : Property to set the data template to retrieve customer Profile in desired format

`@prop eventIconTemplate` : Property to pass in JSON template to set color and icon settings

The following example of use with the production endpoint
```html
 <customer-journey-widget
   limit="20"
   customer="foobar"
   .eventIconTemplate=${iconData}
   base-url="https://jds-prod-pf-westus-apim.azure-api.net"
   .tapeReadToken=${TAPE_READ_TOKEN}
   .streamReadToken=${STREAM_READ_TOKEN}
   .profileReadToken=${PROFILE_READ_TOKEN}
   .profileWriteToken=${PROFILE_WRITE_TOKEN}
   .identityReadToken=${IDENTITY_READ_TOKEN}
   .identityWriteToken=${IDENTITY_WRITE_TOKEN}
 ></customer-journey-widget>
```

## Dev Environment: Getting Started
- Create a `.env` file that contains the following secrets
```
TAPE_READ_TOKEN="tape read sas token"
STREAM_READ_TOKEN="stream read sas token"
PROFILE_READ_TOKEN="profile read sas token"
PROFILE_WRITE_TOKEN="profile write sas token"
IDENTITY_READ_TOKEN="identity read sas token"
IDENTITY_WRITE_TOKEN="identity write sas token"
```
- run `yarn install`
- run `yarn start`
- navigate browser to `[localhost:8889](http://localhost:8889/)`

## Using in Deployment
- Create a `.env` file that contains below secrets for production
```
TAPE_READ_TOKEN="tape read sas token"
STREAM_READ_TOKEN="stream read sas token"
PROFILE_READ_TOKEN="profile read sas token"
PROFILE_WRITE_TOKEN="profile write sas token"
IDENTITY_READ_TOKEN="identity read sas token"
IDENTITY_WRITE_TOKEN="identity write sas token"
```
- Where used in your app, pass the correct ORGANIZATION, NAMESPACE, and APP_NAME values from your admin portal

## Build and Deploy Modules
If you are using this widget as a starter for your own custom needs, follow these steps to publish it for your use.

Once your widget is complete, it must be exported as a JS module that can be delivered via CDN. The build is configured to export a Web Component that can be used in your project.
- run `yarn dist` to create a compiled, minified JS module
- navigate to `CustomerJourney/dist/index.js`
- rename and upload the bundled module (index.js) to your hosting service
- import according to your web application's config.

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

# Adding Widget to CCE/CCX
Customer Journey widget can be added to CCE and CCX agent dashboards as gadgets. It needs a wrapper component that sets the theme for the widget. 

## Generate Query String for Gadget
Use any of cjaas-sdk tools from https://github.com/CiscoDevNet/cjaas-sdk to generate sas-tokens.

## Add gadget to admin config
1. In the admin portal of CCE/CCX dashboard, edit desktop layout xml.
2. Add gadget config with supported queryStrings to agent desktop config in appropriate place.

``` xml
<gadget>{Cloud hosted location}/finesse/CiscoJDSCustomerJourneyGadget.xml?profileReadToken=so%3Ddemoassure%26sn%3Dsandbox%26ss%3Dprofile%26sp%3Dr%26se%3D2022-05-05T09%3A13%3A31.505017500Z%26sk%3DjourneyUi%26sig%3DoX7V4ajfaknNJ3tcnOTNpFJQ4uwTztbomVp%252BWmJb4%253D&profileWriteToken=so%3Ddemoassure%26sn%3Dsandbox%26ss%3Dprofile%26sp%3Dw%26se%3D2022-05-05T09%3A13%3A31.506625800Z%26sk%3DjourneyUi%26sig%3DSD%252Fc7pmz%252Buc5qXB44%252FfXDeSd4C9dq8Ub%252F2TieK%252FOM%253D&streamReadToken=so%3Ddemoassure%26sn%3Dsandbox%26ss%3Dstream%26sp%3Dr%26se%3D2022-05-05T09%3A13%3A31.507991400Z%26sk%3DjourneyUi%26sig%3DUjo16g0oPXyOUc25JXe5NqMNIRSJpgCmz7DT3OZC6%252BM%253D&tapeReadToken=so%3Ddemoassure%26sn%3Dsandbox%26ss%3Dtape%26sp%3Dr%26se%3D2022-05-05T09%3A13%3A31.509055200Z%26sk%3DjourneyUi%26sig%3DPAM7q9A8R1C10YW8wIvScG6yAoGtW97nnwE60BqRI%253D&identityReadToken=so%3Ddemoassure%26sn%3Dsandbox%26ss%3Didmt%26sp%3Dr%26se%3D2022-05-05T09%3A13%3A31.510959300Z%26sk%3DjourneyUi%26sig%3Dp9wWUjp%252Bde965kRL05iI%252FFDEAAL2f0g7COrtFVZiU%253D&identityWriteToken=so%3Ddemoassure%26sn%3Dsandbox%26ss%3Didmt%26sp%3Dw%26se%3D2022-05-05T09%3A13%3A31.511875Z%26sk%3DjourneyUi%26sig%3DbQGGM%252FYAqHrCQRbVTKfX3dZA%252BlGVQfjcxO2JMrdY8%253D&
minHeight=480px&
profileTemplate=new-template</gadget>
```
