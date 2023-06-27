# JDS Customer Journey Widget Versions

This widget uses the JDS (Journey Data Services) APIs to display an individual customer's journey as a history of events. It first retrieves the complete event history from the tape endpoint and compiles toggles for all event channelTypes, and then subscribes to a live stream of new events so they appear in real time. This code can be used as is, or be starter code for your own Custom Widget. It also embodies Identity Alias management and Profile view with a tempate named 'journey-default-template'  

### Latest Version
```
customer-journey-9.0.0.js
```
Github Branch: `main`

<sub>_This version is supported by an entire set of APIs. You don't need SAS Tokens anymore, just a reference to the agent desktop CI access token._</sub>

Please navigate to this [README-VERSION-9.0.0.md](https://github.com/CiscoDevNet/cjaas-widgets/blob/main/CustomerJourney/README-VERSION-9.0.0.md)

### Version 8.0.9
```
customer-journey-8.0.9.js
```
Github Branch: `jds-widget-8.0.9`

<sub>_This version still requires SAS Tokens_</sub>

Please navigate to this [README-VERSION-8.0.9.md](https://github.com/CiscoDevNet/cjaas-widgets/blob/main/CustomerJourney/README-VERSION-8.0.9.md)

This version has some new things since version 8.0.7:
* when it's an outbound call, the widget should render the correct phone number (dnis)
* Attribute: `cad-variable-lookup`: You can configure a CAD variable (make sure to make it agent visible) and then pass in CAD Variable lookup.
* Attribute: `user-search`: You can disable user-search at the top. Default is false, so this is required to pass in now to enable search at top. 
* Attribute: `read-only-aliases`: You can also make the alias section read-only if you want. 

### Version 8.0.7
```
customer-journey-8.0.7.js
```
Github Branch: `jds-widget-8.0.7`

<sub>_This version still requires SAS Tokens_</sub>

Please navigate to this [README-VERSION-8.0.7.md](https://github.com/CiscoDevNet/cjaas-widgets/blob/main/CustomerJourney/README-VERSION-8.0.7.md)
