export interface SASTokens {
  tapeToken: string;
  streamToken: string;
  profileReadToken: string;
  profileWriteToken?: string;
  identityReadSASToken: string;
  identityWriteSASToken: string;
}

export enum QueryParams {
  tapeToken = "tapeToken",
  streamToken = "streamToken",
  profileReadToken = "profileReadToken",
  profileWriteToken = "profileWriteToken",
  identityReadSasToken = "identityReadToken",
  identityWriteSASToken = "identityWriteToken",
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
