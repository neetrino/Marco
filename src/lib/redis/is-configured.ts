type UpstashCredentials = {
  url: string;
  token: string;
};

/** True when Upstash REST URL and token are both present. */
export function isUpstashRedisConfigured(
  input: Partial<UpstashCredentials>,
): input is UpstashCredentials {
  return Boolean(input.url && input.token);
}
