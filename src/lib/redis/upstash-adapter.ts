import { logger } from "@/lib/observability/logger";
import type { RedisAdapter, RedisClient } from "@/lib/redis/types";

export type UpstashRedisConfig = {
  url: string;
  token: string;
};

function readErrorMessage(payload: unknown, status: number): string {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    typeof payload.error === "string"
  ) {
    return payload.error;
  }

  return `http_${status}`;
}

function unwrapResult(payload: unknown, status: number): unknown {
  if (!status || status >= 400) {
    logger.error("redis.upstash_command_failed", {
      status,
      message: readErrorMessage(payload, status),
    });
    throw new Error("Redis command failed");
  }

  if (typeof payload !== "object" || payload === null) {
    logger.error("redis.upstash_command_failed", {
      status,
      message: "invalid_payload",
    });
    throw new Error("Redis command failed");
  }

  if ("error" in payload && typeof payload.error === "string") {
    logger.error("redis.upstash_command_failed", {
      status,
      message: payload.error,
    });
    throw new Error("Redis command failed");
  }

  return "result" in payload ? payload.result : null;
}

async function executeCommand(
  config: UpstashRedisConfig,
  command: Array<string | number>,
): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(config.url.replace(/\/$/, ""), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(command),
      cache: "no-store",
    });
  } catch (error) {
    logger.error("redis.upstash_command_failed", {
      message: error instanceof Error ? error.message : "network_error",
    });
    throw new Error("Redis command failed");
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    logger.error("redis.upstash_command_failed", {
      status: response.status,
      message: "invalid_json",
    });
    throw new Error("Redis command failed");
  }

  return unwrapResult(payload, response.status);
}

function asStringOrNull(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  throw new Error("Redis command failed");
}

function asOkOrNull(value: unknown): "OK" | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (value === "OK") {
    return "OK";
  }

  throw new Error("Redis command failed");
}

function asDeletedCount(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  throw new Error("Redis command failed");
}

function buildSetCommand(
  key: string,
  value: string,
  options?: { ex?: number; nx?: boolean },
): Array<string | number> {
  const command: Array<string | number> = ["SET", key, value];
  if (typeof options?.ex === "number") {
    command.push("EX", options.ex);
  }
  if (options?.nx) {
    command.push("NX");
  }
  return command;
}

/** Upstash Redis REST adapter for cache, rate limits, and ephemeral tokens. */
export function createUpstashRedisAdapter(
  config: UpstashRedisConfig,
): RedisAdapter {
  const client: RedisClient = {
    async get(key) {
      return asStringOrNull(await executeCommand(config, ["GET", key]));
    },
    async set(key, value, options) {
      return asOkOrNull(
        await executeCommand(config, buildSetCommand(key, value, options)),
      );
    },
    async del(key) {
      return asDeletedCount(await executeCommand(config, ["DEL", key]));
    },
    async getdel(key) {
      return asStringOrNull(await executeCommand(config, ["GETDEL", key]));
    },
  };

  return {
    name: "upstash",
    getClient: () => client,
  };
}
