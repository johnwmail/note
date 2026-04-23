import { describe, expect, it } from "vitest";
import { escapeHTML, extractPathNoteId, generateNoteId, getBasePath, validateNoteId } from "../src/note";

describe("note helpers", () => {
  it("validates note ids", () => {
    // valid: generated format
    expect(validateNoteId("GRAY47")).toBe(true);
    expect(validateNoteId("BLAST23")).toBe(true);
    // valid: manual word-only
    expect(validateNoteId("APPLE")).toBe(true);
    expect(validateNoteId("ENDENT")).toBe(true);
    // valid: letters and allowed digits mixed
    expect(validateNoteId("ABC23XY")).toBe(true);
    // invalid: contains I or O
    expect(validateNoteId("OLIVE")).toBe(false);
    expect(validateNoteId("BIRD")).toBe(false);
    // invalid: contains 0 or 1
    expect(validateNoteId("NOTE01")).toBe(false);
    // invalid: lowercase
    expect(validateNoteId("gray47")).toBe(false);
    // invalid: special chars
    expect(validateNoteId("invalid@id")).toBe(false);
    // invalid: empty
    expect(validateNoteId("")).toBe(false);
    // invalid: too short
    expect(validateNoteId("AB")).toBe(false);
    // invalid: too long (33 chars)
    expect(validateNoteId("A".repeat(33))).toBe(false);
  });

  it("generates WORDnn format note ids", () => {
    const noteId = generateNoteId();
    expect(validateNoteId(noteId)).toBe(true);
    expect(noteId).toMatch(/^[A-HJ-NP-Z]{3,5}[2-9][2-9]$/);
    // digits must only be 2-9
    const digits = noteId.slice(-2);
    expect(digits).toMatch(/^[2-9][2-9]$/);
    // word part must contain no I or O
    const word = noteId.slice(0, -2);
    expect(word).not.toMatch(/[IO]/);
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
