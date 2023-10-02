# Deploying Widgets

As this is a repo with starter projects, how you deploy a finished widget will be mainly up to you own purposes.

Within the context of WxCC Desktop, there are some best practices that may come in handy.

1. Run `yarn dist` (OLD) now do `yarn dist:dev` (css containers) from root of project to make a `dist` folder containing the bundled `index` file
2. Name the file to best suit your needs. Semantic versioning is very helpful while adding features. For example, `customer-journey-10.0.0`
3. Upload the file to your web hosting service where it can be retrieved via a CDN link
4. Add that web link to your WxCC applications desktop config settings, using the JSON guidelines from UUIP
5. Be sure to configure your attributes, properties (including any WxCC application state that should be passed in), and necessary Bearer Token for the Customer Journey API calls.
