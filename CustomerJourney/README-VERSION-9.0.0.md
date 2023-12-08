
# JDS Customer Journey Widget: Version 9.0.0

This widget uses the JDS (Journey Data Services) APIs to display an individual customer's journey as a history of events. It first retrieves the complete event history from the tape endpoint and compiles toggles for all event channelTypes, and then subscribes to a live stream of new events so they appear in real time. This code can be used as is, or be starter code for your own Custom Widget. It also embodies Identity Alias management and Profile view with a template named 'journey-default-template'

### Latest Version
```
customer-journey-9.0.0.js
```
Github Branch: `main`

"@cjaas/common-components" version: `4.4.2` (main branch)

<sub>_* This version is supported by an entire set of APIs. You don't need SAS Tokens anymore, just a reference to the agent desktop CI access token._</sub>

<sub>_* New required parameters: BearerToken and Project-id (aka: workspaceID)_</sub>

<sub>_* Any older version will no longer work because the widget is using a whole new set of APIs. Please use this version going forward. You will have to onboard an organization and set things up in admin portal._</sub>

### Desktop Layout CJDS Widget Configuration

<sub>_Prerequisite: Onboard a Customer Journey organization, create a project in Control Hub, and toggle on the Webex Contact Center Connector._</sub>

#### Vidcast 

https://app.vidcast.io/share/0ebc75d5-62a4-4771-819e-518991c23b23 

#### CJDS Widget (PROD) Setup Instructions 

1. To start, copy the contents of the following Desktop Layout JSON file and create a new file with the contents pasted.  
- [CJDSWidget_9.0.0_LayoutTemplate.json](https://raw.githubusercontent.com/CiscoDevNet/cjaas-widgets/main/CustomerJourney/src/assets/CJDSWidget_9.0.0_LayoutTemplate.json)

2. Within that file and search for `ENTER_YOUR_PROJECT_ID_HERE` and replace that text with your project ID in quotations (from Control Hub) and save your Desktop Layout JSON file.

<img width="450" alt="Control Hub JDS Admin Portal" src="https://github.com/CiscoDevNet/cjaas-widgets/assets/15151981/50246313-fa86-455f-80ba-275eb348efe9">
<img width="450" alt="Control Hub JDS Admin Portal" src="https://github.com/CiscoDevNet/cjaas-widgets/assets/15151981/40af9fb6-9704-4267-9369-b6bb4945b3d1">

  
3. Go to Admin Portal for Agent Desktop: https://portal-v2.wxcc-us1.cisco.com 

4. Sign in as an Admin and go to `Provisioning` > `Desktop layout` 

5. Create a new Layout or edit an existing desktop layout, assign an agent team, upload your modified Desktop Layout JSON file and save. 

6. Now, you can log into [Agent Desktop](https://desktop.wxcc-us1.cisco.com/) as an Agent or refresh the Agent Desktop browser page and the new Desktop Layout will take effect and your CJDS Widget will appear in the right hand side the next time you accept an incoming customer request.

<sub>_* If you need help setting up the widget in Agent Desktop, contact cjds_widget@cisco.com._</sub>
  
### How to Publish Events
Publish Event API Documentation: https://api-jds.wxdap-produs1.webex.com/publish/docs/swagger-ui/index.html

#### Publishing a WXCC Event
1. Publish Event API Documentation: https://api-jds.wxdap-produs1.webex.com/publish/docs/swagger-ui/index.html
3.  Example API Request Body of a WXCC Chat Event (Using Postman syntax)
   - IDENTITY: Update both `identitiy` and `data.origin` fields with the customer's identity (ex. email or phone number)
   - ICON TYPE: `data.channelType` and `data.direction` reflects the icon type generated in the UI for this particular event (ex. email, inbound call)

<img width="500" alt="Screenshot 2023-09-28 at 2 14 53 PM" src="https://github.com/CiscoDevNet/cjaas-widgets/assets/15151981/e5343c72-1c8f-4c00-b078-32c2ffdf51cb">


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

### How to look up and set data.channelType for your published event 

1. This file is a mapping system to associate `data.channelType` of every incoming journey event to a particular icon.
2. Begin with this file below, to modify, and save. Host your saved version and refernce it throught the icon-data-path widget property.
[/src/assets/icons.json](https://github.com/CiscoDevNet/cjaas-widgets/blob/592aab211e332d8af13d4b0c830443e38a50aa09/CustomerJourney/src/assets/icons.json)

<img width="800" alt="Setting icon type in published event" src="https://github.com/CiscoDevNet/cjaas-widgets/assets/15151981/ee973eda-7f9e-4e11-bccd-8c77138046ba">

### How to add Custom Icons to your CJDS Widget 
If there is an icon in the https://momentum.design/icons that does not exist in the default-icon-map.json file, you can add custom icon mappings.
1. To start, please make a copy of the [/src/assets/icons.json](https://github.com/CiscoDevNet/cjaas-widgets/blob/592aab211e332d8af13d4b0c830443e38a50aa09/CustomerJourney/src/assets/icons.json) file found on the JDS Widget Github 
2. Append the following highlighted block like so with the associated Momentum icon that you would like to add and save. We recommend using size 16 icon.

<img width="800" alt="Add Momentum Icon to Icon Map" src="https://github.com/CiscoDevNet/cjaas-widgets/assets/15151981/4b94f4a2-2b0e-4a85-aa5a-52f199392924">

3. Host your saved file on your own server. 
4. Add the `icon-data-path` attribute with a URL in quotations to your CJDS Widget configuration (example screenshot below) in your Desktop Layout JSON file and save.

<img width="650" alt="Setting Icon Map File to your CJDS Widget Config" src="https://github.com/CiscoDevNet/cjaas-widgets/assets/15151981/3b1913a1-f30f-4b5b-8a63-23923b4a68fb">

5. Upload your newly edited Desktop Layout file in the Admin Portal


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

`@attr base-url`: (<i>String</i>) - Path to the proper Customer Journey API deployment. To use the production instance of the Customer Journey Widget, the base-url can be set to `"https://api-jds.wxdap-produs1.webex.com"`.

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
  - DEV Base URL: "https://api-jds.wxdap-devus1.webex.com"
  - QA Base URL: "https://api-jds.wxdap-stgus1.webex.com"
  - PROD Base URL: "https://api-jds.wxdap-produs1.webex.com"
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
3. Name the file to best suit your needs. Semantic versioning is very helpful while adding features. For example, `customer-journey-9.0.1`
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
