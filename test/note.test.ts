import { describe, expect, it } from "vitest";
import { escapeHTML, extractPathNoteId, generateNoteId, getBasePath, validateNoteId } from "../src/note";

describe("note helpers", () => {
  it("validates note ids", () => {
    expect(validateNoteId("abc123")).toBe(true);
    expect(validateNoteId("ABC12")).toBe(true);
    expect(validateNoteId("invalid@id")).toBe(false);
    expect(validateNoteId("")).toBe(false);
  });

  it("generates 5-char note ids", () => {
    const noteId = generateNoteId();
    expect(noteId).toHaveLength(5);
    expect(validateNoteId(noteId)).toBe(true);
  });

  it("escapes html", () => {
    expect(escapeHTML("<script>alert('x')</script>")).toBe("&lt;script&gt;alert(&#39;x&#39;)&lt;/script&gt;");
  });

  it("extracts path note ids", () => {
    expect(extractPathNoteId("/noteid/ABC12")).toBe("ABC12");
    expect(extractPathNoteId("/noteid/ABC12/")).toBe("ABC12");
    expect(extractPathNoteId("/")).toBe("");
  });

  it("computes base path", () => {
    expect(getBasePath("/")).toBe("/");
    expect(getBasePath("/noteid/ABC12")).toBe("/");
    expect(getBasePath("/app/noteid/ABC12")).toBe("/app/");
  });
});
