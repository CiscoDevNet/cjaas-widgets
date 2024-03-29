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
#### Bearer Token
API calls are Authenticated with a bearer token, which can be auto-opopulated from agent desktop.

1. Create a `.env` file to hold your application variables, and include your application's PRIVATE_KEY (which can be random) and your BEARER_TOKEN.
