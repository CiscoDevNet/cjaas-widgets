import * as helper from "./helper";
import {
  ParsedFilterTags,
  QueryParams,
  SASTokens,
  UserData,
} from "./interface";

declare const finesse: any;
declare const gadgets: any;

let agentId: any;
let containerServices: any;
let user: any;
let dialogs: any;
let queryParamsValues: any;
let agentNumber: string;

export const getFilterTags = (filterTagsParam: string) => {
  const filterTags: ParsedFilterTags = {
    isAgentIdRequired: false,
    isTeamIdRequired: false,
  };
  if (!filterTagsParam) {
    return filterTags;
  }
  const parsedTags = filterTagsParam.split(",");
  filterTags.isAgentIdRequired = parsedTags.indexOf(QueryParams.agentId) !== -1;
  filterTags.isTeamIdRequired = parsedTags.indexOf(QueryParams.teamId) !== -1;
  return filterTags;
};

export const getAgentId = (config: any, filterTags: ParsedFilterTags) => {
  if (filterTags.isAgentIdRequired && config.cceSkillTargetId) {
    return config.cceSkillTargetId;
  } else if (filterTags.isAgentIdRequired) {
    return config.id;
  } else {
    return null;
  }
};

const getAgentAndTeamId = (
  filterTagsParam: string,
  config: any,
  callback: Function,
) => {
  const parsedFilterTags = getFilterTags(filterTagsParam);
  agentId = getAgentId(config, parsedFilterTags);
  agentNumber = config.extension;

  callback();
};

const setCustomerIdToGadget = (dialogData: UserData, channelType: "Voice") => {
  const customerValues = helper.getCustomerValues(dialogData);
  const customerId = customerValues?.cc_CustomerId;
  const emailId = customerValues?.emailId;
  const mobile = customerValues?.mobile;

  const personId = customerId || mobile || emailId;

  const widget = document.querySelector("customer-journey-widget");
  if (widget) {
    widget.customer = personId;
  }
};

const handleNewDialog = (dialog: { _data?: any }) => {
  if (!dialog || !dialog._data) {
    return;
  }
  const dialogData = dialog._data;

  if (agentNumber === dialogData.fromAddress) {
    return;
  }

  /** As we discussed with CCE and finesse team. Supervisor monitor will not have
   * proper dialog data like customer id. So we are simply ignore that event to avoid
   * any changes in agent side
   */
  if (dialogData.mediaProperties.callType === "SUPERVISOR_MONITOR") {
    return;
  }

  // activeCalls.push(dialogData);
  setCustomerIdToGadget(dialogData, "Voice");

  helper.log("handling new dialog");
};

const handleEndDialog = () => {
  helper.log("handling end dialog");
};

const handleLoadDialog = () => {
  helper.log("handling load dialog");
};

const handleUserLoad = () => {
  dialogs = user.getDialogs({
    onCollectionAdd: handleNewDialog,
    onCollectionDelete: handleEndDialog,
    onLoad: handleLoadDialog,
  });
};

const subscribeUser = () => {
  const config = finesse.gadget.Config;
  finesse.clientservices.ClientServices.init(config, false);
  user = new finesse.restservices.User({
    id: config.id,
    onLoad: handleUserLoad,
  });
  return config;
};

// gadget ready
const gadgetReady = () => {
  queryParamsValues = helper.readQueryParams();
  const gadgetConfig = subscribeUser();
  const filterTagsParam = queryParamsValues[QueryParams.filterTags];

  getAgentAndTeamId(filterTagsParam, gadgetConfig, () => {
    helper.getAuthToken((sasTokens: SASTokens) => {
      helper.cacheAuthToken(sasTokens);
      helper.setTokensToWidget(sasTokens);
    });
  });
};

// connect hook
gadgets.HubSettings.onConnect = function() {
  // helper.loadExternalResources(EXTERNAL_SCRIPTS);
  helper.initLog();

  // enable container services
  containerServices = finesse.containerservices.ContainerServices.init();

  finesse.containerservices.ContainerServices.enableTitleBar?.();

  containerServices.makeActiveTabReq();

  gadgetReady();
  gadgets.loadingindicator.dismiss();
  // subscribeTabChange();
  // attachListenersForGadgets();
  // handleTask();
};
