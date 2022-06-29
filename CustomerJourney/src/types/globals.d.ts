/**
 * Copyright (c) Cisco Systems, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import * as lit from "lit-element";

declare global {
  interface Window {
    Webex: any;
  }
  type CSSResult = lit.CSSResult;

  type Interaction = {
    customerName?: string;
    mediaType?: string;
    mediaChannel?: string;
    isWrapUp?: boolean;
    queueId?: string;
    ani?: string;
    destAgentName?: string | undefined;
    destAgentPhoneNumber?: string | undefined;
    agentId?: string;
    consultHold?: boolean;
    consultMediaResourceId?: string;
    owner?: string;
    ownerName?: string | undefined;
    ownerPhoneNumber?: string | undefined;
    orgId?: string;
    interactionId?: string;
    destAgentId?: string | undefined;
    mediaResourceId?: string;
    isConsulted?: boolean;
    isFcManaged?: boolean;
    state?: string;
    isTerminated?: boolean;
    timeStamp?: number;
    consultTimeStamp?: number | null;
    wrapUpTimestamp?: number | null;
    holdTimestamp?: number | null;
    consultHoldTimestamp?: number | null;
    hasJoined?: boolean;
    ronaTimeout?: string;
    virtualTeamName?: string;
    ivrPath?: string;
    phoneNumber?: string;
    pathId?: string;
    dnis?: string;
    category?: string;
    additionalDetails?: string;
    sourceNumber?: string;
    sourcePage?: string;
    appUser?: string;
    customerNumber?: string;
    isConferencing?: boolean;
    isRecorded?: boolean;
    isRecordingPaused?: boolean;
    isPauseResumeEnabled?: boolean;
    recordingPauseDuration?: string;
    contactDirection?: string;
    outboundType?: string;
    isHold?: boolean;
    ctqInProgress?: boolean;
    outdialTransferToQueueEnabled?: boolean;
    callAssociatedData?: string;
    hasCustomerLeft?: boolean;
    isConvNotFound?: boolean;
    updatedBy?: string;
  };
}