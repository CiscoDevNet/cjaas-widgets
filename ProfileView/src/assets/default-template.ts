export const defaultTemplate = {
  name: "Default Template",
  attributes: [
    {
        "version": "0.1",
        "event": "Quote",
        "metadataType": "string",
        "metadata": "email",
        "limit": 1,
        "displayName": "Email",
        "lookbackDurationType": "days",
        "lookbackPeriod": 50,
        "aggregationMode": "Value",
        "verbose": false,
        "widgetAttributes": {
            "type": "table",
        }
    },
    {
        "version": "0.1",
        "event": "Quote",
        "metadataType": "string",
        "metadata": "firstName",
        "limit": 1,
        "displayName": "First Name",
        "lookbackDurationType": "days",
        "lookbackPeriod": 50,
        "aggregationMode": "Value",
        "verbose": false,
        "widgetAttributes": {
            "type": "table",
        }
    }
]
};
