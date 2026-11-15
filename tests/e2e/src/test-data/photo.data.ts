import { PhotoFileModel } from "@_src/models/photo-file.model";

const ONE_PIXEL_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

export const testPngPhoto: PhotoFileModel = {
  name: "zdjecie-testowe.png",
  mimeType: "image/png",
  buffer: Buffer.from(ONE_PIXEL_PNG_BASE64, "base64"),
};
