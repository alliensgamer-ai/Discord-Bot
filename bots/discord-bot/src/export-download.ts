import { stat } from "node:fs/promises";
import path from "node:path";

export const EXPORT_ARCHIVE_PATH = path.resolve(
  "/home/runner/workspace/puzzles-bot-wispbyte.zip",
);
export const EXPORT_ARCHIVE_NAME = "puzzles-bot-wispbyte.zip";
export const MAX_DISCORD_ATTACHMENT_BYTES = 10 * 1024 * 1024;

export type PreparedExportArchive = {
  path: string;
  size: number;
};

export async function getExportArchive(): Promise<PreparedExportArchive> {
  const archiveStat = await stat(EXPORT_ARCHIVE_PATH).catch(() => null);
  if (!archiveStat?.isFile()) {
    throw new Error("No se encontró puzzles-bot-wispbyte.zip en la raíz del proyecto.");
  }
  if (archiveStat.size <= 0) {
    throw new Error("El archivo puzzles-bot-wispbyte.zip está vacío.");
  }

  return { path: EXPORT_ARCHIVE_PATH, size: archiveStat.size };
}