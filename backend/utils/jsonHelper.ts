import fs from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "backend", "data");

export async function readJSON<T>(fileName: string): Promise<T> {
  const filePath = path.join(DATA_DIR, fileName);
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content) as T;
  } catch (error) {
    console.error(`Error reading file ${fileName}:`, error);
    throw new Error(`Unable to read data from ${fileName}`);
  }
}

export async function writeJSON<T>(fileName: string, data: T): Promise<void> {
  const filePath = path.join(DATA_DIR, fileName);
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error(`Error writing file ${fileName}:`, error);
    throw new Error(`Unable to write data to ${fileName}`);
  }
}
