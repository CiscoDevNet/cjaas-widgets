
# CJDS: Customer Journey Widget

This widget uses the JDS (Journey Data Services) APIs to display an individual customer's journey as a history of events. It first retrieves the complete event history from the tape endpoint and compiles toggles for all event channelTypes, and then subscribes to a live stream of new events so they appear in real time. This code can be used as is, or be starter code for your own Custom Widget. It also embodies a profile view with a default template named 'journey-default-template'

CJDS is GA and offered as part of Webex Contact Center Customer Flex 3 Standard Agent License. To ensure seamless CJDS provisioning, review the [Onboarding Instructions](#onboarding-instructions)

#### Latest Version: 
```
10.0.0
```

#### CJDS Widget Reference
```
"script": "https://journey-widget.webex.com",
```


## Table of Contents

1. [Onboarding Instructions](#onboarding-instructions)
2. [How to setup CJDS Widget in Agent Desktop](#setup-cjds-widget-in-agent-desktop)
3. [How to Troubleshoot](#how-to-troubleshoot)
4. [How a published WXCC Event paylod works](#publishing-a-wxcc-event)
5. [How to publish a Custom Event](#publishing-a-custom-event)
6. [How to configure CJDS widget with customized profile template](#how-to-configure-cjds-widget-with-customized-profile-template)
7. [How to set IconType for a published event](#how-to-set-icontype-for-a-published-event)
8. [How to add Custom Icons to your CJDS Widget](#how-to-add-custom-icons-to-your-cjds-widget)
9. [How to customize your CJDS Widget](#how-to-customize-your-cjds-widget)
10. [View all Customer Journey Widget Properties](#customer-journey-widget-properties)
11. [How to add CJDS Widget to the Side Nav within Agent Desktop](#how-to-add-cjds-widget-to-the-side-nav-within-agent-desktop)
12. [How to add the CJDS Widget into an existing Desktop Layout](#how-to-add-the-cjds-widget-into-an-existing-desktop-layout)

### Onboarding instructions

CJDS is GA and offered as part of Webex Contact Center Customer Flex 3 Standard Agent License. To ensure seamless CJDS provisioning, review the following actions based on your organization's setup:

1. For organizations with a Webex Contact Center set up before February 28, 2025, and without CJDS provisioned: No action is necessary. CJDS tenants are automatically linked to your Webex Contact Center Org ID. 
- Default Agent Desktop Template will up updated for all customers for agent and agent/supervisor persona
2. For those with CJDS already provisioned and using the Customer Journey Widget in a custom layout: No changes are required. Your current setup is fully compatible. 
3. For organizations with a Webex Contact Center set up after March 1, 2025: Complete this [Form](https://app.smartsheet.com/b/form/7776df72239e47d0bbb73a392e32927f) to request CJDS provisioning for your organization. A Customer Journey tenant will be provisioned within 72 hours upon receiving your request.

## Setup CJDS Widget in Agent Desktop

Instructional Vidcast: [CJDS Widget v10 Setup Vidcast](https://app.vidcast.io/share/3c791866-c166-45fc-a87a-0bbaa5717103)

1. Confirm you have onboarded your organization. [Onboarding Instructions](#onboarding-instructions)
2. Log into [Control Hub](https://admin.webex.com/) as an admin and toggle on the Webex Contact Center Connector for a journey project.

  <img src="https://github.com/CiscoDevNet/cjaas-widgets/assets/15151981/24f3a5c9-c17c-413b-9dd8-0a38c9a18b76" height="300"/>

3. Download the following Desktop Layout JSON file:
[JDSDesktopLayout10.json](https://github.com/CiscoDevNet/cjaas-widgets/blob/main/CustomerJourney/src/assets/JDSDesktopLayout10.json)
- This layout is specifically compatable for a production instance and for an "agent" role. If you have a "supervisor" role or "supervisorAgent" role, you will need to modify the JSON.
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
1. Publish Event API Documentation: https://developer.webex-cx.com/documentation/journey/v1/journey-event-posting
3.  Example API Request Body of a WXCC Chat Event (Using Postman syntax)
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

1. Publish Event API Documentation: https://developer.webex-cx.com/documentation/journey/v1/journey-event-posting
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

## How to configure CJDS widget with customized profile template
By default, the profile template, `journey-default-template` will consist of the following fields:

- Contact in the Last 10 Days
- Contact in the Last 24 Hours 

<img width="410" alt="profileTemplateSection" src="https://github.com/user-attachments/assets/5acd5579-f7bf-4cb8-bb4a-641719f84f56" />

If you want to customize the template to render different fields or more fields follow the instructions below.
1. Proceed to the API documentation for Template Creation: [Template Creation API](https://developer.webex-cx.com/documentation/journey/v1/create-template). Read the instructions there to create a new custom profile template.
2. Once you have made the POST request, grab the new template id from the response body.
3. In order to customize the CJDS widget, you will need to have a general overview of how to modify the desktop layout that is configurable from control hub. Please refer to [How to customize your CJDS Widget](#how-to-customize-your-cjds-widget) for details.
4. Once you have created your customizable CJDS desktop layout, you may append the following to assign your newly created profile template id to the CJDS widget configuration within the desktop layout.
<img width="383" alt="customTemplateConfig" src="https://github.com/user-attachments/assets/e9a58ffc-1a33-4977-be92-e07e771799e9" />

5. Now, upload that modified Desktop Layout in Control Hub. (In order to see the updates, you may need to logout of agent desktop and log back in)


## How to add Custom Icons to your CJDS Widget 
By default, the **Momenetum UI Icon library** is being used.


### How to set IconType for a published event 

1. Default Icon Map File: [default-icon-color-map.json](https://github.com/CiscoDevNet/cjaas-widgets/blob/10-dev7-barry-fixes/CustomerJourney/src/assets/default-icon-color-map.json). This file is what is used by default for mapping iconTypes to icons. Please make a copy of this default file to then _add_ your addition icon mappings.
<img width="800" alt="Setting icon type in published event" src="https://github.com/CiscoDevNet/cjaas-widgets/assets/15151981/4394ccd6-e096-4dd8-88d1-7467ba57869d">



### Old Momentum UI Icon Library
1. To start, make a copy of the built-in Momentum UI Icon Map: [md-ui-icon-map.json](https://raw.githubusercontent.com/CiscoDevNet/cjaas-widgets/refs/heads/main/CustomerJourney/src/assets/md-ui-icon-map.json)

2. Lookup Momentum UI Icon: https://github.com/momentum-design/momentum-ui/tree/main/icons/svg
![old-md-ui-icons-lookup](https://github.com/user-attachments/assets/727f189e-2afe-4029-9e3c-41ebb2d42f00)

3.  Append icon keyword with icon name and color. 
Momentum UI Icon Notation:  `icon-sign-in_16`  `icon-${icon-name}_16`

      Valid Colors: (blue, gray, green, lime, pink, purple, violet, mint, darkmint, yellow, gold, red, darkred, orange, cyan)
      File Referenced for colors: `web-components/src/components/badge/tokens/lm-badge-tokens.js`
<img width="371" alt="Screenshot 2025-01-16 at 10 39 20 AM" src="https://github.com/user-attachments/assets/f6b06857-8d17-445f-853c-266ed146b5a2" />

5. Host your saved file on your own server. 
6. Add the `icon-data-url` attribute with a URL in quotations to your CJDS Widget configuration (example screenshot below) in your Desktop Layout JSON file and save.
  <img width="446" alt="iconDataURL_layout" src="https://github.com/CiscoDevNet/cjaas-widgets/assets/15151981/43708a37-ac6c-4e2f-8cc7-a7aaa524e349">

7. Upload your newly edited Desktop Layout file in the Admin Portal

### New Momentum Design Icon Library
1. Upgrade to the momentum-design icon library (if you want to use the new library) by setting the following attribute:
```
"use-new-momentum-icons": "true"
```
<img width="453" alt="Screenshot 2025-01-16 at 10 49 46 AM" src="https://github.com/user-attachments/assets/445db51c-fed3-4f28-b034-2cb1cf75b3c9" />


1. Make a copy of the default Momentum Design icon map: [md-design-icon-map.json](https://raw.githubusercontent.com/CiscoDevNet/cjaas-widgets/refs/heads/main/CustomerJourney/src/assets/md-design-icon-map.json)

2. Lookup Momentum Design Icon: https://momentum-design.github.io/momentum-design/en/tokens/icons/
![new-md-design-icon-lookup](https://github.com/user-attachments/assets/bf57dc75-814e-44f2-b274-1781ecaa12b0)

_If you cannot find an icon in this library, you can use an icon from the old library. In order to do so, you would set the iconSet to "momentumUI"_
```
    "Messenger": {
      "name": "icon-messenger_16",
      "color": "cobalt",
      "iconSet": "momentumUI"
    }
```

4. Append icon keyword with icon name and color. Momentum Design Icon Notation:  `sign-in-bold`  `${icon-name}-bold`
<img width="340" alt="Screenshot 2025-01-16 at 9 55 03 AM" src="https://github.com/user-attachments/assets/a8f844e3-be5f-4a02-b565-a5b694909e50" />

5. Host your saved file on your own server. 
6. Add the `icon-data-url` attribute with a URL in quotations to your CJDS Widget configuration (example screenshot below) in your Desktop Layout JSON file and save.
  <img width="446" alt="iconDataURL_layout" src="https://github.com/CiscoDevNet/cjaas-widgets/assets/15151981/43708a37-ac6c-4e2f-8cc7-a7aaa524e349">


7. Upload your newly edited Desktop Layout file in the Admin Portal

### New Momentum Design brand-visuals (logos)
If you want to use a logo (ex. Apple or Facebook) you can refrence the following list of logo svgs.
https://github.com/momentum-design/momentum-design/tree/main/packages/assets/brand-visuals/src/logos

![new-md-design-logo-lookup-2](https://github.com/user-attachments/assets/8dafe123-ccfd-462c-ab16-b975d32990d2)

Append the icon name with name, color, and iconSet as "momentumBrandVisuals"
```
    "Facebook": {
      "name": "social-facebook-color",
      "color": "grey",
      "iconSet": "momentumBrandVisuals"
    }
```
<img width="378" alt="Screenshot 2025-01-16 at 2 19 23 PM" src="https://github.com/user-attachments/assets/577793c5-0730-4b53-9861-bee76473e99a" />

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

`@attr hide-profile-name`: (<i>Boolean</i>) = false - When enabled, the alias button, first name and last name get removed from the UI and are not displayed.

`@attr use-new-momentum-icons`: (<i>Boolean</i>) = false - When enabled, the icons used for the events within the timeline section reference the new  momentum icon library (with a fallback to the old momentum icons).

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

## How to customize your CJDS Widget
If you have the out of the box version of the CJDS widget working in your environmnet, but you want to customize it, please follow the instructions below.
1. First, you will want to login to [Control Hub](https://admin.webex.com/) with admin credentials.
2. Navigate to Contact Center > Desktop Layouts.
3. Create Desktop Layout or click on an existing Desktop Layout.
4. Download the Default Desktop Layout.
<img width="1284" alt="DefaultDesktopLayoutAdmin" src="https://github.com/user-attachments/assets/8949d94f-07ab-4a34-b61e-00c4d50dc348" />

5. Search in file for `CUSTOMER_JOURNEY_WIDGET_TAB`. It should appear twice. You will want to replace both sections.
   <img width="1091" alt="cjds-default-to-customized-layout" src="https://github.com/user-attachments/assets/2eb30bd5-a4b4-4949-a8a3-22dda0c419d2" />

7. Replace the following code snippet #1 with the new code snippet #2 (you will do this in two different sections of the json file. ~ line 83 & ~ line 713)
**Code Snippet #1 (default)**
```json
          {
            "comp": "md-tab",
            "attributes": {
              "slot": "tab",
              "class": "widget-pane-tab"
            },
            "children": [
              {
                "comp": "slot",
                "attributes": {
                  "name": "CUSTOMER_JOURNEY_WIDGET_TAB"
                }
              }
            ],
            "visibility": "CUSTOMER_JOURNEY_WIDGET"
          },
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
                  "name": "CUSTOMER_JOURNEY_WIDGET"
                }
              }
            ],
            "visibility": "CUSTOMER_JOURNEY_WIDGET"
          },
```
**Code Snippet #2 (customizable)**
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
7. With the newly place code (in two different sections), proceed to add your custom attributes within the attribute section below "condensed-view": "true"
8. You can reference the custom attributes [here](#customer-journey-widget-properties)

   Here is an example of how to add the custom attribute "use-new-momentum-icons"
  <img width="457" alt="howToAddCustomAttribute" src="https://github.com/user-attachments/assets/74272dfc-bcbf-4a24-8961-0850ec77ba87" />

9. Save the updated layout with customizations and upload within control hub in the Contact Center > Desktop Layouts Section.

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

