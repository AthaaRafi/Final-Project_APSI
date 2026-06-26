import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const STORAGE_DIR = path.resolve(process.cwd(), process.env.STORAGE_DIR ?? "./storage");

export type StorageFolder = "foto" | "logo";

function resolveStoragePath(relativePath: string): string {
  const normalized = path.normalize(relativePath).replace(/^[/\\]+/, "");
  const resolved = path.resolve(STORAGE_DIR, normalized);

  if (!resolved.startsWith(STORAGE_DIR + path.sep) && resolved !== STORAGE_DIR) {
    throw new Error("Path file di luar direktori storage");
  }

  return resolved;
}

export async function saveFile(
  buffer: Buffer,
  folder: StorageFolder,
  extension: string,
): Promise<string> {
  const filename = `${randomUUID()}.${extension.replace(/^\./, "")}`;
  const relativePath = path.join(folder, filename);
  const absolutePath = resolveStoragePath(relativePath);

  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, buffer);

  return relativePath.split(path.sep).join("/");
}

export async function getFile(relativePath: string): Promise<Buffer> {
  return readFile(resolveStoragePath(relativePath));
}

export async function deleteFile(relativePath: string): Promise<void> {
  await unlink(resolveStoragePath(relativePath)).catch((err: NodeJS.ErrnoException) => {
    if (err.code !== "ENOENT") throw err;
  });
}
