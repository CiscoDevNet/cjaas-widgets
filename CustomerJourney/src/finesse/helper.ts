import { QueryParams, SASTokens, UserData } from "./interface";
import * as iconData from "@/assets/icons.json";

declare const finesse: any;
declare const gadgets: any;

let clientLogs: any;

export function setNetworkError() {}

export const getRequest = (url: string, callback: Function) => {
  const authorizationHeader = finesse.utilities.Utilities.getAuthHeaderString(finesse.gadget.Config);
  const oReq = new XMLHttpRequest();
  oReq.overrideMimeType("application/json");
  oReq.open("GET", url);
  oReq.setRequestHeader("authorization", authorizationHeader);
  oReq.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      const contentType = oReq.getResponseHeader("Content-Type");
      if (contentType === "application/xml") {
        callback(oReq.responseText);
      } else {
        const jsonResponse = JSON.parse(oReq.responseText);
        callback(jsonResponse);
      }
    } else {
      setNetworkError();
    }
    if (this.readyState == 4 && this.status === 503) {
      if (finesse.containerservices.ContainerServices.hideMyGadget) {
        finesse.containerservices.ContainerServices.hideMyGadget();
      }
    } else if (this.readyState == 4 && this.status === 200) {
      finesse.containerservices.ContainerServices.showMygadget?.();
    }
  };
  oReq.send();
};

export const getCloudConnectTokenUrl = () => {
  const hostURL = finesse.gadget.Config.host;
  const hostPort = finesse.gadget.Config.hostPort;
  const scheme = finesse.gadget.Config.scheme;
  return `${scheme}://${hostURL}:${hostPort}/finesse/api/CloudConnectTokenService?tokenSource=jdstokenstore`;
};

export function initLog() {
  const cfg = finesse.gadget.Config;

  clientLogs = finesse.cslogger.ClientLogger;
  clientLogs.init(gadgets.Hub, "JDS Customer Journey Gadget", cfg);
}

export function log(message: string) {
  clientLogs.log(message);
}

export const getUrlVars = (url: string) => {
  const vars: any = {};
  url.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m, key, value) {
    vars[key] = value;
    return m;
  });

  return vars;
};

export const readQueryParams = () => {
  const gadgetURI = decodeURIComponent(getUrlVars(location.search)["url"]);
  return getUrlVars(gadgetURI);
};

export const setTokensToWidget = (sasTokens: SASTokens) => {
  const widget = document.querySelector("customer-journey-widget");

  if (!widget) {
    log("Widget not found");
    return;
  }

  widget.baseURL = "https://cjaas-devus2.azurewebsites.net";
  widget.baseURLAdmin = "https://cjaas-devus2-admin.azurewebsites.net";

  widget.tapeToken = sasTokens.tapeToken;
  widget.streamToken = sasTokens.streamToken;
  widget.profileReadToken = sasTokens.profileReadToken;
  widget.profileWriteToken = sasTokens.profileWriteToken || "";
  widget.identityReadSasToken = sasTokens.identityReadSASToken;
  widget.identityWriteSasToken = sasTokens.identityWriteSASToken;
  widget.userSearch = true;
  widget.eventIconTemplate = iconData;
};

export const getCustomerValues = (dialogData: UserData): any => {
  const callVariable: any[] = dialogData.mediaProperties.callvariables.CallVariable;
  const podIdData = callVariable.find((variable: { name: string }) => variable.name === "POD.ID");
  if (podIdData === null || podIdData === undefined) {
    return { mobile: dialogData.fromAddress };
  } else if (podIdData.value && podIdData.value.indexOf("=") !== -1) {
    const podIdCollection: string[] = podIdData.value.split(";");
    return podIdCollection.reduce((customerValues: any, podIdItem) => {
      const keyValue = podIdItem.split("=");
      customerValues[keyValue[0]] = keyValue[1];
      return customerValues;
    }, {});
  } else {
    return { cc_CustomerId: podIdData.value };
  }
};

export const getTokensFromQueryParams = (queryParamsValues: any): SASTokens => {
  const sanitize = (value: string) => decodeURIComponent(value);

  return {
    tapeToken: sanitize(queryParamsValues[QueryParams.tapeToken]),
    streamToken: sanitize(queryParamsValues[QueryParams.streamToken]),
    profileReadToken: sanitize(queryParamsValues[QueryParams.profileReadToken]),
    profileWriteToken: sanitize(queryParamsValues[QueryParams.profileWriteToken]),
    identityReadSASToken: sanitize(queryParamsValues[QueryParams.identityReadSasToken]),
    identityWriteSASToken: sanitize(queryParamsValues[QueryParams.identityWriteSASToken]),
  };
};
