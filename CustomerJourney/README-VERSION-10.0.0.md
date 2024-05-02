
# JDS Customer Journey Widget: Version 10.0.0

This widget uses the JDS (Journey Data Services) APIs to display an individual customer's journey as a history of events. It first retrieves the complete event history from the tape endpoint and compiles toggles for all event channelTypes, and then subscribes to a live stream of new events so they appear in real time. This code can be used as is, or be starter code for your own Custom Widget. It also embodies a profile view with a default template named 'journey-default-template'

### Latest Version
```
customer-journey-10.0.0.js
```

### Desktop Layout CJDS Widget Configuration

<sub>_Prerequisite: Onboard a Customer Journey organization, create a project in Control Hub, and toggle on the Webex Contact Center Connector._</sub>

#### Vidcast 

https://app.vidcast.io/share/0ebc75d5-62a4-4771-819e-518991c23b23 

#### CJDS Widget (PROD) Setup Instructions 

1. To start, copy the contents of the following Desktop Layout JSON file and create a new file with the contents pasted.  

- [JDSDesktopLayout10.json](https://github.com/CiscoDevNet/cjaas-widgets/blob/main/CustomerJourney/src/assets/JDSDesktopLayout10.json)

2. Within that file and search for `ENTER_YOUR_PROJECT_ID_HERE` and replace that text with your project ID in quotations (from Control Hub) and save your Desktop Layout JSON file.
<img width="465" alt="Desktop Layout JSON File" src="https://github.com/CiscoDevNet/cjaas-widgets/assets/15151981/0d42e76d-621e-4c86-b82b-9b2c08660d65">
<img width="450" alt="Control Hub JDS Admin Portal" src="https://github.com/CiscoDevNet/cjaas-widgets/assets/15151981/40af9fb6-9704-4267-9369-b6bb4945b3d1">

  
4. Go to Admin Portal for Agent Desktop: https://portal-v2.wxcc-us1.cisco.com 

5. Sign in as an Admin and go to `Provisioning` > `Desktop layout` 

6. Create a new Layout or edit an existing desktop layout, assign an agent team, upload your modified Desktop Layout JSON file and save. 

7. Now, you can log into [Agent Desktop](https://desktop.wxcc-us1.cisco.com/) as an Agent or refresh the Agent Desktop browser page and the new Desktop Layout will take effect and your CJDS Widget will appear in the right hand side the next time you accept an incoming customer request.

<sub>_* If you need help setting up the widget in Agent Desktop, contact cjds_widget@cisco.com._</sub>
  
### How to Publish Events
Publish Event API Documentation: https://api-jds.prod-useast1.ciscowxdap.com/publish/docs/swagger-ui/index.html#/ 

#### Publishing a WXCC Event
1. Publish Event API Documentation: https://api-jds.prod-useast1.ciscowxdap.com/publish/docs/swagger-ui/index.html#/ 
2.  Example API Request Body of a WXCC Chat Event (Using Postman syntax)
   - IDENTITY: Update both `identitiy` and `data.origin` fields with the customer's identity (ex. email or phone number)
   - ICON TYPE: `data.channelType` and `data.direction` reflects the icon type generated in the UI for this particular event (ex. email, inbound call)

<img width="500" alt="Screenshot 2023-09-28 at 2 14 53 PM" src="https://github.com/CiscoDevNet/cjaas-widgets/assets/15151981/e5343c72-1c8f-4c00-b078-32c2ffdf51cb">
<img width="500" alt="WXCC Event UI" src="https://github.com/CiscoDevNet/cjaas-widgets/assets/15151981/0937f919-93d6-4f06-b107-323c5742f84c">


```json
{
    "id": "{{$guid}}",
    "specversion": "1.0",
    "type": "task:ended",
    "source": "/com/cisco/wxcc/{{$guid}}",
    "identity": "rossgeller@cisco.com",
    "identitytype": "email",
    "previousidentity": null,
    "datacontenttype": "application/json",
    "data": {
        "taskId": "{{$guid}}",
        "queueId": "7a682870-472b-4a0f-b3e9-01fadf4efcf3",
        "outboundType": null,
        "workflowManager": null,
        "direction": "INBOUND",
        "channelType": "email",
        "origin": "rossgeller@cisco.com",
        "destination": "wxcc.ccp.switch@gmail.com"
    }
}
```

#### Publishing a Custom Event
Besides the WXCC events. you can publish custom events using our APIs. Here are instructions on how to publish your own custom event. 

1. Publish Event API Documentation: https://api-jds.prod-useast1.ciscowxdap.com/publish/docs/swagger-ui/index.html#/ 
2.  Example API Request Body (Using Postman syntax)
<img width="500" alt="Event Request Body Payload" src="https://github.com/CiscoDevNet/cjaas-widgets/assets/15151981/06bbe182-bc0a-40fb-b02b-0f84da7410ba">
<img width="500" alt="CJDS Widget UI Result" src="https://github.com/CiscoDevNet/cjaas-widgets/assets/15151981/95a03e16-5be8-4db3-8aa4-ac0af9000072">

```json
{
  "id": "{{$guid}}",
  "specversion": "1.0",
  "type": "task:new",
  "source": "custom/{{$guid}}",
  "identity": "egiere@cisco.com",
  "identitytype": "email",
  "datacontenttype": "application/json",
  "data": {
    "Website visited": "https://www.united.com",
    "Visit Duration": "35 Minutes",
    "uiData": {
      "title": "Login",
      "iconType": "login",
      "subTitle": "Elena Logged into United"
    }
  }
}
```
- In the highlighted section above, the optional uiData object allows the event publisher to declare custom UI properties that correspond to the text and icon displayed per event.
- The remaining property names/values under the sub data object are parsed out and displayed in rows within the expanded Activity Details Modal. 

### How to look up and set IconType for your published event 

1. Cross check this file <Insert-default-icons-file> to look up default Icon keywords.
<img width="800" alt="Setting icon type in published event" src="https://github.com/CiscoDevNet/cjaas-widgets/assets/15151981/3af2da82-4f67-4f97-b877-f2be5d4717be">


### How to add Custom Icons to your CJDS Widget 
If there is an icon in the https://momentum.design/icons that does not exist in the default-icon-map.json file, you can add custom icon mappings.
1. To start, please make a copy of the defaultIcons-v10.json file found on the JDS Widget Github 
2. Append the following highlighted block like so with the associated Momentum icon that you would like to add and save. We recommend using size 16 icon.
<img width="800" alt="Add Momentum Icon to Icon Map" src="https://github.com/CiscoDevNet/cjaas-widgets/assets/15151981/ca1e8423-6d95-4fc6-a679-ddd0b43f2872">
3. Host your saved file on your own server. 
4. Add the `icon-data-path` attribute with a URL in quotations to your CJDS Widget configuration (example screenshot below) in your Desktop Layout JSON file and save.
  <img width="650" alt="Setting Icon Map File to your CJDS Widget Config" src="https://github.com/CiscoDevNet/cjaas-widgets/assets/15151981/9d6c4a29-7084-4a2a-9463-8a69489ca10c">

6. Upload your newly edited Desktop Layout file in the Admin Portal


### Customer Journey Widget Properties

<i>The JDS Customer Journey Widget accepts specific properties to interact with the JDS APIs</i>

<sub>_The following attributes and properties of JDS Widget are supported with the following version_</sub>

```
https://cjaas.cisco.com/widgets/customer-journey-10.0.0.js
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


### If you want to add the Widget to the side nav of Agent Desktop (say for a supervisor account)
1. It will mostly be the same, but you will have to manually enter in your organizationId property instead of relying on the variable.
     - Instead of `"organizationId": "$STORE.agentContact.taskSelected.orgId"`
     -  You will need to obtain your orgId and pass it in like so `"organizationId": "<your-org-id>"`

### default-icon-map JSON File
This file is a mapping system to associate `event.data.channelType` of every incoming WXCC journey event to a particular icon. 

Begin with this file, to modify, and save. Host your saved version and refernce it throught the `icon-data-path` widget property.
[/src/assets/icons.json](https://github.com/CiscoDevNet/cjaas-widgets/blob/592aab211e332d8af13d4b0c830443e38a50aa09/CustomerJourney/src/assets/icons.json)

```
{
    "outbound-call": {
      "name": "icon-outgoing-call-active_16"
    },
    "inbound-call": {
      "name": "icon-incoming-call-active_16"
    },
    "Chat": {
      "name": "icon-chat-active_16"
    },
    "Messenger": {
      "name": "icon-messenger_16"
    },
    "Activity": {
      "name": "icon-meetings_16"
    },
    "Email": {
      "name": "icon-email-active_16"
    },
    "SMS": {
      "name": "icon-sms_16"
    },
    "Telephony": {
      "name": "icon-handset-active_16"
    },
    "Voice": {
      "name": "icon-handset-active_16"
    },
    "Call": {
      "name": "icon-handset-active_16"
    },
    "wrapup": {
      "name": "icon-close-space_18"
    },
    "agent": {
      "name": "icon-headset_16"
    },
    "social": {
      "name": "icon-contact-group_16"
    },
    "task": {
      "name": "icon-tasks_16"
    },
    "Login": {
      "name": "icon-sign-in_24"
    },
    "Page Visit": {
      "name": "icon-mouse-cursor_16"
    },
    "Entered ZipCode": {
      "name": "icon-location_16"
    },
    "Identify": {
      "name": "icon-user_16"
    },
    "Quote": {
      "name": "icon-file-spreadsheet_16"
    },
    "NPS.*": {
      "name": "icon-analysis_16"
    },
    "Initiated Walk In": {
      "name": "icon-audio-video_16"
    },
    "IMI_Inbound": {
      "name": "icon-call-incoming_16"
    },
    "IMI_Outbound": {
      "name": "icon-call-outgoing_16"
    },
    "Trigger Sent to Server": {
      "name": "icon-event_16"
    },
    "Survey Response Collected": {
      "name": "icon-report_16"
    }
}  
```

## Dev Environment: Getting Started
1. Navigate to the root directory of Customer Journey `CustomerJourney/`
2. Make a copy of `.env.sample` file, and rename it as '.env' (`CustomerJourney/.env`)
3. Fill out the variables. Below is a guide for variables

```
BASE_URL="ENTER_YOUR_JDS_BASE_URL"
BEARER_TOKEN="ENTER_YOUR_BEARER_TOKEN"
ORGANIZATION_ID="ENTER_YOUR_ORGANIZATION_ID"
PROJECT_ID="ENTER_YOUR_PROJECT_ID"
TEMPLATE_ID="ENTER_OPTIONAL_TEMPLATE_ID"
IDENTITY="ENTER_LOOKUP_CUSTOMER_IDENTIFIER"
```

### How to run the CJDS Widget locally
- run `yarn install`
- run `yarn start`
- navigate browser to `[localhost:8889](http://localhost:8889/)`

### Env Variable Guide
1. BASE URL
  - DEV Base URL: "https://api-jds.dev-uswest2.ciscowxdap.com"
  - QA Base URL: "https://api-jds.preprod-useast1.ciscowxdap.com"
  - PROD Base URL: "https://api-jds.prod-useast1.ciscowxdap.com"
2. BEARER TOKEN
  - Navigate to the Dev Portal (based on your chosen environment) and log in with your **agent** credentials
  - QA Base URL: https://apim-devportal-nonprod-cdn.ciscoccservice.com/
  - PROD Base URL: https://developer.webex-cx.com/
3. ORGANIZATION_ID
  - Please use the Organization ID that you have onboarded for CJDS
4. PROJECT_ID
  - Log into Control Hub and collect the Project Id you have activated with WXCC
5. TEMPLATE_ID **(optional)**
  - By default, the widget will use a default profile template.
  - If you would like to use a custom profile template, create one using our APIs and plug in the teamplte ID
6. IDENTITY
  - This is where you will pass in the customer's identity (ex. johndoe@gmail.com or +16303030024)


## How Build and Deploy New CJDS Widget
If you are using this widget as a starter for your own custom needs, follow these steps to publish it for your use.

Once your widget is complete, it must be exported as a JS module that can be delivered via CDN. The build is configured to export a Web Component that can be used in your project.

1. Run `yarn dist:dev` from root of project (`CustomerJourney/`) to create a compiled JS module (index.js)
2. navigate to `CustomerJourney/dist/index.js`
3. Name the file to best suit your needs. Semantic versioning is very helpful while adding features. For example, `customer-journey-10.0.0`
4. Upload the file to your web hosting service where it can be retrieved via a CDN link

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
