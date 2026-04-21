import { describe, expect, it } from "vitest";
import { resolveProfileView } from "./resolveProfileView";

describe("resolveProfileView", () => {
  describe("優先順位", () => {
    it("query > cookie > referer の順で優先される", () => {
      expect(
        resolveProfileView({
          query: "dev",
          cookie: "creator",
          referer: "https://www.pixiv.net/xxx",
        })
      ).toBe("engineer");
    });

    it("query が無い時は cookie を使う", () => {
      expect(
        resolveProfileView({
          query: null,
          cookie: "engineer",
          referer: "https://www.pixiv.net/xxx",
        })
      ).toBe("engineer");
    });

    it("query・cookie 無しの時は referer を使う", () => {
      expect(
        resolveProfileView({
          query: null,
          cookie: null,
          referer: "https://zenn.dev/xxx",
        })
      ).toBe("engineer");
    });

    it("全部無ければデフォルト creator", () => {
      expect(resolveProfileView({})).toBe("creator");
    });
  });

  describe("クエリの別名解決", () => {
    it("?as=dev で engineer", () => {
      expect(resolveProfileView({ query: "dev" })).toBe("engineer");
    });
    it("?as=tech で engineer", () => {
      expect(resolveProfileView({ query: "tech" })).toBe("engineer");
    });
    it("?as=engineer で engineer", () => {
      expect(resolveProfileView({ query: "engineer" })).toBe("engineer");
    });
    it("?as=creator で creator", () => {
      expect(resolveProfileView({ query: "creator" })).toBe("creator");
    });
    it("大文字小文字を無視する", () => {
      expect(resolveProfileView({ query: "DEV" })).toBe("engineer");
      expect(resolveProfileView({ query: "Creator" })).toBe("creator");
    });
    it("無効な値は無視される", () => {
      expect(
        resolveProfileView({ query: "hacker", cookie: "engineer" })
      ).toBe("engineer");
      expect(resolveProfileView({ query: "" })).toBe("creator");
    });
  });

  describe("referer 分類", () => {
    it("GitHub → engineer", () => {
      expect(
        resolveProfileView({ referer: "https://github.com/foo/bar" })
      ).toBe("engineer");
    });
    it("Zenn → engineer", () => {
      expect(resolveProfileView({ referer: "https://zenn.dev/x/a" })).toBe(
        "engineer"
      );
    });
    it("Qiita → engineer", () => {
      expect(resolveProfileView({ referer: "https://qiita.com/x/a" })).toBe(
        "engineer"
      );
    });
    it("pixiv → creator", () => {
      expect(
        resolveProfileView({ referer: "https://www.pixiv.net/artworks/1" })
      ).toBe("creator");
    });
    it("YouTube → creator", () => {
      expect(resolveProfileView({ referer: "https://youtu.be/abc" })).toBe(
        "creator"
      );
    });
    it("Bluesky → creator", () => {
      expect(
        resolveProfileView({ referer: "https://bsky.app/profile/foo" })
      ).toBe("creator");
    });
    it("サブドメインもマッチする (gist.github.com)", () => {
      expect(
        resolveProfileView({ referer: "https://gist.github.com/foo" })
      ).toBe("engineer");
    });
    it("X (twitter) は判定しない → デフォルト creator", () => {
      expect(resolveProfileView({ referer: "https://x.com/foo/status/1" })).toBe(
        "creator"
      );
      expect(resolveProfileView({ referer: "https://twitter.com/foo" })).toBe(
        "creator"
      );
    });
    it("X でも既存 cookie があれば尊重", () => {
      expect(
        resolveProfileView({
          referer: "https://x.com/foo",
          cookie: "engineer",
        })
      ).toBe("engineer");
    });
    it("未登録ドメイン → null 扱いでデフォルト", () => {
      expect(
        resolveProfileView({ referer: "https://example.com/foo" })
      ).toBe("creator");
    });
    it("不正な referer URL でもエラーにならない", () => {
      expect(resolveProfileView({ referer: "not a url" })).toBe("creator");
    });
    it("空 referer はデフォルト", () => {
      expect(resolveProfileView({ referer: "" })).toBe("creator");
      expect(resolveProfileView({ referer: null })).toBe("creator");
    });
  });

  describe("cookie の扱い", () => {
    it("cookie に creator があれば creator", () => {
      expect(resolveProfileView({ cookie: "creator" })).toBe("creator");
    });
    it("cookie に engineer があれば engineer", () => {
      expect(resolveProfileView({ cookie: "engineer" })).toBe("engineer");
    });
    it("無効な cookie 値は無視", () => {
      expect(resolveProfileView({ cookie: "hacker" })).toBe("creator");
    });
  });
});
