import { TimeFrame } from "..";

export interface SASTokens {
  tapeReadToken: string;
  streamReadToken: string;
  profileReadToken: string;
  profileWriteToken?: string;
  identityReadToken: string;
  identityWriteToken: string;
}

export interface QueryParameters {
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
  tapeReadToken: string;
  streamReadToken: string;
  profileReadToken: string;
  profileWriteToken?: string;
  identityReadToken: string;
  identityWriteToken: string;
}

export enum QueryParams {
  baseUrl = "baseUrl",
  tapeReadToken = "tapeReadToken",
  streamReadToken = "streamReadToken",
  profileReadToken = "profileReadToken",
  profileWriteToken = "profileWriteToken",
  identityReadToken = "identityReadToken",
  identityWriteToken = "identityWriteToken",
  minHeight = "minHeight",
  templateId = "profileTemplate",
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
