import { describe, expect, it } from "vitest";
import worker from "../src/index";

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
    expect(await response.text()).toContain("<textarea");
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
    expect(data.noteId).toHaveLength(5);
    expect(env.NOTES_BUCKET.storage.get(`note/${data.noteId}`)).toBe("hello world");
  });

  it("loads an existing note", async () => {
    const env = makeEnv();
    env.NOTES_BUCKET.storage.set("note/ABCDE", "saved content");
    const response = await worker.fetch(new Request("https://example.com/noteid/ABCDE"), env as never);
    expect(response.status).toBe(200);
    expect(await response.text()).toContain("saved content");
  });

  it("deletes when content is empty", async () => {
    const env = makeEnv();
    env.NOTES_BUCKET.storage.set("note/ABCDE", "saved content");
    const response = await worker.fetch(new Request("https://example.com/noteid/ABCDE", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ noteId: "ABCDE", content: "" }),
    }), env as never);

    expect(response.status).toBe(200);
    expect(env.NOTES_BUCKET.storage.has("note/ABCDE")).toBe(false);
  });

  it("rejects invalid note ids", async () => {
    const response = await worker.fetch(new Request("https://example.com/noteid/bad@id"), makeEnv() as never);
    expect(response.status).toBe(400);
  });

  it("returns not found for unsupported paths", async () => {
    const response = await worker.fetch(new Request("https://example.com/nope"), makeEnv() as never);
    expect(response.status).toBe(404);
  });

  it("returns plain text for curl get", async () => {
    const env = makeEnv();
    env.NOTES_BUCKET.storage.set("note/ABCDE", "curl content");
    const response = await worker.fetch(new Request("https://example.com/noteid/ABCDE", {
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
    expect(await response.text()).toMatch(/^https:\/\/example\.com\/noteid\/[A-Z0-9]{5}\n$/);
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
    expect(await response.text()).toMatch(/^OK: [A-Z0-9]{5}\n$/);
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
});
