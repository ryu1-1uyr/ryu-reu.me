import { describe, expect, it } from "vitest";
import { pastedFileName, pickPastedImages, shouldReencode } from "./pastedImage";

const file = (name: string, type: string) => new File(["x"], name, { type });

describe("pickPastedImages", () => {
  it("keeps only image files", () => {
    const picked = pickPastedImages([
      file("image.png", "image/png"),
      file("note.txt", "text/plain"),
      file("anim.gif", "image/gif"),
    ]);
    expect(picked.map((f) => f.name)).toEqual(["image.png", "anim.gif"]);
  });

  it("returns empty for text-only clipboard", () => {
    expect(pickPastedImages([])).toEqual([]);
  });
});

describe("shouldReencode", () => {
  it("re-encodes PNG from the clipboard", () => {
    expect(shouldReencode("image/png")).toBe(true);
  });

  it("leaves GIF (animation) and already compressed formats alone", () => {
    expect(shouldReencode("image/gif")).toBe(false);
    expect(shouldReencode("image/jpeg")).toBe(false);
    expect(shouldReencode("image/webp")).toBe(false);
  });
});

describe("pastedFileName", () => {
  const now = new Date(2026, 10, 20, 9, 5, 7);

  it("names by timestamp with the extension of the final type", () => {
    expect(pastedFileName("image/webp", now)).toBe("pasted-20261120-090507.webp");
    expect(pastedFileName("image/jpeg", now)).toBe("pasted-20261120-090507.jpg");
  });

  it("adds a suffix for the second and later images of one paste", () => {
    expect(pastedFileName("image/png", now, 1)).toBe("pasted-20261120-090507-2.png");
  });

  it("falls back to png for unknown types", () => {
    expect(pastedFileName("image/bmp", now)).toBe("pasted-20261120-090507.png");
  });
});
