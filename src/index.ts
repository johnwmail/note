import { renderHTML } from "./html";
import { APP_VERSION } from "./version";
import { deleteNote, readNote, writeNote } from "./storage";
import { extractPathNoteId, generateNoteId, getBasePath, isCurlRequest, validateNoteId } from "./note";
import { corsHeaders, html, json, jsonError, text } from "./response";
import type { Env, NoteRequest, NoteResponse } from "./types";

const MAX_NOTE_SIZE_BYTES = 256 * 1024;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      return await routeRequest(request, env);
    } catch (error) {
      console.error("Unhandled worker error", error);
      return jsonError(500, "Internal server error");
    }
  },
};

async function routeRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);

  if (url.pathname === "/favicon.ico") {
    return new Response(Uint8Array.from(atob("R0lGODlhEAAQAKIGAL7FzEBUaLK5wnOBkJCbp9nd4f///wAAACH5BAEAAAYALAAAAAAQABAAAANJaKrR7msFMga1o8UguvcBECyDUJ1lJjIdWgrharxfG49cDQL8SNeqXk4H4/V+n2BB9GjGjCOJcQrdUHmFZZRxnW4NzyvhC3ZCEgA7"), c => c.charCodeAt(0)), {
      headers: { "Content-Type": "image/gif" },
    });
  }

  switch (request.method) {
    case "GET":
      return handleGet(request, env, url);
    case "POST":
      return handlePost(request, env, url);
    case "OPTIONS":
      return new Response(null, { status: 204, headers: corsHeaders() });
    default:
      return text("Method not allowed", { status: 405 });
  }
}

async function handleGet(request: Request, env: Env, url: URL): Promise<Response> {
  if (!isSupportedPath(url.pathname)) {
    return text("Not found", { status: 404 });
  }

  const noteId = extractPathNoteId(url.pathname);
  if (noteId && !validateNoteId(noteId)) {
    return text("Invalid note ID", { status: 400 });
  }

  if (isCurlRequest(request) && !noteId) {
    return text(renderCurlHelp(url));
  }

  let content = "";
  if (noteId) {
    content = await readNote(env, noteId);
    console.log(JSON.stringify({ method: "GET", path: url.pathname, noteId, found: content !== "" }));
  }

  if (isCurlRequest(request) && noteId) {
    if (!content) {
      return text("Note not found", { status: 404 });
    }
    return text(content);
  }

  return html(renderHTML(noteId, content, request));
}

function renderCurlHelp(url: URL): string {
  const origin = url.origin;
  return [
    "Note - Lightweight note-taking app",
    `Version: ${APP_VERSION}`,
    "",
    "Usage Examples:",
    "===============",
    "",
    "# create new paste:",
    `echo \"Hello World\" | curl -sL --data-binary @- ${origin}/`,
    "",
    "# create new paste with file:",
    `curl -sL --data-binary @/path/to/file.txt ${origin}/`,
    "",
    `For more information and web interface, visit: ${origin}/`,
    "",
  ].join("\n");
}

async function handlePost(request: Request, env: Env, url: URL): Promise<Response> {
  if (!isSupportedPath(url.pathname)) {
    return jsonError(404, "Not found");
  }

  const bodyText = await request.text();
  const contentType = request.headers.get("content-type") || "";

  const noteRequest = parseNoteRequest(bodyText, contentType, url.pathname);
  if (noteRequest instanceof Response) {
    return noteRequest;
  }

  let noteId = (noteRequest.noteId || "").trim();
  if (!noteId) {
    noteId = generateNoteId();
  }

  if (!validateNoteId(noteId)) {
    return jsonError(400, "Invalid note ID format");
  }

  const content = noteRequest.content ?? "";
  if (new TextEncoder().encode(content).length > MAX_NOTE_SIZE_BYTES) {
    return jsonError(413, `Note exceeds ${MAX_NOTE_SIZE_BYTES} byte limit`);
  }

  if (content.trim() === "") {
    await deleteNote(env, noteId);
    console.log(JSON.stringify({ method: "POST", path: url.pathname, noteId, action: "delete" }));
  } else {
    await writeNote(env, noteId, content);
    console.log(JSON.stringify({ method: "POST", path: url.pathname, noteId, action: "save", size: content.length }));
  }

  if (isCurlRequest(request)) {
    const base = `${url.origin}${getBasePath(url.pathname)}`;
    return text(`${base}noteid/${noteId}\n`, { headers: corsHeaders() });
  }

  if (contentType.includes("application/x-www-form-urlencoded")) {
    return text(`OK: ${noteId}\n`, { headers: corsHeaders() });
  }

  const response: NoteResponse = { success: true, noteId };
  return json(response, { headers: corsHeaders() });
}

function isSupportedPath(pathname: string): boolean {
  return pathname === "/" || extractPathNoteId(pathname) !== "";
}

function parseNoteRequest(bodyText: string, contentType: string, pathname: string): NoteRequest | Response {
  const pathNoteId = extractPathNoteId(pathname);

  if (contentType.includes("application/json")) {
    try {
      const body = JSON.parse(bodyText) as NoteRequest;
      return {
        noteId: body.noteId || pathNoteId,
        content: typeof body.content === "string" ? body.content : "",
      };
    } catch {
      return jsonError(400, "Invalid JSON format");
    }
  }

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const params = new URLSearchParams(bodyText);
    if (params.has("text") || params.has("noteId")) {
      return {
        noteId: params.get("noteId") || pathNoteId,
        content: params.get("text") || "",
      };
    }
    return { noteId: pathNoteId, content: bodyText };
  }

  return { noteId: pathNoteId, content: bodyText };
}
