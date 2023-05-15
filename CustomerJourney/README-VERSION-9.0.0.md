
# JDS Customer Journey Widget: Version 9.0.0

This widget uses the JDS (Journey Data Services) APIs to display an individual customer's journey as a history of events. It first retrieves the complete event history from the tape endpoint and compiles toggles for all event channelTypes, and then subscribes to a live stream of new events so they appear in real time. This code can be used as is, or be starter code for your own Custom Widget. It also embodies Identity Alias management and Profile view with a template named 'journey-default-template'

### Latest Version
```
customer-journey-9.0.0.js
```

<sub>_* This version is supported by an entire set of APIs. You don't need SAS Tokens anymore, just a reference to the agent desktop CI access token._</sub>
<sub>_* New required parameters: BearerToken, OrganizationId, and project-id_</sub>
<sub>_* Any older version will no longer work because the widget is using a whole new set of APIs. Please use this version going forward. You will have to onboard an organization and set things up in admin portal._</sub>
  
### Version 9.0.0 Code Location
<sub>_Currently, there are two version of the widget still available. So, Version 9.0.0 doesn't live in master yet._</sub>

```
BRANCH NAME: jds-widget-9-new-apis
```
Branch Link: https://github.com/CiscoDevNet/cjaas-widgets/tree/jds-widget-9-new-apis/CustomerJourney

### Customer Journey Widget Properties

<i>The JDS Customer Journey Widget accepts specific properties to interact with the JDS APIs</i>

<sub>_The following attributes and properties of JDS Widget are supported with the following version_</sub>

```
https://cjaas.cisco.com/widgets/customer-journey-9.0.0.js
```

#### Required Properties
`@prop bearerToken`: (<i>string</i>) - Agent Desktop bearerToken. Look at example to fetch directly from agent desktop store. Refer to example below on how to assign this property dynamically.

`@prop interactionData`: (<i>object</i>) - Agent Desktop Interaction Data. This allows the JDS Widget to auto-populate with the current customer request that the agent is interacting with. This overrides the customer attribute. Refer to example below on how to assign this property dynamically.

`@prop organizationId`: (<i>string</i>) - Agent's organizationId. You can fetch it directly from agent desktop store. Check out examples. Refer to example below on how to assign this property dynamically.

`@attr base-url`: (<i>String</i>) - Path to the proper Customer Journey API deployment. To use the production instance of the Customer Journey Widget, the base-url can be set to `"https://api-jds.prod-useast1.ciscowxdap.com"`.

`@attr project-id`: (<i>String</i>) - ProjectId sets the scope within the selected org. You can obtain this from the admin portal by selecting on the specific project for project details.

#### Optional Properties
`@attr template-id`: (<i>String</i>) - Sets the data template to retrieve customer Profile in desired format. By default, this gets assigned to the associated templateId of the `journey-default-template` via an API call.

`@attr cad-variable-lookup`: (<i>String</i>) - Pass in a CAD Variable lookup value, which will fetch the defined value to that CAD Variable if it exists within the interactionData. You can configure a particular CAD variable within flow control. Make sure to check the box: `Make Agent Viewable`.

`@attr customer`: (<i>String</i>) - Customer ID used for Journey lookup. (<i>PS: This is an alternative to InteractionData. InteractionData always overrides customer attribute.</i>)

`@attr limit`: (<i>Number</i>) = 20 - Set the number of Timeline Events to display

`@attr logs-on`: (<i>Boolean</i>) = false - Turn on additional logging for deubgging

`@attr collapse-timeline-section`: (<i>Boolean</i>) = false - Toggle to have the Timeline Section collapsed at start up.

`@attr collapse-profile-section`: (<i>Boolean</i>) = false - Toggle to have the Profile Section collapsed at start up.

`@attr collapse-alias-section`: (<i>Boolean</i>) = false - Toggle to have the Alias Section collapsed at start up.

`@attr time-frame`: (<i>"All" | "24-Hours" | "7-Days" | "30-Days"</i>) = "All" - Set the time frame the timeline section has selected at start up.

`@attr disable-event-stream`: (<i>Boolean</i>) = false - Toggle to set whether or not the journey timeline section is loading events in real time.

`@attr disable-user-search`: (<i>Boolean</i>) = false - Disables the Agent to search other customers by an identifier.

`@attr read-only-aliases`: (<i>Boolean</i>) = false - Toggle to make alias section read only. In read only mode, the agent won't be able to add or remove aliases within this section.

`@attr icon-data-path`: (<i>String</i>) - URL path of JSON template to set color and icon settings.

`@prop eventIconTemplate`: (<i>json object</i>) = iconData (built-in) - Property to pass in JSON template to set color and icon settings.

## Examples

### An example of how to upload JDS widget into DesktopLayout.json for Agent Desktop.

<sub>_Prerequisite: Onboard a Customer Journey organization, create a project, and toggle on the Webex Contact Center Connector._</sub>

1. You will need to log into the Agent Admin Portal, and navigate to Desktop Layouts.
2. Create a Desktop Layout or select an existing one, assign a agent team to use this layout, and this is where you will upload your configured DesktopLayout.json file.
3. When you create a new desktop layout, they provide you with a default layout JSON file. Download that file and use it as a starting point.
4. Within the downloaded default desktop layout JSON file, search for the data property `"visibility": "IVR_TRANSCRIPT"`. Find the following code block associated with that.

#### Find the IVR_TRANSCRIPT md-tab-panel object
```json
{
    "comp": "md-tab-panel",
    "attributes": {
    "slot": "panel",
    "class": "widget-pane"
    },
    "children": [
    {
        "comp": "slot",
        "attributes": {
        "name": "IVR_TRANSCRIPT"
        }
    }
    ],
    "visibility": "IVR_TRANSCRIPT"
},
# Add the customer journey widget code block (provided below) here
```

#### Add this Customer Journey Widget code block
```json
{
    "comp": "md-tab",
    "attributes": {
        "slot": "tab",
        "class": "widget-pane-tab"
    },
    "children": [
        {
            "comp": "span",
            "textContent": "Customer Journey"
        }
    ]
},
{
    "comp": "md-tab-panel",
    "attributes": {
        "slot": "panel",
        "class": "widget-pane"
    },
    "children": [
        {
            "comp": "customer-journey-widget",
            "script": "https://cjaas.cisco.com/widgets/customer-journey-9.0.0.js",
            "attributes": {
                "base-url": "https://api-jds.prod-useast1.ciscowxdap.com",
                "logs-on": "true",
                "project-id": "<your-project-id>",
            },
            "properties": {
                "interactionData": "$STORE.agentContact.taskSelected",
                "bearerToken": "$STORE.auth.accessToken",
                "organizationId":  "$STORE.agentContact.taskSelected.orgId"
            },
            "wrapper": {
                "title": "Customer Journey Widget",
                "maximizeAreaName": "app-maximize-area"
            }
        }
    ]
}
```
7. For quick setup, use the exact code block above with the exception of providing your own `"project-id"`.
8. Feel free to reference all the optional attributes and properties listed at the top. These allow you to customize your customer journey widget configuration.
9. Save the desktop Layout that now has your customer journey widget code. Then Save it within the Admin of Agent Desktop. Just refresh your Agent Desktop and the new configuration should load.

<sub>_* All boolean attributes default as false. If you want them to remain false, just don't pass it in at all._</sub>

### The following example is showcasing how to configure the local sandbox widget.
```
FILENAME: CustomerJourney/src/[sandbox]/sandbox.ts
```

```html
    <customer-journey-widget
        customer="John Smith"
        base-url="https://api-jds.dev-uswest2.ciscowxdap.com"
        .organizationId=${ORGANIZATION-ID}
        project-id=${PROJECT_ID}
        template-id=${TEMPLATE_ID}
        cad-variable-lookup=${CAD-VARIABLE}
        .bearerToken=${BEARER_TOKEN}
        .eventIconTemplate=${iconData}
        limit=${20}
        logs-on
        time-frame="30-Days"
        icon-data-path="https://cjaas.cisco.com/widgets/iconMaps/defaultIcons.json"
    ></customer-journey-widget>
```  


### Default Icon Mapping JSON File
This file is a mapping system to associate `data.channelType` of every incoming journey event to a particular icon. 

Begin with this file, to modify, and save. Host your saved version and refernce it throught the `icon-data-path` widget property.
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

Create a `.env` file that contains below variables (TEMPLATE_ID OPTIONAL)

```
BEARER_TOKEN="<your-bearer-token>"
BASE_URL="<your-base-url>"
ORGANIZATION_ID="<your-organization-id>"
PROJECT_ID="<your-project-id>"
TEMPLATE_ID="<your-template-id>"
IDENTITY="<your-customer-lookup-alias>"

```

- Where used in your app, pass the correct ORGANIZATION and PROJECT_ID values from your admin portal
- run `yarn install`
- run `yarn start`
- navigate browser to `[localhost:8889](http://localhost:8889/)`

  
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
<gadget>
https://cjaas.cisco.com/widgetswidgets/finesse/v9.0.0/CiscoJDSCustomerJourneyGadget.xml?
bearerToken={yourBearerToken}
&organizationId={yourOrgId}
&projectId={yourProjectId}
&templateId={yourTemplateId}
&minHeight=480px
</gadget>
```
