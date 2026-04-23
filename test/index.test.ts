import { describe, expect, it } from "vitest";
import worker from "../src/index";
import { APP_VERSION, REPOSITORY_URL } from "../src/version";

class MockR2ObjectBody {
  constructor(private readonly value: string) {}
  async text(): Promise<string> {
    return this.value;
  }
}

class MockR2Bucket {
  storage = new Map<string, string>();

  async get(key: string): Promise<{ text(): Promise<string> } | null> {
    const value = this.storage.get(key);
    return value === undefined ? null : new MockR2ObjectBody(value);
  }

  async put(key: string, value: string): Promise<void> {
    this.storage.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.storage.delete(key);
  }
}

function makeEnv() {
  return { NOTES_BUCKET: new MockR2Bucket() };
}

describe("worker", () => {
  it("renders root html", async () => {
    const response = await worker.fetch(new Request("https://example.com/"), makeEnv() as never);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    const body = await response.text();
    expect(body).toContain("<textarea");
    expect(body).toContain(REPOSITORY_URL);
    expect(body).toContain(`>${APP_VERSION}<`);
  });

  it("creates a note", async () => {
    const env = makeEnv();
    const response = await worker.fetch(new Request("https://example.com/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "hello world" }),
    }), env as never);

    expect(response.status).toBe(200);
    const data = await response.json() as { success: boolean; noteId: string };
    expect(data.success).toBe(true);
    expect(data.noteId).toMatch(/^[A-HJ-NP-Z]{3,5}[2-9][2-9]$/);
    expect(env.NOTES_BUCKET.storage.get(`note/${data.noteId}`)).toBe("hello world");
  });

  it("loads an existing note", async () => {
    const env = makeEnv();
    env.NOTES_BUCKET.storage.set("note/GRAY47", "saved content");
    const response = await worker.fetch(new Request("https://example.com/noteid/GRAY47"), env as never);
    expect(response.status).toBe(200);
    expect(await response.text()).toContain("saved content");
  });

  it("deletes when content is empty", async () => {
    const env = makeEnv();
    env.NOTES_BUCKET.storage.set("note/GRAY47", "saved content");
    const response = await worker.fetch(new Request("https://example.com/noteid/GRAY47", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ noteId: "GRAY47", content: "" }),
    }), env as never);

    expect(response.status).toBe(200);
    expect(env.NOTES_BUCKET.storage.has("note/GRAY47")).toBe(false);
  });

  it("rejects invalid note ids", async () => {
    const response = await worker.fetch(new Request("https://example.com/noteid/bad@id"), makeEnv() as never);
    expect(response.status).toBe(400);
  });

  it("returns not found for unsupported paths", async () => {
    const response = await worker.fetch(new Request("https://example.com/nope"), makeEnv() as never);
    expect(response.status).toBe(404);
  });

  it("returns plain text usage for curl root", async () => {
    const response = await worker.fetch(new Request("http://example.com/", {
      headers: { "User-Agent": "curl/8.5.0" },
    }), makeEnv() as never);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/plain");
    expect(await response.text()).toBe([
      "Note - Lightweight note-taking app",
      `Version: ${APP_VERSION}`,
      "",
      "Usage Examples:",
      "===============",
      "",
      "# create new paste:",
      "echo \"Hello World\" | curl -sL --data-binary @- http://example.com/",
      "",
      "# create new paste with file:",
      "curl -sL --data-binary @/path/to/file.txt http://example.com/",
      "",
      "For more information and web interface, visit: http://example.com/",
      "",
    ].join("\n"));
  });

  it("returns plain text for curl get", async () => {
    const env = makeEnv();
    env.NOTES_BUCKET.storage.set("note/GRAY47", "curl content");
    const response = await worker.fetch(new Request("https://example.com/noteid/GRAY47", {
      headers: { "User-Agent": "curl/8.5.0" },
    }), env as never);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/plain");
    expect(await response.text()).toBe("curl content");
  });

  it("returns plain text url for curl post", async () => {
    const env = makeEnv();
    const response = await worker.fetch(new Request("https://example.com/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "curl/8.5.0",
      },
      body: JSON.stringify({ content: "hello from curl" }),
    }), env as never);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/plain");
    expect(await response.text()).toMatch(/^https:\/\/example\.com\/noteid\/[A-HJ-NP-Z]{3,5}[2-9][2-9]\n$/);
  });

  it("returns form response for form posts", async () => {
    const env = makeEnv();
    const response = await worker.fetch(new Request("https://example.com/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "text=hello+form",
    }), env as never);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/plain");
    expect(await response.text()).toMatch(/^OK: [A-HJ-NP-Z]{3,5}[2-9][2-9]\n$/);
  });

  it("rejects oversized notes", async () => {
    const env = makeEnv();
    const largeContent = "a".repeat(256 * 1024 + 1);
    const response = await worker.fetch(new Request("https://example.com/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: largeContent }),
    }), env as never);
    expect(response.status).toBe(413);
  });

  it("responds to OPTIONS preflight with CORS headers", async () => {
    const response = await worker.fetch(new Request("https://example.com/", {
      method: "OPTIONS",
    }), makeEnv() as never);
    expect(response.status).toBe(204);
    expect(response.headers.get("access-control-allow-origin")).toBe("*");
    expect(response.headers.get("access-control-allow-methods")).toContain("POST");
  });

  it("returns 405 for unsupported methods", async () => {
    const response = await worker.fetch(new Request("https://example.com/", {
      method: "DELETE",
    }), makeEnv() as never);
    expect(response.status).toBe(405);
  });

  it("returns 404 plain text for curl get on missing note", async () => {
    const response = await worker.fetch(new Request("https://example.com/noteid/GRAY47", {
      headers: { "User-Agent": "curl/8.5.0" },
    }), makeEnv() as never);
    expect(response.status).toBe(404);
    expect(response.headers.get("content-type")).toContain("text/plain");
  });

  it("returns 400 for POST to unsupported path", async () => {
    const response = await worker.fetch(new Request("https://example.com/nope", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "hello" }),
    }), makeEnv() as never);
    expect(response.status).toBe(404);
  });

  it("returns 400 for invalid JSON body", async () => {
    const response = await worker.fetch(new Request("https://example.com/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not json at all",
    }), makeEnv() as never);
    expect(response.status).toBe(400);
  });

  it("returns 400 for non-object JSON body", async () => {
    const response = await worker.fetch(new Request("https://example.com/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "null",
    }), makeEnv() as never);
    expect(response.status).toBe(400);
  });

  it("returns 400 for oversized note id", async () => {
    const longId = "A".repeat(33);
    const response = await worker.fetch(new Request(`https://example.com/noteid/${longId}`), makeEnv() as never);
    expect(response.status).toBe(400);
  });

  it("deletes note when content is whitespace only", async () => {
    const env = makeEnv();
    env.NOTES_BUCKET.storage.set("note/GRAY47", "saved content");
    const response = await worker.fetch(new Request("https://example.com/noteid/GRAY47", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ noteId: "GRAY47", content: "   " }),
    }), env as never);
    expect(response.status).toBe(200);
    expect(env.NOTES_BUCKET.storage.has("note/GRAY47")).toBe(false);
  });

  it("returns 200 when deleting a note that does not exist", async () => {
    const response = await worker.fetch(new Request("https://example.com/noteid/GRAY47", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ noteId: "GRAY47", content: "" }),
    }), makeEnv() as never);
    expect(response.status).toBe(200);
  });

  it("sets Cache-Control no-cache on html GET responses", async () => {
    const response = await worker.fetch(new Request("https://example.com/"), makeEnv() as never);
    expect(response.headers.get("cache-control")).toBe("no-cache");
  });

  it("body noteId takes precedence over path noteId", async () => {
    const env = makeEnv();
    const response = await worker.fetch(new Request("https://example.com/noteid/GRAY47", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ noteId: "DARK23", content: "body wins" }),
    }), env as never);
    expect(response.status).toBe(200);
    expect(env.NOTES_BUCKET.storage.get("note/DARK23")).toBe("body wins");
    expect(env.NOTES_BUCKET.storage.has("note/GRAY47")).toBe(false);
  });
});
