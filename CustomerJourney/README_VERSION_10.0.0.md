
# JDS Customer Journey Widget

This widget uses the JDS (Journey Data Services) APIs to display an individual customer's journey as a history of events. It first retrieves the complete event history from the tape endpoint and compiles toggles for all event channelTypes, and then subscribes to a live stream of new events so they appear in real time. This code can be used as is, or be starter code for your own Custom Widget. It also embodies a profile view with a default template named 'journey-default-template'

#### Latest Version: 
```
10.0.0
```

#### CJDS Widget Reference
```
"script": "https://journey-widget.webex.com",
```


## Table of Contents

1. [How to setup CJDS Widget in Agent Desktop](#setup-cjds-widget-in-agent-desktop)
2. [How to Troubleshoot](#how-to-troubleshoot)
3. [How to publish a WXCC Event](#publishing-a-wxcc-event)
4. [How to publish a Custom Event](#publishing-a-custom-event)
5. [How to set IconType for a published event](#how-to-set-icontype-for-a-published-event)
6. [How to add Custom Icons to your CJDS Widget](#how-to-add-custom-icons-to-your-cjds-widget)
7. [View all Customer Journey Widget Properties](#customer-journey-widget-properties)
8. [How to add CJDS Widget to the Side Nav within Agent Desktop](#how-to-add-cjds-widget-to-the-side-nav-within-agent-desktop)
9. [How to add the CJDS Widget into an existing Desktop Layout](#how-to-add-the-cjds-widget-into-an-existing-desktop-layout)


## Setup CJDS Widget in Agent Desktop

Instructional Vidcast: [CJDS Widget v10 Setup Vidcast](https://app.vidcast.io/share/3c791866-c166-45fc-a87a-0bbaa5717103)

1. Onboard a Customer Journey organization
- CJDS is currently in Limited Availability (for US-only), please fill out this [Form](https://app.smartsheet.com/b/form/7776df72239e47d0bbb73a392e32927f)  to be onboarded. Post the initial request, the Cisco team will assist you with CJDS instance setup within 72 hours.
2. Log into [Control Hub](https://admin.webex.com/) as an admin and toggle on the Webex Contact Center Connector for a journey project.

  <img src="https://github.com/CiscoDevNet/cjaas-widgets/assets/15151981/24f3a5c9-c17c-413b-9dd8-0a38c9a18b76" height="300"/>

3. Download the following Desktop Layout JSON file:
[JDSDesktopLayout10.json](https://github.com/CiscoDevNet/cjaas-widgets/blob/main/CustomerJourney/src/assets/JDSDesktopLayout10.json)
- If you are interested in adding the CJDS Widget to your existing desktop layout, get the code snippet [here](#how-to-add-the-cjds-widget-into-an-existing-desktop-layout).
4. While you are still logged into [Control Hub](https://admin.webex.com/), navigate to `Contact Center` > `Desktop Layouts` in the left-hand side nav.
5. Create a new Layout or edit an existing desktop layout, assign an agent team, upload the downloaded JDSDesktopLayout10.json file and save. 
6. Now, you can log into [Agent Desktop](https://desktop.wxcc-us1.cisco.com/) as an Agent or refresh the Agent Desktop browser page and the new Desktop Layout will take effect and your CJDS Widget will appear in the right hand side the next time you accept an incoming customer request.


<sub>*If you need help setting up the widget in Agent Desktop, contact cjds_widget@cisco.com.*</sub>

## How to Troubleshoot
1. Open your browser's dev tools (right click on browser screen, select "inspect") - This needs to be open before the widget appears on the screen.
2. Once the widget has loaded, select the "console" tab and right click within the console logs and click "Save as"
3. Next, navigate to "network" tab, and click the download button to download the network request logs.
4. Share the following 3 Files with the CJDS Support Team:
* DesktopLayoutJSON
* ConsoleLogs
* NetworkLogs

<img src="https://github.com/CiscoDevNet/cjaas-widgets/assets/15151981/3c2a8e32-a80c-4f28-a71f-894d8cce794a" height="500"/>

## Publishing a WXCC Event (You shouldn't do this manually) 
1. Publish Event API Documentation: https://api-jds.wxdap-produs1.webex.com/publish/docs/swagger-ui/index.html#
2.  Example API Request Body of a WXCC Chat Event (Using Postman syntax)
   - IDENTITY: Update both `identitiy` and `data.origin` fields with the customer's identity (ex. email or phone number)
   - ICON TYPE: `data.channelType` and `data.direction` reflects the icon type generated in the UI for this particular event (ex. email, inbound call)

<img width="500" alt="Screenshot 2023-09-28 at 2 14 53 PM" src="https://github.com/CiscoDevNet/cjaas-widgets/assets/15151981/e5343c72-1c8f-4c00-b078-32c2ffdf51cb">
<img width="700" alt="WXCC Event UI" src="https://github.com/CiscoDevNet/cjaas-widgets/assets/15151981/176890f7-a47d-42b0-9173-68ac6139bf06">


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

## Publishing a Custom Event
Besides the WXCC events. you can publish custom events using our APIs. Here are instructions on how to publish your own custom event. 

1. Publish Event API Documentation: https://api-jds.wxdap-produs1.webex.com/publish/docs/swagger-ui/index.html#
2.  Example API Request Body (Using Postman syntax)
<img width="500" alt="Event Request Body Payload" src="https://github.com/CiscoDevNet/cjaas-widgets/assets/15151981/06bbe182-bc0a-40fb-b02b-0f84da7410ba">

![customEventExpanded](https://github.com/CiscoDevNet/cjaas-widgets/assets/15151981/a1df8908-5d24-46ee-90ff-f15f0d815bfa)


```json
{
  "id": "{{$guid}}",
  "specversion": "1.0",
  "type": "task:new",
  "source": "custom/{{$guid}}",
  "identity": "rachelgreene@gmail.com",
  "identitytype": "email",
  "datacontenttype": "application/json",
  "data": {
    "Visit Duration": "15 Minutes",
    "Website visited": "https://www.united.com",
    "uiData": {
      "title": "Login",
      "iconType": "login",
      "subTitle": "Logged into United",
      "filterTags": ["login"]
    }
  }
}
```
- In the highlighted section above, the optional uiData object allows the event publisher to declare custom UI properties that correspond to the text and icon displayed per event.
- The remaining property names/values under the sub data object are parsed out and displayed in rows within the expanded Activity Details Modal. 

## How to set IconType for a published event 

1. Cross check this file [default-icon-color-map.json](https://github.com/CiscoDevNet/cjaas-widgets/blob/10-dev7-barry-fixes/CustomerJourney/src/assets/default-icon-color-map.json) to look up default Icon keywords.
<img width="800" alt="Setting icon type in published event" src="https://github.com/CiscoDevNet/cjaas-widgets/assets/15151981/4394ccd6-e096-4dd8-88d1-7467ba57869d">


## How to add Custom Icons to your CJDS Widget 
If there is an icon in this [collection](https://github.com/momentum-design/momentum-ui/tree/40ff564f61938e296e36df0de06c8f30e9c6c722/icons/svg) that does not exist in the default-icon-map.json file, you can add custom icon mappings.

*Momentum Icons Webiste has been taken down*

- Navigate to this link and search icons by keyword in the "Go To File" Input field in the upper right corner.
  https://github.com/momentum-design/momentum-ui/tree/40ff564f61938e296e36df0de06c8f30e9c6c722/icons/svg

<img width="800" alt="Screenshot 2024-06-26 at 6 43 26 PM" src="https://github.com/CiscoDevNet/cjaas-widgets/assets/15151981/23d54e5e-8b61-4cb7-a8eb-08a67a721c0d">


1. To start, please make a copy of the [default-icon-color-map.json](https://raw.githubusercontent.com/CiscoDevNet/cjaas-widgets/10-dev7-barry-fixes/CustomerJourney/src/assets/default-icon-color-map.json) file found on the JDS Widget Github 
2. Append the following highlighted block like so with the associated Momentum icon that you would like to add and save. We recommend using size 16 icon.
<img width="800" alt="Add Momentum Icon to Icon Map" src="https://github.com/CiscoDevNet/cjaas-widgets/assets/15151981/25f3561a-3e29-403d-a2b9-4a306a082247">

3. Host your saved file on your own server. 
4. Add the `icon-data-url` attribute with a URL in quotations to your CJDS Widget configuration (example screenshot below) in your Desktop Layout JSON file and save.
  <img width="446" alt="iconDataURL_layout" src="https://github.com/CiscoDevNet/cjaas-widgets/assets/15151981/43708a37-ac6c-4e2f-8cc7-a7aaa524e349">


6. Upload your newly edited Desktop Layout file in the Admin Portal

## Customer Journey Widget Properties

<i>The JDS Customer Journey Widget accepts specific properties to interact with the JDS APIs</i>

### Required Properties
These 4 required properties all can be assignd to Agent Desktop Variables.

`@prop bearerToken`: (<i>string</i>) - Agent Desktop bearerToken. Look at example to fetch directly from agent desktop store. Refer to example below on how to assign this property dynamically.

`@prop interactionData`: (<i>object</i>) - Agent Desktop Interaction Data. This allows the JDS Widget to auto-populate with the current customer request that the agent is interacting with. This overrides the customer attribute. Refer to example below on how to assign this property dynamically.

`@prop organizationId`: (<i>string</i>) - Agent's organizationId. You can fetch it directly from agent desktop store. Check out examples. Refer to example below on how to assign this property dynamically.

`@prop dataCenter`: (<i>string</i>) - Agent Desktop data center. The data center allows the JDS widget to determine which baseUrl to use for all our APIs. For example, dataCenter = "qaus1". You can fetch it directly from agent desktop store.

Already provided like so in the defualt-desktop-JDS.json desktop layout file.
```
  "properties": {
    "interactionData": "$STORE.agentContact.taskSelected",
    "bearerToken": "$STORE.auth.accessToken",
    "organizationId": "$STORE.agent.orgId",
    "dataCenter": "$STORE.app.datacenter"
  },
```

### Optional Attributes
`@attr project-id`: (<i>String</i>) - ProjectId sets the scope within the selected org. You can obtain this from the admin portal by selecting on the specific project for project details. If not provided, the widget automatically looks up the project Id in which the WXCC connector is enabled.

`@attr template-id`: (<i>String</i>) - Sets the data template to retrieve customer Profile in desired format. If not provided, this gets assigned to the associated templateId of the `journey-default-template` via an API call or selects the first provided template Id for your particular project.

`@attr customer`: (<i>String</i>) - Customer ID used for Journey lookup. (<i>PS: This is an alternative to InteractionData. InteractionData always overrides customer attribute. If no customer is provided, then the widget UI provides an identity search input field.</i>)

`@attr show-alias-icon`: (<i>Boolean</i>) = true - Enables the view of an alias icon that when clicked, shows a modal of all aliases of the current viewed identity. By default, this is enabled.

`@attr limit`: (<i>Number</i>) = 20 - Set the number of Timeline Events to display

`@attr time-frame`: (<i>"All" | "24-Hours" | "7-Days" | "30-Days"</i>) = "All" - Set the time frame the timeline section has selected at start up.

`@attr disable-event-stream`: (<i>Boolean</i>) = false - Toggle to set whether or not the journey timeline section is loading events in real time.

`@attr enable-user-search`: (<i>Boolean</i>) = false - Enables the Agent to search other customers by an identifier.

`@attr icon-data-url`: (<i>String</i>) - URL path of JSON template to set color and icon settings.

`@attr condensed-view`: (<i>Boolean</i>) = true - Displays the widget in a view that is more compact. My default this is enabled.

`@attr cad-variable-lookup`: (<i>String</i>) - Pass in a CAD Variable lookup value, which will fetch the defined value to that CAD Variable if it exists within the interactionData. This will then become your lookup identity. You can configure a particular CAD variable within flow control. Make sure to check the box: `Make Agent Viewable`.

### Other CAD Variable options

- JDSDivision: If you set this CAD Variable `JDSDivision` within flow control, the widget will only show events filtered by that value. This property of your event payload will determine if it is a match: `event.data.uiData.division`. Example: You have set JDSDivision to "Sales". and you have published custom event payloads in which `event.data.uiData.division: "Sales".

- JDSDefaultFilter: If you set this CAD Variable `JDSDefaultFilter` within flow control, the widget will initially load with that particular filter set.

And also, here is the other one to filter by cadVariable: "JDSDivision" this filters by the event payload property
event?.data?.uiData?.division

## How to add CJDS Widget to the Side Nav within Agent Desktop
If you would like to have the CJDS Widget accessable from the side nav and not have to trigger an incoming event to see the widget, please read the following...
Here is a template with the Widget already configured in the Desktop Layout to render normally as well as render within the side nav.
1. Download the following Desktop Layout JSON file:
[JDSDesktopLayout10_SideNav.json](https://github.com/CiscoDevNet/cjaas-widgets/blob/main/CustomerJourney/src/assets/JDSDesktopLayout10_SideNav.json)

#### Desktop Layout CJDS Widget for side Nav Code Snippet for adding to existing layouts.
You can look up a momentum Icon you would like to use for the side nav icon. Use the icon keyword for the "icon" property. Just make sure you have the iconType as "momentum"

Navigate to this link and search icons by keyword in the "Go To File" Input field in the upper right corner. 
https://github.com/momentum-design/momentum-ui/tree/40ff564f61938e296e36df0de06c8f30e9c6c722/icons/svg

```json
{
  "nav": {
    "label": "Journey Data Services",
    "icon": "accessories",
    "iconType": "momentum",
    "navigateTo": "customerJourneyWidget",
    "align": "top"
  },
  "page": {
    "id": "customerJourneyWidget",
    "widgets": {
      "right": {
        "comp": "customer-journey-widget",
        "script": "https://journey-widget.webex.com",
        "attributes": {
          "show-alias-icon": "true",
          "condensed-view": "true",
          "enable-user-search": "true"
        },
        "properties": {
          "bearerToken": "$STORE.auth.accessToken",
          "organizationId": "$STORE.agent.orgId",
          "dataCenter": "$STORE.app.datacenter"
        },
        "wrapper": {
          "title": "Customer Journey Widget",
          "maximizeAreaName": "app-maximize-area"
        }
      }
    },
    "layout": {
      "areas": [
        [
          "right"
        ]
      ],
      "size": {
        "cols": [
          1
        ],
        "rows": [
          1
        ]
      }
    }
  }
}
```

## How to add the CJDS Widget into an existing Desktop Layout
_Prerequiste: You need to understand JSON code structure in order to properly edit the desktop layout._

1. Copy the following JSON code block and paste it after the IVR_TRANSCRIPT section. 
CJDS Widget Code Block
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
                "script": "https://journey-widget.webex.com",
                "attributes": {
                  "show-alias-icon": "true",
                  "condensed-view": "true"
                },
                "properties": {
                  "interactionData": "$STORE.agentContact.taskSelected",
                  "bearerToken": "$STORE.auth.accessToken",
                  "organizationId": "$STORE.agent.orgId",
                  "dataCenter": "$STORE.app.datacenter"
                },
                "wrapper": {
                  "title": "Customer Journey Widget",
                  "maximizeAreaName": "app-maximize-area"
                }
              }
            ]
          },
```
Here is a screenshot of the block in place (notice it is after IVR_TRASNCRIPT and before WXM_JOURNEY_TAB

<img width="658" alt="cjdsWidget-inLayout" src="https://github.com/CiscoDevNet/cjaas-widgets/assets/15151981/f3dacd47-8285-4795-a5e8-7da7b95fd045">


## Adding Widget to CCE and CCX via Finesse
We have provided a gadget xml file for CJDS Widget "out of the box" configuration within Finesse.
1. Please download this file:[CiscoJDSFinesseGadget.xml](https://github.com/CiscoDevNet/cjaas-widgets/blob/main/CustomerJourney/src/assets/CiscoJDSFinesseGadget.xml)
1. Assuming the widget is deployed using above steps, files under finesse directory will be used.
2. For testing reserve CCE/CCX sanbox from devnet. Follow instructions to launch admin portal and dashboard.
3. Add gadget config with supported queryStrings to agent desktop config.

``` xml
<gadget managedBy="agentMultiTabGadgetContainer">/3rdpartygadget/files/JourneyV10/CiscoJDSCustomerJourneyGadget.xml?
  dataCenter=produs1&amp;
  organizationId=YOUR_ORG_ID&amp;
  projectId=YOUR_PROJECT_ID&amp;
  cceTokenUrl=YOUR_TOKEN_URL&amp;
  cceTokenUrlName=YOUR_TOKEN_URL_NAME&amp;
  ccePassKey=YOUR_TOKEN_PASS_KEY&amp;
  iconDataUrl=YOUR_OPTIONAL_ICON_DATA_URL&amp;
  enableUserSearch=true&amp;
  customer=YOUR_CUSTOMER_ALIAS&amp;
  condensedView=true&amp;
  gadgetHeight=600
</gadget> 
```

