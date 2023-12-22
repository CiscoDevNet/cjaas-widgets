import { TimelineV2 } from "@/components/timeline-v2/TimelineV2";

export interface QueryParameters {
  bearerToken: string | null;
  baseUrl: string;
  organizationId: string | undefined;
  projectId: string | undefined;

  templateId: string;
  cadVariableLookup?: string | null;
  //   readOnlyAliases?: boolean;
  limit?: number;
  customer?: string;
  logsOn?: boolean;
  disableEventStream?: boolean;
  //   defaultTimeRangeOption?: TimelineV2.TimeRangeOption.Last30Days;
  disableUserSearch?: boolean;
  //   collapseTimelineSection?: boolean;
  //   collapseProfileSection?: boolean;
  //   collapseAliasSection?: boolean;
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
