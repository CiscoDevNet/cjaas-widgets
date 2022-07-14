import * as helper from "./helper";
import { SASTokens, UserData } from "./interface";

declare const finesse: any;
declare const gadgets: any;

let containerServices: any;
let user: any;
let dialogs: any;
let queryParamsValues: any;
let agentNumber: string;
let mediaList: any;

const setCustomerIdToGadget = (dialogData: UserData) => {
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

  setCustomerIdToGadget(dialogData);
};

const handleEndDialog = () => {
  helper.log("handling end dialog");
};

const handleLoadDialog = () => {
  helper.log("handling load dialog");
};

const handleMediaDialogsLoad = (type: string) => (...args: any) => {
  console.log("[JDS Widget]", args, type);
};

const attachMediaDialog = (media: any) => {
  media.getMediaDialogs({
    onLoad: handleMediaDialogsLoad("Load"),
    onAdd: handleMediaDialogsLoad("Add"),
    onChange: handleMediaDialogsLoad("Change"),
    onDelete: handleMediaDialogsLoad("Delete"),
    onError: handleMediaDialogsLoad("Error"),
    onNotify: handleMediaDialogsLoad("Notify"),
  });
};

const handleMediaListLoad = () => {
  helper.log("New media loaded");
  const _mediaCollection = mediaList.getCollection();
  for (var mediaId in _mediaCollection) {
    if (_mediaCollection.hasOwnProperty(mediaId)) {
      const media = _mediaCollection[mediaId];
      helper.log(`Media ID ${mediaId}`);
      attachMediaDialog(media);
    }
  }
};

const handleUserLoad = () => {
  dialogs = user.getDialogs({
    onCollectionAdd: handleNewDialog,
    onCollectionDelete: handleEndDialog,
    onLoad: handleLoadDialog,
  });

  // for Chat and Email interactions
  try {
    mediaList = user.getMediaList({
      onLoad: handleMediaListLoad,
    });
  } catch (err) {
    helper.log("Error while handling media list");
  }
};

const subscribeUser = () => {
  const config = finesse.gadget.Config;
  finesse.clientservices.ClientServices.init(config, false);
  user = new finesse.restservices.User({
    id: config.id,
    onLoad: handleUserLoad,
  });
};

// gadget ready
const gadgetReady = () => {
  queryParamsValues = helper.readQueryParams(); // decoded

  // const tokens: SASTokens = helper.getTokensFromQueryParams(queryParamsValues);
  // helper.setTokensToWidget(tokens);

  helper.setParametersToWidget(queryParamsValues);

  helper.setMinHeight(queryParamsValues);
  // helper.setTemplate(queryParamsValues);

  subscribeUser();
};

// not required
const initiateContainerService = () => {
  // enable container services
  containerServices = finesse.containerservices.ContainerServices.init();

  finesse.containerservices.ContainerServices.enableTitleBar?.();

  finesse.containerServices.ContainerServices.addHandler(
    finesse.containerServices.Topics.ACTIVE_CALL_STATUS_EVENT,
    (event: { status: boolean; type: string }) => {
      if (event.status) {
        // answered a new call
        helper.log(event.type + " " + `${event.status}`);
      }
    }
  );

  containerServices.makeActiveTabReq();
};

// connect hook
gadgets.HubSettings.onConnect = function() {
  finesse && helper.initLog();

  gadgetReady();

  gadgets.loadingindicator.dismiss();
  gadgets.window.adjustHeight();
};
