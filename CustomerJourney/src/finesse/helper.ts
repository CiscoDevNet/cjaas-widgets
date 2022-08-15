import { QueryParameters, QueryParams, SASTokens, UserData } from "./interface";
import * as iconData from "@/assets/icons.json";
import { TimeFrame } from "..";

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

const sanitize = (value: string) => decodeURIComponent(value);

export const setParametersToWidget = (queryParams: QueryParameters) => {
  const widget = document.querySelector("customer-journey-widget");

  if (!widget) {
    log("Widget not found");
    return;
  }

  console.log("[JDS Widget][setParametersToWidget] queryParams:", queryParams);

  const tapeReadToken = sanitize(queryParams[QueryParams.tapeReadToken]);
  const streamReadToken = sanitize(queryParams[QueryParams.streamReadToken]);
  const profileReadToken = sanitize(queryParams[QueryParams.profileReadToken]);
  const profileWriteToken = sanitize(queryParams[QueryParams.profileWriteToken]);
  const identityReadToken = sanitize(queryParams[QueryParams.identityReadToken]);
  const identityWriteToken = sanitize(queryParams[QueryParams.identityWriteToken]);

  console.log("sasTokens have been sanitized. tapeReadToken=", tapeReadToken);

  widget.baseUrl = queryParams?.baseUrl;
  widget.limit = queryParams?.limit || 20;
  widget.customer = queryParams?.customer || null;
  widget.logsOn = queryParams?.logsOn || false;
  widget.liveStream = queryParams?.liveStream || false;
  widget.timeFrame = queryParams?.timeFrame || TimeFrame.All;
  widget.userSearch = queryParams?.userSearch || false;
  widget.collapseProfileSection = queryParams?.collapseProfileSection || false;
  widget.collapseAliasSection = queryParams?.collapseAliasSection || false;
  widget.collapseTimelineSection = queryParams?.collapseTimelineSection || false;
  widget.iconDataPath = queryParams?.iconDataPath || "";
  widget.templateId = queryParams?.templateId || "journey-default-template";

  widget.tapeReadToken = tapeReadToken || null;
  widget.streamReadToken = streamReadToken || null;
  widget.profileReadToken = profileReadToken || null;
  widget.profileWriteToken = profileWriteToken || null;
  widget.identityReadToken = identityReadToken || null;
  widget.identityWriteToken = identityWriteToken || null;
  widget.userSearch = true;
  widget.eventIconTemplate = iconData;

  console.log("[JDS Widget][setParametersToWidget] widget initialized", widget);
  console.log("[JDS Widget][setParametersToWidget] widget's tapeReadToken", widget.tapeReadToken);
};

// export const setTokensToWidget = (sasTokens: SASTokens) => {
//   const widget = document.querySelector("customer-journey-widget");

//   if (!widget) {
//     log("Widget not found");
//     return;
//   }

//   widget.tapeReadToken = sasTokens.tapeReadToken;
//   widget.streamReadToken = sasTokens.streamReadToken;
//   widget.profileReadToken = sasTokens.profileReadToken;
//   widget.profileWriteToken = sasTokens.profileWriteToken || "";
//   widget.identityReadToken = sasTokens.identityReadToken;
//   widget.identityWriteToken = sasTokens.identityWriteToken;
//   widget.userSearch = true;
//   widget.eventIconTemplate = iconData;
// };

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

export const setMinHeight = (queryParamsValue: any) => {
  const minHeightParam = queryParamsValue[QueryParams.minHeight];

  if (minHeightParam) {
    const minHeight = sanitize(minHeightParam);
    document.body.style.minHeight = minHeight;
  }
};

export const setTemplate = (queryParamsValue: any) => {
  const templateId = sanitize(queryParamsValue[QueryParams.templateId]);

  if (templateId) {
    const widget = document.querySelector("customer-journey-widget");
    if (widget) {
      widget.templateId = templateId;
    }
  }
};
