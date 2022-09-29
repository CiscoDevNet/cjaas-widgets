# JDS Customer Journey Widget

This widget uses the JDS (Journey Data Services) APIs to display an individual customer's journey as a history of events. It first retrieves the complete event history from the tape endpoint and compiles toggles for all event channelTypes, and then subscribes to a live stream of new events so they appear in real time. This code can be used as is, or be starter code for your own Custom Widget. It also embodies Identity Alias management and Profile view with a tempate named 'journey-default-template' 

### Latest Version

customer-journey-8.0.7.js

### Customer Journey Widget Properties

<i>The JDS Customer Journey Widget accepts specific properties to interact with the JDS APIs</i>

* The following attributes and properties of JDS Widget are supported with the following version
```
https://cjaas.cisco.com/widgets/customer-journey-8.0.7.js
```

`@attr stream-read-token`: (<i>String</i>) - SAS Token for reading stream API (live stream events within Timeline)

`@attr tape-read-token`: (<i>String</i>) - SAS Token for reading tape API (historical events within Timeline)

`@attr profile-read-token`: (<i>String</i>) - SAS Token for read operations on Profile endpoint

`@attr profile-write-token`: (<i>String</i>) - SAS Token for POST operations on Profile endpoint

`@attr identity-read-token`: (<i>String</i>) - SAS Token for read operations on Identity endpoint (Alias Section)

`@attr identity-write-token`: (<i>String</i>) - SAS Token for POST operations on Identity endpoint (Alias Section)

`@attr base-url`: (<i>String</i>) - Path to the proper Customer Journey API deployment

`@attr customer`: (<i>String</i>) - Customer ID used for Journey lookup. (<i>PS: InteractionData always overrides customer attribute.</i>)

`@attr limit`: (<i>Number</i>) = 20 - Set the number of Timeline Events to display

`@attr template-id`: (<i>String</i>) = "journey-default-template" - Sets the data template to retrieve customer Profile in desired format.

`@attr logs-on`: (<i>Boolean</i>) = false - Turn on additional logging for deubgging

`@attr collapse-timeline-section`: (<i>Boolean</i>) = false - Toggle to have the Timeline Section collapsed at start up.

`@attr collapse-profile-section`: (<i>Boolean</i>) = false - Toggle to have the Profile Section collapsed at start up.

`@attr collapse-alias-section`: (<i>Boolean</i>) = false - Toggle to have the Alias Section collapsed at start up.

`@attr time-frame`: (<i>"All" | "24-Hours" | "7-Days" | "30-Days"</i>) = "All" - Set the time frame the timeline section has selected at start up.

`@attr live-stream`: (<i>Boolean</i>) = false - Toggle to set whether or not the timeline section is loading events in real time.

`@attr icon-data-path`: (<i>String</i>) - URL path of JSON template to set color and icon settings.

`@prop interactionData`: (<i>object</i>) - Agent Desktop Interaction Data. Needs to have an `ani` property within object. This allows the JDS Widget to auto-populate with the current customer that the agent is interacting with. This overrides the customer attribute.

`@prop eventIconTemplate`: (<i>json object</i>) = iconData (built-in) - Property to pass in JSON template to set color and icon settings.

## Examples 
### The following example is showcasing how to embed this widget within lit-element code
```html   
    <customer-journey-widget
      customer="John Smith"
      base-url="https://jds-us1.cjaas.cisco.com"
      tape-read-token=${TAPE_READ_TOKEN}
      stream-read-token=${STREAM_READ_TOKEN}
      profile-read-token=${PROFILE_READ_TOKEN}
      profile-write-token=${PROFILE_WRITE_TOKEN}
      identity-read-token=${IDENTITY_READ_TOKEN}
      identity-write-token=${IDENTITY_WRITE_TOKEN}
      .eventIconTemplate=${iconData}
      limit=${20}
      logs-on
      live-stream
      time-frame="30-Days"
      collapse-profile-section
      collapse-alias-section
      collapse-timeline-section
      icon-data-path="https://cjaas.cisco.com/widgets/iconMaps/defaultIcons.json"
    ></customer-journey-widget>
```

### An example of how to upload JDS widget into DesktopLayout.json for Agent Desktop
* In order to set the customer attribute, you must remove the interactionData property. The second example below demonstrates how to pass in customer.
* All boolean attributes default as false. If you want them to remain false, just don't pass it in at all.

```json
{
 "comp": "md-tab-panel",
 "attributes": {
  "slot": "panel",
  "class": "widget-pane"
 },
 "children": [
  {
    "comp": "customer-journey-widget",
    "script": "https://cjaas.cisco.com/widgets/customer-journey-8.0.7.js",
    "attributes": {	
       "base-url": "https://jds-us1.cjaas.cisco.com",
       "logs-on": "true",
       "tape-read-token": "<your-tape-read-token>",
       "profile-read-token": "<your-profile-read-token>",
       "profile-write-token": "<your-profile-write-token>",
       "stream-read-token": "<your-stream-read-token>",
       "identity-read-token": "<your-identity-read-token>",
       "identity-write-token": "<your-identity-write-token>",
       "live-stream": "true",
       "limit": "5",
       "time-frame": "30-Days",
       "collapse-profile-section": "true",
       "collapse-alias-section": "true",
       "collapse-timeline-section": "true",
       "icon-data-path": "https://cjaas.cisco.com/widgets/iconMaps/defaultIcons.json"
    },
    "properties": {
       "interactionData": "$STORE.agentContact.taskSelected"
    },
    "wrapper": {
        "title": "Customer Journey Widget",
        "maximizeAreaName": "app-maximize-area"
    }
  }
 ]
},
```

### Example setting customer attirbute
```json
{
 "comp": "md-tab-panel",
 "attributes": {
  "slot": "panel",
  "class": "widget-pane"
 },
 "children": [
  {
    "comp": "customer-journey-widget",
    "script": "https://cjaas.cisco.com/widgets/customer-journey-8.0.7.js",
    "attributes": {	
       "customer": "Ben Smith",
       "base-url": "https://jds-us1.cjaas.cisco.com",
       "tape-read-token": "<your-tape-read-token>",
       "profile-read-token": "<your-profile-read-token>",
       "profile-write-token": "<your-profile-write-token>",
       "stream-read-token": "<your-stream-read-token>",
       "identity-read-token": "<your-identity-read-token>",
       "identity-write-token": "<your-identity-write-token>",
    },
    "wrapper": {
        "title": "Customer Journey Widget",
        "maximizeAreaName": "app-maximize-area"
    }
  }
 ]
},
```

### Default Icon Mapping JSON File (Begin with this file, to modify for icon-data-path url file)
[/src/assets/icons.json](https://github.com/CiscoDevNet/cjaas-widgets/blob/592aab211e332d8af13d4b0c830443e38a50aa09/CustomerJourney/src/assets/icons.json)
```
{
  "SMS": {
    "name": "icon-sms_16",
    "color": "mint"
  },
  "Telephony": {
    "name": "icon-handset-active_16",
    "color": "green"
  },
  "Voice": {
    "name": "icon-handset-active_16",
    "color": "green"
  },
  "Call": {
    "name": "icon-handset-active_16",
    "color": "green"
  },
  "Chat": {
    "name": "icon-chat-active_16",
    "color": "cobalt"
  },
  "Email": {
    "name": "icon-email-active_16",
    "color": "violet"
  },
  "wrapup": {
    "name": "icon-close-space_18",
    "color": "red"
  },
  "agent": {
    "name": "icon-headset_16",
    "color": "pink"
  },
  "Messenger": {
    "name": "icon-messenger_16",
    "color": "cobalt"
  },
  "social": {
    "name": "icon-contact-group_16",
    "color": "mint"
  },
  "task": {
    "name": "icon-tasks_16",
    "color": "yellow"
  },
  "Login": {
    "name": "icon-sign-in_24",
    "color": "gold"
  },
  "Page Visit": {
    "name": "icon-mouse-cursor_16",
    "color": "grey"
  },
  "Entered ZipCode": {
    "name": "icon-location_16",
    "color": "cyan"
  },
  "Identify": {
    "name": "icon-user_16",
    "color": "blue"
  },
  "Quote": {
    "name": "icon-file-spreadsheet_16",
    "color": "cobalt",
    "showcase": "firstName"
  },
  "NPS.*": {
    "name": "icon-analysis_16",
    "color": "red"
  },
  "Initiated Walk In": {
    "name": "icon-audio-video_16",
    "color": "orange"
  },
  "IMI_Inbound": {
    "name": "icon-call-incoming_16",
    "color": "green"
  },
  "IMI_Outbound": {
    "name": "icon-call-outgoing_16",
    "color": "darkmint"
  },
  "Trigger Sent to Server": {
    "name": "icon-event_16",
    "color": "violet",
    "showcase": "user"
  },
  "Survey Response Collected": {
    "name": "icon-report_16",
    "color": "gold"
  },
  "multi events single day": {
    "name": "icon-calendar-day_12",
    "color": "yellow"
  }
}

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
