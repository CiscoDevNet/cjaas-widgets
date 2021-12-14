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
