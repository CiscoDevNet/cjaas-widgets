import { TimeFrame } from "..";

export interface QueryParameters {
  bearerToken: string | null;
  organizationId: string | undefined;
  workspaceId: string | undefined;
  baseUrl: string;
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
  templateId: string;
}

export enum QueryParams {
  baseUrl = "baseUrl",
  bearerToken = "bearerToken",
  organizationId = "organizationId",
  workspaceId = "workspaceId",
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
