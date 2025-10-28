## CJDS: Customer Journey Widget OOTB (Out of the Box)

This widget uses the JDS (Journey Data Services) APIs to display an individual customer's journey as a history of events.
Currently, we have feature flags that control the visibility of the default configuration of JDS Out of the Box. We plan to go GA with Out of the Box JDS late November.


## TESTING SETUP INSTRUCTIONS
1. Onboard Org for JDS: Complete this [Form](https://app.smartsheet.com/b/form/7776df72239e47d0bbb73a392e32927f) to request CJDS provisioning for your organization. Will be completed in 72 hours.
2. Confirm your agent's team has the default desktop layout json configured. [How to](#how-to-confirm-desktop-layout)
3. Ensure you have enabled the [feature flags](#desktop-jds-Feature-Flags) required for CJDS Out of the Box visibility.

#### Desktop JDS Feature Flags
Enable JDS For Agent: `wxcc-desktop-cjds-enabled`

Enable JDS For Supervisor: `wxcc-desktop-supervisor-cjds-enabled`

#### How to Confirm Desktop Layout
1. Sign into Control Hub
2. Navigate to Contact Center > Desktop Layouts
3. Click on the Layout that is assigned to your agent's team.
4. confirm the uploaded layout is `Default Desktop Layout.json`

