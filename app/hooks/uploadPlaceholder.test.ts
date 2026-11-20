import { describe, expect, it } from "vitest";
import {
  insertPlaceholders,
  resolvePlaceholder,
  uploadingPlaceholder,
} from "./uploadPlaceholder";

const a = uploadingPlaceholder("a.webp", "1");
const b = uploadingPlaceholder("b.webp", "2");

describe("insertPlaceholders", () => {
  it("inserts all placeholders at the cursor, one per line", () => {
    const r = insertPlaceholders("前後", 1, 1, [a, b]);
    expect(r.content).toBe(`前${a}\n${b}後`);
    expect(r.cursor).toBe(1 + a.length + 1 + b.length);
  });

  it("replaces the selected range", () => {
    expect(insertPlaceholders("abcd", 1, 3, [a]).content).toBe(`a${a}d`);
  });
});

describe("resolvePlaceholder", () => {
  it("keeps every image when uploads finish in any order", () => {
    let content = insertPlaceholders("", 0, 0, [a, b]).content;
    content = resolvePlaceholder(content, b, "![b](https://x/b.webp)");
    content = resolvePlaceholder(content, a, "![a](https://x/a.webp)");
    expect(content).toBe("![a](https://x/a.webp)\n![b](https://x/b.webp)");
  });

  it("keeps text typed while uploading", () => {
    const content = `書いた${a}追記した`;
    expect(resolvePlaceholder(content, a, "![a](u)")).toBe("書いた![a](u)追記した");
  });

  it("removes the placeholder on failure", () => {
    expect(resolvePlaceholder(`x${a}y`, a, null)).toBe("xy");
  });

  it("appends the image when the placeholder was deleted", () => {
    expect(resolvePlaceholder("本文", a, "![a](u)")).toBe("本文\n![a](u)");
    expect(resolvePlaceholder("", a, "![a](u)")).toBe("![a](u)");
  });

  it("does nothing on failure when the placeholder was deleted", () => {
    expect(resolvePlaceholder("本文", a, null)).toBe("本文");
  });

  it("does not interpret $ patterns in the replacement", () => {
    expect(resolvePlaceholder(a, a, "![$&](u)")).toBe("![$&](u)");
  });
});
