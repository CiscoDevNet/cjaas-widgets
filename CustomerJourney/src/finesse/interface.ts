export interface SASTokens {
  tapeToken: string;
  streamToken: string;
  profileReadToken: string;
  profileWriteToken?: string;
  identityReadSASToken: string;
  identityWriteSASToken: string;
}

export enum ConstantKeys {
  authTokenKey = "cjdsSASTokenKey",
}

export interface ParsedFilterTags {
  isAgentIdRequired: boolean;
  isTeamIdRequired: boolean;
}

export enum QueryParams {
  agentId = "cc_AgentId",
  teamId = "cc_TeamId",
  queueId = "cc_QueueId",
  customerId = "cc_CustomerId",
  filterTags = "filterTags",
  spaceId = "spaceId",
  metricId = "metricId",
}

export interface UserData {
  id: string;
  mediaProperties: any;
  mediaType: string;
  participants: any;
  state: string;
  taskId: any;
  uri: string;
  fromAddress: string;
}
