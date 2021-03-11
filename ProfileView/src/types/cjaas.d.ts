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

export interface Profile {
  name: string;
  customerId: string;
  generatedAt: string;
  attributeView: Array<{
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
  }>;
}
