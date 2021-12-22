export interface ServerSentEvent {
  data: string;
}

export interface ProfileConfig {
  Name: string;
  DatapointCount: number;
  Attributes: Array<{
    Version: string;
    Event: string;
    Metadata: any;
    Limit: number;
    DisplayName: string;
    AggregationMode:
      | "Value"
      | "Count"
      | "Sum"
      | "Max"
      | "Min"
      | "Average"
      | "Distinct";
  }>;
}

export interface ProfileFromSyncAPI {
  name: string;
  customerId: string;
  generatedAt: string;
  attributeView: Array<AttributeView>;
}

export interface AttributeView {
  queryTemplate: {
    version: string;
    event: string;
    metadata: string;
    limit: number;
    displayName: string;
    aggregationType: number;
    aggregationMode: string;
  };
  result: string;
  journeyEvents?: string;
}

export type Profile = Array<{
  query: AttributeView["queryTemplate"];
  // result string is split into array
  result: Array<string>;
  journeyEvents: AttributeView["journeyEvents"];
}>;

export interface JourneyEvent {
  data: {
    [key: string]: string;
  };
  dataContentType: string;
  id: string;
  person: string;
  source: string;
  specVersion: string;
  time: string;
  type: string;
}

export interface IdentityResponse {
  meta: {
    orgId: string;
  };
  data: {
    namespace: string;
    id: string;
    aliases: string[];
    lastSeen: JourneyEvent;
  };
}

export interface IdentityErrorResponse {
  error: {
    key: number;
    message: {
      description: string;
    }[];
  };
  trackingId: string;
}

export interface Alias {
  namespace: string;
  id: string;
  aliases: string[];
}
