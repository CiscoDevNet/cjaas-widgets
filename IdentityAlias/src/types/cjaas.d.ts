export interface ServerSentEvent {
  data: string;
}

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
