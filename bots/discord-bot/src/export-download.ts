import { readdir, stat, unlink } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";

export const EXPORT_DIRECTORY =
  "/home/runner/workspace/puzzles-bot-wispbyte-export";
export const EXPORT_ARCHIVE_NAME = "puzzles-bot-wispbyte-export.zip";
export const MAX_DISCORD_ATTACHMENT_BYTES = 10 * 1024 * 1024;

export type PreparedExportArchive = {
  path: string;
  size: number;
};

export async function createExportArchive(): Promise<PreparedExportArchive> {
  const exportDirectory = path.resolve(EXPORT_DIRECTORY);
  await assertExportDirectory(exportDirectory);

  const files = await collectSafeFiles(exportDirectory);
  if (files.length === 0) {
    throw new Error("La carpeta de exportación no contiene archivos válidos.");
  }

  const archivePath = path.join(
    os.tmpdir(),
    `puzzles-bot-wispbyte-export-${randomUUID()}.zip`,
  );

  try {
    await runProcess(
      "zip",
      ["-q", "-X", archivePath, ...files],
      exportDirectory,
    );

    const archiveStat = await stat(archivePath);
    if (!archiveStat.isFile() || archiveStat.size <= 0) {
      throw new Error("No se pudo generar un ZIP válido.");
    }

    const archiveEntries = await listArchiveEntries(archivePath);
    const invalidEntry = archiveEntries.find(isForbiddenArchiveEntry);
    if (invalidEntry) {
      throw new Error(
        `La validación de seguridad rechazó el archivo ${invalidEntry}.`,
      );
    }

    return { path: archivePath, size: archiveStat.size };
  } catch (error) {
    await unlink(archivePath).catch(() => undefined);
    throw error;
  }
}

export async function removeExportArchive(
  archive: PreparedExportArchive,
): Promise<void> {
  const resolvedPath = path.resolve(archive.path);
  if (
    path.dirname(resolvedPath) !== path.resolve(os.tmpdir()) ||
    !path.basename(resolvedPath).startsWith("puzzles-bot-wispbyte-export-") ||
    path.extname(resolvedPath) !== ".zip"
  ) {
    throw new Error("La limpieza rechazó una ruta de archivo no autorizada.");
  }

  await unlink(resolvedPath).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== "ENOENT") {
      throw error;
    }
  });
}

async function assertExportDirectory(exportDirectory: string) {
  const directoryStat = await stat(exportDirectory).catch(() => null);
  if (!directoryStat?.isDirectory()) {
    throw new Error("La carpeta de exportación no está disponible.");
  }
}

async function collectSafeFiles(
  exportDirectory: string,
  currentDirectory = exportDirectory,
): Promise<string[]> {
  const entries = await readdir(currentDirectory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const absolutePath = path.join(currentDirectory, entry.name);
    const relativePath = path.relative(exportDirectory, absolutePath);
    const safePath = resolveInsideDirectory(exportDirectory, relativePath);

    if (isForbiddenPath(relativePath)) {
      continue;
    }

    if (entry.isSymbolicLink()) {
      continue;
    }

    if (entry.isDirectory()) {
      files.push(...(await collectSafeFiles(exportDirectory, safePath)));
    } else if (entry.isFile()) {
      files.push(relativePath);
    }
  }

  return files;
}

function resolveInsideDirectory(rootDirectory: string, relativePath: string) {
  const resolvedPath = path.resolve(rootDirectory, relativePath);
  const relativeToRoot = path.relative(rootDirectory, resolvedPath);
  if (
    relativeToRoot.startsWith(`..${path.sep}`) ||
    relativeToRoot === ".." ||
    path.isAbsolute(relativeToRoot)
  ) {
    throw new Error("La validación de ruta rechazó un archivo fuera de la exportación.");
  }
  return resolvedPath;
}

function isForbiddenPath(relativePath: string) {
  const parts = relativePath.split(path.sep);
  const basename = parts.at(-1) ?? "";

  if (parts.includes("node_modules") || parts.includes("dist") || parts.includes(".git")) {
    return true;
  }

  if (
    basename === ".env" ||
    (/^\.env\./i.test(basename) && basename !== ".env.example") ||
    basename.endsWith(".log") ||
    basename.endsWith(".tmp") ||
    basename.endsWith(".temp") ||
    basename === ".DS_Store"
  ) {
    return true;
  }

  return false;
}

async function listArchiveEntries(archivePath: string) {
  const { stdout } = await runProcess("unzip", ["-Z1", archivePath]);
  return stdout.split(/\r?\n/).filter(Boolean);
}

function isForbiddenArchiveEntry(entry: string) {
  const normalizedEntry = entry.replaceAll("\\", "/");
  if (normalizedEntry.startsWith("/") || normalizedEntry.split("/").includes("..")) {
    return true;
  }
  return isForbiddenPath(normalizedEntry.replaceAll("/", path.sep));
}

function runProcess(
  command: string,
  args: string[],
  cwd?: string,
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }
      reject(
        new Error(
          `${command} no pudo completar la operación${stderr ? `: ${stderr.trim()}` : "."}`,
        ),
      );
    });
  });
}