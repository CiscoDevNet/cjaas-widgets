# Deploying Widgets

As this is a repo with starter projects, how you deploy a finished widget will be mainly up to you own purposes.

Within the conntext of WxCC Desktop, there are some best practices that may come in handy.

1. Run `yarn dist` from root of project to make a `dist` folder containing the bundled `index` file
2. Name the file to best suit your needs. Semantic versioning is very helpfull while adding feattures. For example, `customer-journey-widget-6.3.0`
3. Upload the file to your web hosting service where it can be retrieved via a CDN link
4. Add that web link to your WxCC applications desktop config settings, using the JSON guidelines from UUIP
5. Be sure to configure your attributes, properties (including any WxCC application state that should be passed in), and necessary SAS tokens for the Custtomer Journey API calls.


# Adding Widget to CCE and CCX via Finesse
1. Assuming the widget is deployed using above steps, files under finesse directory will be used.
2. For testing reserve CCE/CCX sanbox from devnet. Follow instructions to launch admin portal and dashboard.
3. Add gadget config with supported queryStrings to agent desktop config.

``` xml
<gadget>{Cloud hosted location}/finesse/CiscoJDSCustomerJourneyGadget.xml?profileReadToken=so%3Ddemoassure%26sn%3Dsandbox%26ss%3Dprofile%26sp%3Dr%26se%3D2022-05-05T09%3A13%3A31.505017500Z%26sk%3DjourneyUi%26sig%3DoX7V4ajfaknNJ3tcnOTNpFJQ4uwTztbomVp%252BWmJb4%253D&profileWriteToken=so%3Ddemoassure%26sn%3Dsandbox%26ss%3Dprofile%26sp%3Dw%26se%3D2022-05-05T09%3A13%3A31.506625800Z%26sk%3DjourneyUi%26sig%3DSD%252Fc7pmz%252Buc5qXB44%252FfXDeSd4C9dq8Ub%252F2TieK%252FOM%253D&streamToken=so%3Ddemoassure%26sn%3Dsandbox%26ss%3Dstream%26sp%3Dr%26se%3D2022-05-05T09%3A13%3A31.507991400Z%26sk%3DjourneyUi%26sig%3DUjo16g0oPXyOUc25JXe5NqMNIRSJpgCmz7DT3OZC6%252BM%253D&tapeToken=so%3Ddemoassure%26sn%3Dsandbox%26ss%3Dtape%26sp%3Dr%26se%3D2022-05-05T09%3A13%3A31.509055200Z%26sk%3DjourneyUi%26sig%3DPAM7q9A8R1C10YW8wIvScG6yAoGtW97nnwE60BqRI%253D&identityReadToken=so%3Ddemoassure%26sn%3Dsandbox%26ss%3Didmt%26sp%3Dr%26se%3D2022-05-05T09%3A13%3A31.510959300Z%26sk%3DjourneyUi%26sig%3Dp9wWUjp%252Bde965kRL05iI%252FFDEAAL2f0g7COrtFVZiU%253D&identityWriteToken=so%3Ddemoassure%26sn%3Dsandbox%26ss%3Didmt%26sp%3Dw%26se%3D2022-05-05T09%3A13%3A31.511875Z%26sk%3DjourneyUi%26sig%3DbQGGM%252FYAqHrCQRbVTKfX3dZA%252BlGVQfjcxO2JMrdY8%253D&minHeight=480px&profileTemplate=new-template</gadget>
```