import { describe, it, expect, beforeEach } from "vitest";
import { createBackup, serializeBackup, restoreBackup, backupFilename } from "./dataBackup";

describe("dataBackup", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("exports every localStorage key", () => {
    localStorage.setItem("goodscan-priorities", '{"environment":100}');
    localStorage.setItem("goodscan-watchlist", '["nestle"]');

    const backup = createBackup();

    expect(backup.app).toBe("goodscan");
    expect(backup.version).toBe(1);
    expect(backup.data["goodscan-priorities"]).toBe('{"environment":100}');
    expect(backup.data["goodscan-watchlist"]).toBe('["nestle"]');
  });

  it("round-trips through serialize + restore", () => {
    localStorage.setItem("goodscan-priorities", '{"environment":100}');
    const json = serializeBackup();
    localStorage.clear();

    const result = restoreBackup(json);

    expect(result).toEqual({ ok: true, restoredKeys: 1 });
    expect(localStorage.getItem("goodscan-priorities")).toBe('{"environment":100}');
  });

  it("merges over existing data without deleting unknown keys", () => {
    localStorage.setItem("kept-key", "kept");
    localStorage.setItem("overwritten-key", "old");

    const result = restoreBackup(
      JSON.stringify({
        app: "goodscan",
        version: 1,
        exportedAt: new Date().toISOString(),
        data: { "overwritten-key": "new" },
      }),
    );

    expect(result.ok).toBe(true);
    expect(localStorage.getItem("kept-key")).toBe("kept");
    expect(localStorage.getItem("overwritten-key")).toBe("new");
  });

  it("rejects non-JSON input", () => {
    const result = restoreBackup("not json at all");
    expect(result.ok).toBe(false);
  });

  it("rejects JSON that isn't a GoodScan backup", () => {
    expect(restoreBackup('{"foo":"bar"}').ok).toBe(false);
    expect(restoreBackup('{"app":"other","version":1,"data":{}}').ok).toBe(false);
    expect(restoreBackup("null").ok).toBe(false);
  });

  it("skips non-string values instead of corrupting storage", () => {
    const result = restoreBackup(
      JSON.stringify({
        app: "goodscan",
        version: 1,
        exportedAt: new Date().toISOString(),
        data: { good: "value", bad: 42 },
      }),
    );

    expect(result).toEqual({ ok: true, restoredKeys: 1 });
    expect(localStorage.getItem("good")).toBe("value");
    expect(localStorage.getItem("bad")).toBeNull();
  });

  it("names the file with the current date", () => {
    expect(backupFilename(new Date(2026, 6, 5))).toBe("goodscan-backup-2026-07-05.json");
  });
});
