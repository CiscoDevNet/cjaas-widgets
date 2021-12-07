# CJaaS Widgets

This open-source repository will help you start developing your own CJaaS Widgets.

Existing widgets had been designed to work with the Cisco Customer Journey as a Service (CJaaS) API, and can be used in stand-alone web applications, or integrated with Cisco Webex Contact Center (WxCC).

* [Profile View](https://github.com/CiscoDevNet/cjaas-widgets/tree/main/ProfileView)
* [Timeline](https://github.com/CiscoDevNet/cjaas-widgets/tree/main/Timeline)
* [Customer Journey Widget](https://github.com/CiscoDevNet/cjaas-widgets/tree/main/CustomerJourney)

Each widget folder is organized as an independent project that exports a web component.

## Getting Started
- `cd` into the project folder
- run `yarn install`
- run `yarn start`
- navigate browser to `localhost:8888`

## Build and Deploy Modules
Once your widget is complete, it must be exported as a JS module that can be delivered via CDN. The build is configured to export a Web Component that can be used in your project.
- run `yarn dist` to create a compiled, minified JS module
- rename and upload the bundled module to your hosting service
- import according to your web application's config.
A basic usage may look like this, inside your applications `index.html`:
```html
<!-- Timeline widget -->
<script src="https://cjaas.cisco.com/web-components/v6/timeline-3.0.0.js"></script>
```

## CJaaS API
These widgets, and any widgets you might build, are the best place to develop API interactions, like a mini front-end application. Be sure to test your API calls in the sandbox environment, and stay informed about any changes to the backend services.

### API Fundamentals
Authorized API calls require valid SAS Tokens and base URLs.
#### BaseURL
Widgets that can be used by other organizations benefit from a `base-url` attribute that allows users to provide their own CJaaS API instance.
#### SAS Tokens
API calls are validated with an Shared Access Tokens, which are derived from the application's Private Key and Customer Jourey SDK. 
Some widgets make multiple calls to different endpoints, and may need multiple tokens to be provided (as is the case with ProfileView widget, for example, which has `profile-read-token`, `profile-write-token` and `stream-token` to carry out all of the widget's jobs).
To get all of the tokens your app will need, follow these steps: 
1. Get your application's Private Key, provided when the application is first created in the Admin Portal, or when the Key itself is rotated.
2. Note the application's Name, Namespace, and Organization
3. Review the types and permissions for the API calls you plan to make. Examples: https://uswest-nonprod.cjaas.cisco.com/swagger/ui#/
4. Lastly, use the SDK of your choice (Java, Python, and JavaScript options) and input the necessary attributes.

The SDK to generate SAS Tokens can be run in your terminal and input to the widgets as attrbiutes, however it may be a better practice to include the token gen in your host application's deployment. 
1. Create a `.env` file to hold your application variables, and include your application's PRIVATE_KEY (same as before from the Admin Portal).
2. Include an ES6 JavaScript module version of the SAS Token SDK in your project's shared source files. 
3. In your application's page or component controller, create methods to generate tokens from variables and the PRIVATE_KEY in `.env`, and pass the resulting strings to the widgets as properties. To further obscure your tokens, enclose your token gen operation in a closure. 
You can see working examples of this method here: [https://github.com/CiscoDevNet/cjaas-widgets/blob/main/CustomerJourney/src/%5Bsandbox%5D/sandbox.ts](https://github.com/CiscoDevNet/cjaas-widgets/blob/main/CustomerJourney/src/%5Bsandbox%5D/sandbox.ts).

**NOTE:** Every API call's token has a unique hash that ties it to the secret access key, and you cannot swap one for the other or modify the string without generating a server error.
