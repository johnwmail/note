import type { Env } from "./types";

const NOTE_PREFIX = "note";

export function noteKey(noteId: string): string {
  return `${NOTE_PREFIX}/${noteId}`;
}

export async function readNote(env: Env, noteId: string): Promise<string> {
  const object = await env.NOTES_BUCKET.get(noteKey(noteId));
  return object ? object.text() : "";
}

export async function writeNote(env: Env, noteId: string, content: string): Promise<void> {
  await env.NOTES_BUCKET.put(noteKey(noteId), content, {
    httpMetadata: { contentType: "text/plain; charset=utf-8" },
  });
}

export async function deleteNote(env: Env, noteId: string): Promise<void> {
  await env.NOTES_BUCKET.delete(noteKey(noteId));
}
