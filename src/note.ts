const NOTE_ID_PATTERN = /^[a-zA-Z0-9]+$/;
const NOTE_CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const DEFAULT_NOTE_ID_LENGTH = 5;

export function validateNoteId(noteId: string): boolean {
  return noteId.length > 0 && NOTE_ID_PATTERN.test(noteId);
}

export function generateNoteId(length = DEFAULT_NOTE_ID_LENGTH): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = "";
  for (const value of bytes) {
    out += NOTE_CHARSET[value % NOTE_CHARSET.length];
  }
  return out;
}

export function escapeHTML(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&#34;")
    .replaceAll("'", "&#39;");
}

export function extractPathNoteId(pathname: string): string {
  const match = pathname.match(/(?:^|\/)noteid\/([^/]+)\/?$/);
  return match ? match[1] : "";
}

export function isCurlRequest(request: Request): boolean {
  const userAgent = request.headers.get("user-agent") || "";
  return userAgent.toLowerCase().includes("curl");
}

export function getBasePath(pathname: string): string {
  const idx = pathname.indexOf("/noteid/");
  const base = idx === -1 ? pathname : pathname.slice(0, idx);
  return base.endsWith("/") ? base : `${base}/`;
}
