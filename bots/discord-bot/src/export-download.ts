import { readdir, stat } from "node:fs/promises";
import path from "node:path";

export const EXPORT_UPLOAD_DIRECTORY = path.resolve(
  "/home/runner/workspace/puzzles-bot-wispbyte-upload",
);
export const MAX_DISCORD_ATTACHMENT_BYTES = 10 * 1024 * 1024;
export const MAX_DISCORD_ATTACHMENTS = 10;

export type PreparedExportFile = {
  path: string;
  name: string;
  size: number;
};

export async function getExportFiles(): Promise<PreparedExportFile[]> {
  const uploadDirectoryStat = await stat(EXPORT_UPLOAD_DIRECTORY).catch(
    () => null,
  );
  if (!uploadDirectoryStat?.isDirectory()) {
    throw new Error(
      "No se encontró la carpeta puzzles-bot-wispbyte-upload en la raíz del proyecto.",
    );
  }

  const files = await collectSafeFiles(EXPORT_UPLOAD_DIRECTORY);
  if (files.length === 0) {
    throw new Error(
      "La carpeta puzzles-bot-wispbyte-upload no contiene archivos válidos.",
    );
  }

  return files;
}

async function collectSafeFiles(
  uploadDirectory: string,
  currentDirectory = uploadDirectory,
): Promise<PreparedExportFile[]> {
  const entries = await readdir(currentDirectory, { withFileTypes: true });
  const files: PreparedExportFile[] = [];

  for (const entry of entries) {
    const absolutePath = path.join(currentDirectory, entry.name);
    const relativePath = path.relative(uploadDirectory, absolutePath);
    const safePath = resolveInsideDirectory(uploadDirectory, relativePath);

    if (isForbiddenPath(relativePath) || entry.isSymbolicLink()) {
      continue;
    }

    if (entry.isDirectory()) {
      files.push(...(await collectSafeFiles(uploadDirectory, safePath)));
    } else if (entry.isFile()) {
      const fileStat = await stat(safePath);
      files.push({
        path: safePath,
        name: relativePath.split(path.sep).join("/"),
        size: fileStat.size,
      });
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
    throw new Error("La validación de ruta rechazó un archivo fuera del upload.");
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
    basename === "puzzles-bot-wispbyte.zip" ||
    /credential|secret|token|private[-_]?key/i.test(basename) ||
    /\.(pem|key)$/i.test(basename) ||
    /\.(log|tmp|temp)$/i.test(basename) ||
    basename === ".DS_Store"
  ) {
    return true;
  }

  return false;
}