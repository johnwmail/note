export interface Env {
  NOTES_BUCKET: R2Bucket;
}

export interface NoteRequest {
  noteId?: string;
  content?: string;
}

export interface NoteResponse {
  success: boolean;
  noteId?: string;
  error?: string;
}
