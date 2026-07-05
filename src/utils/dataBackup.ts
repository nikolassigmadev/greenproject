// Export / import of all locally stored app data (scan history, watchlist,
// basket, priorities, dietary prefs, streaks…). Everything the app persists
// lives in localStorage on this origin, so a full-origin snapshot is the
// backup — no per-feature key list to fall out of date.

export interface BackupFile {
  app: "goodscan";
  version: 1;
  exportedAt: string;
  data: Record<string, string>;
}

export function createBackup(): BackupFile {
  const data: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key === null) continue;
    const value = localStorage.getItem(key);
    if (value !== null) data[key] = value;
  }
  return {
    app: "goodscan",
    version: 1,
    exportedAt: new Date().toISOString(),
    data,
  };
}

export function serializeBackup(): string {
  return JSON.stringify(createBackup(), null, 2);
}

export type RestoreResult =
  | { ok: true; restoredKeys: number }
  | { ok: false; error: string };

// Merge-overwrite: keys in the backup replace current values, keys the backup
// doesn't know about are left alone (so importing an old backup can't wipe
// data created since).
export function restoreBackup(json: string): RestoreResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { ok: false, error: "That file isn't valid JSON." };
  }

  const backup = parsed as Partial<BackupFile> | null;
  if (
    !backup ||
    typeof backup !== "object" ||
    backup.app !== "goodscan" ||
    backup.version !== 1 ||
    typeof backup.data !== "object" ||
    backup.data === null
  ) {
    return { ok: false, error: "That file isn't a GoodScan backup." };
  }

  let restoredKeys = 0;
  try {
    for (const [key, value] of Object.entries(backup.data)) {
      if (typeof value !== "string") continue;
      localStorage.setItem(key, value);
      restoredKeys++;
    }
  } catch {
    return { ok: false, error: "Ran out of storage space while restoring." };
  }

  return { ok: true, restoredKeys };
}

export function backupFilename(now: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `goodscan-backup-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.json`;
}
