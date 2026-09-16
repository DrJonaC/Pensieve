import { redactSensitiveText } from "./privacy.ts";

// Server callers only: secret values must never be passed to client components.
export function configuredSecrets(): string[] {
  if (typeof window !== "undefined") throw new Error("Credential filtering configuration is server-only.");
  return Object.entries(process.env)
    .filter(([name, value]) => /(?:KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL)/i.test(name) && Boolean(value) && !name.startsWith("NEXT_PUBLIC_"))
    .map(([, value]) => value!);
}

export function safeErrorMessage(error: unknown, fallback: string): string {
  return redactSensitiveText(error instanceof Error ? error.message : fallback, configuredSecrets());
}
