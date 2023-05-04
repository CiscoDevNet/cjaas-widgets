import { TimeFrame } from "..";

export interface QueryParameters {
  bearerToken: string | null;
  baseUrl: string;
  organizationId: string | undefined;
  projectId: string | undefined;
  templateId: string;

  cadVariableLookup?: string | null;
  readOnlyAliases?: boolean;
  limit?: number;
  customer?: string;
  logsOn?: boolean;
  liveStream?: boolean;
  timeFrame?: TimeFrame;
  userSearch?: boolean;
  collapseTimelineSection?: boolean;
  collapseProfileSection?: boolean;
  collapseAliasSection?: boolean;
  iconDataPath?: string;
}

export enum QueryParams {
  baseUrl = "baseUrl",
  bearerToken = "bearerToken",
  organizationId = "organizationId",
  projectId = "projectId",
  minHeight = "minHeight",
  templateId = "templateId",
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
