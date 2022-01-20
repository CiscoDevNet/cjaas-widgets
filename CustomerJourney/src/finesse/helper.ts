import { ConstantKeys, SASTokens, UserData } from "./interface";
import * as iconData from "@/assets/icons.json";

declare const finesse: any;
declare const gadgets: any;

// const ENV: any = process.env.DONTENV;
// const PRIVATE_KEY = ENV.PRIVATE_KEY;
const TAPE_TOKEN =
  "so=demoassure&sn=sandbox&ss=tape&sp=r&se=2022-11-23T20:33:44.019Z&sk=journeyUi&sig=Msa4zTsNmkeDHJcmQuXUVHTTzs1KATCQ%2FDNrVR2O7eU%3D";
const STREAM_TOKEN =
  "so=demoassure&sn=sandbox&ss=stream&sp=r&se=2022-11-23T20:30:20.765Z&sk=journeyUi&sig=76cI1nBPkA0HdQved8YHiTQbOThPOR8W5UdwZzeUuPc%3D";
const PROFILE_READ_TOKEN =
  "so=demoassure&sn=sandbox&ss=profile&sp=rw&se=2022-11-23T20:34:23.108Z&sk=journeyUi&sig=JydFx80vys0KNr8JwwgsUSPrj3y5fnLpj5afX9h2Hxc%3D";
const IDENTITY_READ_SAS_TOKEN =
  "so=demoassure&sn=sandbox&ss=idmt&sp=r&se=2024-09-09T16:11:06.254855600Z&sk=venkitest&sig=CTlbxZuc2FeWSlzT38SUYlEYqBz0UROqCAXQPDPaoiQ%3D";
const IDENTITY_WRITE_SAS_TOKEN =
  "so=demoassure&sn=sandbox&ss=idmt&sp=w&se=2024-09-09T18:29:51.574147700Z&sk=venkitest&sig=%2BPRGATu1qEvll6N1I3PdIHCKcyRlFwjJQ3aTf32Vl6o%3D";

let clientLogs: any;

export function setNetworkError() {}

export const getRequest = (url: string, callback: Function) => {
  const authorizationHeader = finesse.utilities.Utilities.getAuthHeaderString(
    finesse.gadget.Config,
  );
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

export const cacheAuthToken = (sasTokens: SASTokens) => {
  finesse.utilities.DesktopCache.saveOrUpdateData(
    [{ key: ConstantKeys.authTokenKey, data: sasTokens }],
    (err: any, data: any) => {
      log("Unable to cache token");
    },
  );
};

export function getTokenFromCherryPoint(callback: Function) {
  callback({
    tapeToken: TAPE_TOKEN,
    streamToken: STREAM_TOKEN,
    profileReadToken: PROFILE_READ_TOKEN,
    identityReadSASToken: IDENTITY_READ_SAS_TOKEN,
    identityWriteSASToken: IDENTITY_WRITE_SAS_TOKEN,
  } as SASTokens);
  // const url = getCloudConnectTokenUrl();
  // getRequest(url, callback);
}

export function getAuthToken(callback: Function) {
  finesse.utilities.DesktopCache.fetchData(
    ConstantKeys.authTokenKey,
    (err: any, cacheEntry: { data: SASTokens }) => {
      if (cacheEntry) {
        callback(cacheEntry.data);
      } else {
        getTokenFromCherryPoint(callback);
      }
    },
  );
}

export const getUrlVars = (url: string) => {
  const vars: any = {};
  const parts = url.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m, key, value) {
    vars[key] = value;
    return m;
  });

  return vars;
};

export const readQueryParams = () => {
  const gadgetURI = decodeURIComponent(getUrlVars(location.search)["url"]);
  const decodedGadgetURI = getUrlVars(gadgetURI);
  return decodedGadgetURI;
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

  gadgets.loadingindicator.dismiss();
};

export const getCustomerValues = (dialogData: UserData): any => {
  const callVariable: any[] =
    dialogData.mediaProperties.callvariables.CallVariable;
  const podIdData = callVariable.find(
    (variable: { name: string }) => variable.name === "POD.ID",
  );
  if (podIdData === null || podIdData === undefined) {
    return {};
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
