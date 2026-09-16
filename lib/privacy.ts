const marker = (kind: string) => `[REDACTED:${kind}]`;

/** Best-effort credential filtering, not a general personal-data classifier. */
export function redactSensitiveText(text: string, knownSecrets: readonly string[] = []): string {
  let result = text;
  for (const secret of [...new Set(knownSecrets)].filter(value => value.length >= 8).sort((a, b) => b.length - a.length)) {
    result = result.split(secret).join(marker("SECRET"));
  }
  result = result.replace(/-----BEGIN ([A-Z0-9 ]*PRIVATE KEY)-----[\s\S]*?(?:-----END \1-----|$)/g, marker("PRIVATE_KEY"));
  result = result.replace(/\b(?:sk-(?:proj-|ant-api\d+-)?[a-zA-Z0-9_-]{12,}|gh[pousr]_[a-zA-Z0-9]{20,}|github_pat_[a-zA-Z0-9_]{20,}|xox[baprs]-[a-zA-Z0-9-]{12,}|AKIA[A-Z0-9]{16})\b/g, marker("API_KEY"));
  result = result.replace(/\beyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\b/g, marker("TOKEN"));
  result = result.replace(/\b(Bearer|Basic)\s+(?!\[REDACTED:)[a-zA-Z0-9+/_=.-]+/gi, (_, scheme: string) => `${scheme} ${marker("AUTH")}`);
  result = result.replace(/(\b[a-z][a-z0-9+.-]*:\/\/)[^\s/@]+:[^\s/@]+@/gi, `$1${marker("CREDENTIAL")}@`);
  // Quoted JSON/env values may contain spaces; unquoted values end at a delimiter.
  result = result.replace(/(["']?(?:\b[\w.-]*(?:api[ _-]?key|access[ _-]?key|token|secret|password|passwd|pwd|credential)|密钥|密码|令牌)["']?\s*(?:[:=：]|\bis\b|是|为)\s*)(?!\[REDACTED:)(?:"((?:\\.|[^"\\])*)"|'((?:\\.|[^'\\])*)'|([^\s,;&<>"'`]+))/gi,
    (match, prefix: string, double: string | undefined, single: string | undefined, plain: string | undefined) => {
      const value = double ?? single ?? plain ?? "";
      if (!value || /^\[REDACTED:[A-Z_]+\]$/.test(value)) return match;
      const quote = double !== undefined ? '"' : single !== undefined ? "'" : "";
      return `${prefix}${quote}${marker("SECRET")}${quote}`;
    });
  return result;
}

type GeneratedText = {
  answer: string;
  summary: string;
  memory_explanations: { memory_id: string; why: string }[];
  cdv_results?: Record<string, { reason: string }>;
};

export function redactGeneratedResponse<T extends GeneratedText>(value: T, secrets: readonly string[] = []): T {
  return {
    ...value,
    answer: redactSensitiveText(value.answer, secrets),
    summary: redactSensitiveText(value.summary, secrets),
    memory_explanations: value.memory_explanations.map(item => ({ ...item, why: redactSensitiveText(item.why, secrets) })),
    ...(value.cdv_results ? { cdv_results: Object.fromEntries(Object.entries(value.cdv_results).map(([id, item]) => [id, { ...item, reason: redactSensitiveText(item.reason, secrets) }])) } : {})
  };
}
