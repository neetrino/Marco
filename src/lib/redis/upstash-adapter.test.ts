import { afterEach, describe, expect, it, vi } from "vitest";

import { isUpstashRedisConfigured } from "@/lib/redis/is-configured";
import { createUpstashRedisAdapter } from "@/lib/redis/upstash-adapter";

const config = {
  url: "https://redis.example.test/",
  token: "test-token",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("isUpstashRedisConfigured", () => {
  it("requires both REST URL and token", () => {
    expect(isUpstashRedisConfigured(config)).toBe(true);
    expect(isUpstashRedisConfigured({ url: config.url })).toBe(false);
    expect(isUpstashRedisConfigured({ token: config.token })).toBe(false);
  });
});

describe("upstash redis adapter", () => {
  it("sets, gets, and deletes through the REST command API", async () => {
    const fetchMock = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const command = JSON.parse(String(init?.body)) as unknown[];
      if (command[0] === "SET") return jsonResponse({ result: "OK" });
      if (command[0] === "GET") return jsonResponse({ result: "1" });
      if (command[0] === "DEL") return jsonResponse({ result: 1 });
      return jsonResponse({ error: "unexpected" }, 500);
    });
    vi.stubGlobal("fetch", fetchMock);

    const redis = createUpstashRedisAdapter(config).getClient();

    await expect(redis.set("k", "1", { ex: 30, nx: true })).resolves.toBe("OK");
    await expect(redis.get("k")).resolves.toBe("1");
    await expect(redis.del("k")).resolves.toBe(1);

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual([
      "SET",
      "k",
      "1",
      "EX",
      30,
      "NX",
    ]);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("https://redis.example.test");
  });

  it("returns null for SET NX when the key already exists", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ result: null })),
    );

    const redis = createUpstashRedisAdapter(config).getClient();
    await expect(redis.set("k", "2", { nx: true })).resolves.toBeNull();
  });

  it("getdel returns the value once", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ result: "user-1" })),
    );

    const redis = createUpstashRedisAdapter(config).getClient();
    await expect(redis.getdel("token")).resolves.toBe("user-1");
  });

  it("throws a generic error when Upstash rejects the command", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ error: "Unauthorized" }, 401)),
    );

    const redis = createUpstashRedisAdapter(config).getClient();
    await expect(redis.get("k")).rejects.toThrow("Redis command failed");
  });
});
