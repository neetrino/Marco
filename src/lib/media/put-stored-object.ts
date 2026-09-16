import "server-only";

import { getProviders } from "@/config/providers";
import { logger } from "@/lib/observability/logger";
import type { PutObjectInput } from "@/lib/r2/types";

const IMAGE_UPLOAD_FAILED = "Image upload failed. Please try again.";
const STORAGE_NOT_CONFIGURED = "Image storage is not configured.";

/**
 * Writes bytes to object storage and returns a user-safe error, if any.
 * Production never falls through to the local filesystem stub.
 */
export async function putStoredObject(
  input: PutObjectInput,
): Promise<string | null> {
  const storage = getProviders().storage;
  if (storage.name === "stub-r2" && process.env.NODE_ENV === "production") {
    logger.error("media.storage_not_configured", { objectKey: input.objectKey });
    return STORAGE_NOT_CONFIGURED;
  }

  try {
    await storage.putObject(input);
    return null;
  } catch (error) {
    logger.error("media.put_object_failed", {
      objectKey: input.objectKey,
      message: error instanceof Error ? error.message : "unknown",
    });
    return IMAGE_UPLOAD_FAILED;
  }
}
