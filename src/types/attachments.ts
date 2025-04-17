// Types related to file attachments and uploads

export interface Attachment {
  name: string;
  type: string;
  size: number;
  base64: string;
}