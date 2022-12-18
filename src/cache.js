import { FileSystemCache } from "file-system-cache";

export const cache = new FileSystemCache({
  basePath: "./cache",
  ns: "sigaa",
});
