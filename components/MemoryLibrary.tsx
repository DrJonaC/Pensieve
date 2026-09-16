"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/lib/locale";
import { redactSensitiveText } from "@/lib/privacy";
import { exportMemoryJson, parseMemoryImport, mergeMemoryImport, validateRecords, MAX_IMPORT_BYTES } from "@/lib/memory-transfer";
import type { PersistedMemoryRecord } from "@/lib/memory-store";
import { notifyMemoryChange, subscribeMemoryChanges } from "@/lib/memory-events";

const panel = "rounded-2xl border border-cyan-200/15 bg-slate-950/60 p-5 space-y-4";
const button = "rounded-xl border border-cyan-200/25 px-4 py-2 text-sm text-cyan-50 hover:bg-cyan-200/10 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300";
const field = "w-full rounded-xl border border-white/20 bg-slate-900 p-3 text-sm text-slate-100 focus:border-cyan-300 focus:outline-none";
type LibraryData = { records: PersistedMemoryRecord[]; revision: string };

function download(content: string, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = name; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function MemoryLibrary() {
  const { t } = useLocale();
  const [data, setData] = useState<LibraryData | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(false);
  const [text, setText] = useState("");
  const [format, setFormat] = useState<"json" | "text">("text");
  const [preview, setPreview] = useState<PersistedMemoryRecord[] | null>(null);
  const [search, setSearch] = useState("");
  const [includeHidden, setIncludeHidden] = useState(false);
  const [includeSensitive, setIncludeSensitive] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [onlySelected, setOnlySelected] = useState(false);
  const [backup, setBackup] = useState<PersistedMemoryRecord[] | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [keywords, setKeywords] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const current = useRef({ data, busy, editing, text, preview });
  current.current = { data, busy, editing, text, preview };

  async function refresh() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/memories", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setData(result); setPreview(null); setEditing(null); setDeleting(null);
    } catch (e) { setError(e instanceof Error ? e.message : "Request failed / 请求失败"); }
    finally { setBusy(false); }
  }

  useEffect(() => { void refresh(); }, []);

  useEffect(() => {
    let disposed = false;
    const unsubscribe = subscribeMemoryChanges(() => {
      if (current.current.busy) return;
      const revision = current.current.data?.revision;
      void fetch("/api/memories", { cache: "no-store" }).then(async response => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        if (disposed || current.current.busy || current.current.data?.revision !== revision || result.revision === revision) return;
        if (current.current.editing || current.current.text || current.current.preview) {
          setError("Library changed elsewhere. Your draft is kept; refresh before saving / 记忆库已在其他页面修改，草稿仍保留，请刷新后再保存");
        } else { setData(result); setDeleting(null); setSelected([]); setNotice(false); }
      }).catch(reason => { if (!disposed) setError(reason instanceof Error ? reason.message : "Refresh failed / 刷新失败"); });
    });
    return () => { disposed = true; unsubscribe(); };
  }, []);

  async function mutate(operation: Record<string, unknown>) {
    if (!data || busy) return;
    setBusy(true); setError(""); setNotice(false);
    try {
      const response = await fetch("/api/memories", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...operation, revision: data.revision })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setBackup(data.records);
      setData(result); setEditing(null); setDeleting(null); setNotice(true);
      notifyMemoryChange();
      if (operation.operation === "import") { setPreview(null); setText(""); }
    } catch (e) { setError(e instanceof Error ? e.message : "Request failed / 请求失败"); }
    finally { setBusy(false); }
  }

  function makePreview() {
    setError(""); setNotice(false);
    try { setPreview(parseMemoryImport(text, format)); }
    catch (e) { setPreview(null); setError(e instanceof Error ? e.message : "Invalid file / 文件无效"); }
  }

  const records = data?.records ?? [];
  const exportRecords = records.filter(m => (includeHidden || m.status !== "forgotten") &&
    (includeSensitive || (m.risk_level !== "high" && m.origin_tp !== "confidentiality")) &&
    (!onlySelected || selected.includes(m.id)));
  const visible = records.filter(m => `${m.content} ${m.keywords.join(" ")}`.toLowerCase().includes(search.toLowerCase()));
  let imported = 0, skipped = 0, previewError = "";
  if (preview) {
    try { const merged = mergeMemoryImport(records, preview); imported = merged.added; skipped = merged.skipped; }
    catch (reason) { imported = -1; previewError = reason instanceof Error ? reason.message : t("Invalid import", "无效导入"); }
  }

  return (
    <main className="space-y-5 text-slate-200" aria-busy={busy}>
      <header className={panel}>
        <p className="text-xs uppercase tracking-[0.25em] text-cyan-200">Pensieve / {t("Memory Library", "记忆管理")}</p>
        <h1 className="text-3xl font-semibold text-white">{t("Your memories, in your hands.", "让记忆由你掌握。")}</h1>
        <p className="text-xs leading-6 text-slate-400">{t("This library and its exports contain original data. Credential filtering protects generated text, not raw memories or backups. Review before sharing.", "记忆库与导出保留原始数据。凭据遮蔽保护生成文本，不会清洗原始记忆或备份；分享前请检查。")}</p>
        <p className="max-w-3xl text-sm leading-7 text-slate-300">{t("Import, review, edit and export your local memory library. No question or model call is needed.", "无需提问或调用模型，即可导入、查看、编辑和导出本地记忆。")}</p>
        <ol className="grid gap-3 text-sm md:grid-cols-3">
          <li>{t("1. Import a backup or paste memory notes.", "1. 导入备份，或粘贴已有的记忆笔记。")}</li>
          <li>{t("2. Preview, then confirm. Existing records are kept.", "2. 预览后确认导入，现有记忆会保留。")}</li>
          <li>{t("3. Review and export only what you want to share.", "3. 检查内容，只导出你愿意分享的记忆。")}</li>
        </ol>
        <p className="text-xs leading-6 text-slate-400">{t("This local library powers Pensieve's queries and dashboards. Changes do not sync to ChatGPT, Claude or host-app memories. Only an explicit Live query sends selected memories to the configured model. Interface language never translates your content.", "本地记忆库为 Pensieve 查询和仪表盘提供数据，不会同步修改 ChatGPT、Claude 或宿主应用的记忆。仅主动提交 Live 查询时，召回的记忆才会发送给配置的模型。界面语言不会翻译你的内容。")}</p>
      </header>

      <div role="status" aria-live="polite" className="text-sm text-cyan-100">
        {busy ? t("Working…", "处理中…") : notice ? t("Saved locally. A backup of the previous library was created.", "已保存到本地，并备份了修改前的记忆库。") : null}
      </div>
      {error && <div role="alert" className="rounded-xl border border-rose-300/30 bg-rose-950/30 p-4 text-rose-200">{redactSensitiveText(error)} <button className={button + " ml-2"} disabled={busy} onClick={() => void refresh()}>{t("Refresh library", "刷新记忆库")}</button></div>}

      <div className="grid gap-5 lg:grid-cols-2">
        <section className={panel}>
          <h2 className="text-xl font-semibold text-white">{t("Import memories", "载入记忆")}</h2>
          <p className="text-sm text-slate-400">{t("Pensieve JSON v1 or plain text (one memory per line), up to 1 MB. Text is stored as written, without AI extraction. Full chat-history exports are not supported.", "支持 Pensieve JSON v1 或纯文本（每行一条），文件上限 1 MB。文本按原文保存，不进行 AI 提炼；暂不支持完整聊天历史导出文件。")}</p>
          <fieldset disabled={busy || !data} className="space-y-3">
            <label className="block text-sm">{t("Format", "格式")}
              <select aria-label={t("Format", "格式")} className={field} value={format} onChange={e => { setFormat(e.target.value as "json" | "text"); setPreview(null); }}>
                <option value="text">{t("Plain text", "纯文本")}</option><option value="json">Pensieve JSON</option>
              </select>
            </label>
            <label className="block text-sm">{t("Choose a file", "选择文件")}
              <input type="file" accept=".json,.bak,.txt,.md" className="mt-2 block max-w-full text-sm" onChange={async e => {
                const file = e.target.files?.[0]; e.target.value = "";
                if (!file) return;
                setPreview(null); setError("");
                if (file.size > MAX_IMPORT_BYTES) { setError(t("File exceeds 1 MB.", "文件超过 1 MB。")); return; }
                setBusy(true);
                try { setText(await file.text()); setFormat(/\.(json|bak)$/i.test(file.name) ? "json" : "text"); }
                catch { setError(t("Cannot read file.", "无法读取文件。")); }
                finally { setBusy(false); }
              }} />
            </label>
            <label className="block text-sm">{t("Or paste memory notes", "或粘贴记忆内容")}
              <textarea aria-label={t("Or paste memory notes", "或粘贴记忆内容")} rows={5} className={field} maxLength={MAX_IMPORT_BYTES} value={text} onChange={e => { setText(e.target.value); setPreview(null); }} placeholder={t("I prefer concise explanations.\nI work with TypeScript.", "我喜欢简洁的解释。\n我使用 TypeScript 开发。")} />
            </label>
            <button className={button} disabled={!text.trim() || !data} onClick={makePreview}>{t("Preview import", "预览导入")}</button>
          </fieldset>
          {preview && <div className="space-y-3 rounded-xl border border-cyan-300/20 p-4">
            <p>{imported < 0 ? redactSensitiveText(previewError) : `${t("New", "新增")}: ${imported} · ${t("Duplicates skipped", "重复跳过")}: ${skipped}`}</p>
            <p className="text-xs text-slate-400">{t("Matching IDs or identical text are skipped, never overwritten. Review text imports for sensitive data; the default risk label is not an assessment.", "相同 ID 或内容会跳过，不会覆盖。请检查文本中的敏感信息；默认风险标签不代表评估结果。")}</p>
            <ul className="max-h-48 space-y-2 overflow-auto text-sm">{preview.slice(0, 50).map((m, index) => {
              const existing = records.find(record => record.id === m.id);
              const conflict = existing && Object.keys(m).some(key => JSON.stringify(Reflect.get(existing, key)) !== JSON.stringify(Reflect.get(m, key)));
              const duplicate = [...records, ...preview.slice(0, index)].some(record => record.id === m.id || record.content.trim().toLowerCase() === m.content.trim().toLowerCase());
              return <li key={m.id} className="break-words"><span className="text-cyan-200">{conflict ? t("[ID conflict: keep existing content & metadata] ", "[ID 冲突：保留已有内容与元数据] ") : duplicate ? t("[Skip duplicate] ", "[跳过重复] ") : t("[New] ", "[新增] ")}</span>{m.content}{conflict && <p className="text-amber-100">{t("Existing: ", "已有：")}{existing.content} ({existing.status})</p>}</li>;
            })}</ul>
            {preview.length > 50 && <p className="text-xs">{t("Showing first 50 records.", "仅显示前 50 条。")}</p>}
            <button className={button} disabled={busy || imported <= 0} onClick={() => void mutate({ operation: "import", format: "pensieve-memory", version: 1, memories: preview })}>{t("Confirm import", "确认导入")}</button>
          </div>}
        </section>

        <section className={panel}>
          <h2 className="text-xl font-semibold text-white">{t("Export & move", "导出与迁移")}</h2>
          <p className="text-sm leading-7 text-slate-300">{t("JSON preserves metadata and can be imported back into Pensieve. Plain text contains memory content only, for review and manual transfer into an AI app's supported import or paste flow.", "JSON 保留元数据，可以重新导回 Pensieve。纯文本只包含记忆内容，便于检查后，手动载入其他 AI 应用支持的导入或粘贴入口。")}</p>
          <p className="text-sm leading-7 text-amber-100">{t("This is not a native ChatGPT or Claude backup format. Compatibility depends on the destination app. Review sensitive information before sharing.", "这不是 ChatGPT 或 Claude 的原生备份格式，兼容性取决于目标应用。分享前请检查敏感信息。")}</p>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={includeHidden} onChange={e => setIncludeHidden(e.target.checked)} />{t("Include hidden memories (for a full backup)", "包含隐藏记忆（用于完整备份）")}</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={includeSensitive} onChange={e => setIncludeSensitive(e.target.checked)} />{t("Include high-risk / confidential records", "包含标记为高风险或保密的记忆")}</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={onlySelected} onChange={e => setOnlySelected(e.target.checked)} />{t("Only selected records", "仅导出勾选的记忆")} ({selected.length})</label>
          <p className="text-xs text-slate-400">{t("Labels are not automatic sensitive-data detection. Review every export. For a complete backup, include hidden and sensitive records and disable selection filtering.", "风险标签不等于自动敏感信息检测，请逐条检查。完整备份需包含隐藏和敏感记录，并关闭仅导出勾选项。")}</p>
          <p className="text-sm">{exportRecords.length} {t("memories will be exported. Search does not filter exports.", "条记忆将被导出，搜索不会影响导出范围。")}</p>
          <div className="flex flex-wrap gap-3">
            <button className={button} disabled={!data || busy} onClick={() => download(exportMemoryJson(exportRecords), "pensieve-memories.json", "application/json")}>{t("Export JSON", "导出 JSON")}</button>
            <button className={button} disabled={!data || busy} onClick={() => download(exportRecords.map(m => m.content.replace(/\r?\n/g, " ")).join("\n"), "pensieve-memories.txt", "text/plain;charset=utf-8")}>{t("Export text", "导出文本")}</button>
          </div>
          {backup && <button className={button} onClick={() => download(exportMemoryJson(backup), "pensieve-before-last-change.json", "application/json")}>{t("Download pre-change backup (includes hidden & sensitive)", "下载最近修改前的备份（包含隐藏和敏感记忆）")}</button>}
          <details className="text-sm leading-7 text-slate-400"><summary className="cursor-pointer text-cyan-100">{t("How to restore a backup", "如何恢复备份")}</summary>{t("Import an exported JSON file here. Import merges missing records; it does not roll back edits to an existing ID. Automatic .bak files live beside the local repository in data/. They contain the pre-change library and can also be imported as JSON.", "在左侧导入 JSON 备份即可合并缺少的记录。导入不会回滚已有 ID 的编辑。自动 .bak 备份位于 data/ 下的本地记忆库旁，包含修改前的完整内容，也可按 JSON 导入。")}</details>
        </section>
      </div>

      <section className={panel}>
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold text-white">{t("Your local library", "你的本地记忆库")} · {records.length}</h2><button className={button} disabled={busy} onClick={() => void refresh()}>{t("Refresh", "刷新")}</button></div>
        <label className="block text-sm">{t("Search content or keywords", "搜索内容或关键词")}<input className={field} value={search} onChange={e => setSearch(e.target.value)} /></label>
        {!busy && !visible.length && <p className="py-8 text-center text-slate-400">{t("No memories found. Import notes above or change your search.", "没有找到记忆，请导入内容或修改搜索条件。")}</p>}
        <div className="space-y-3">{visible.map(m => <article key={m.id} className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={selected.includes(m.id)} onChange={e => setSelected(current => e.target.checked ? [...current, m.id] : current.filter(id => id !== m.id))} />{t("Select for export", "选择用于导出")}</label>
          <div className="flex flex-wrap gap-2 text-xs text-cyan-100"><span>{m.status === "forgotten" ? t("Hidden", "已隐藏") : m.status === "softened" ? t("Softened", "已弱化") : t("Active", "启用")}</span><span>· {m.risk_level === "high" ? t("High risk", "高风险") : m.risk_level === "medium" ? t("Medium risk", "中风险") : t("Low risk", "低风险")}</span>{m.pinned && <span>· {t("Pinned", "已置顶")}</span>}</div>
          {editing === m.id ? <form className="space-y-3" onSubmit={e => {
            e.preventDefault();
            try {
              const [updated] = validateRecords([{ ...m, content: content.trim(), keywords: keywords.split(/[,，]/).map(k => k.trim()).filter(Boolean) }]);
              void mutate({ operation: "edit", id: m.id, content: updated.content, keywords: updated.keywords });
            } catch (reason) { setError(reason instanceof Error ? reason.message : t("Invalid memory", "记忆格式无效")); }
          }}>
            <label className="block text-sm">{t("Memory content", "记忆内容")}<textarea aria-label={t("Memory content", "记忆内容")} autoFocus required maxLength={10000} rows={3} className={field} disabled={busy} value={content} onChange={e => setContent(e.target.value)} /></label>
            <label className="block text-sm">{t("Keywords (comma-separated)", "关键词（逗号分隔）")}<input className={field} disabled={busy} value={keywords} onChange={e => setKeywords(e.target.value)} /></label>
            <button className={button} disabled={busy || !content.trim()}>{t("Save changes", "保存修改")}</button> <button type="button" className={button} disabled={busy} onClick={() => setEditing(null)}>{t("Cancel", "取消")}</button>
          </form> : <>
            <p className="whitespace-pre-wrap break-words leading-7 text-white">{m.content}</p>
            <p className="break-words text-xs text-slate-400">{m.keywords.join(" · ")}</p>
            <button className={button} disabled={busy} onClick={() => void mutate({ operation: "govern", changes: [{ id: m.id, pinned: m.pinned, status: m.status === "forgotten" ? "active" : "forgotten" }] })}>{m.status === "forgotten" ? t("Restore to retrieval", "恢复参与检索") : t("Hide from retrieval", "隐藏并停止检索")}</button>{" "}
            <button className={button} disabled={busy} onClick={() => { setEditing(m.id); setContent(m.content); setKeywords(m.keywords.join(", ")); setDeleting(null); }}>{t("Edit", "编辑")}</button> <button className={button} disabled={busy} onClick={() => { setDeleting(m.id); setEditing(null); }}>{t("Delete…", "删除…")}</button>
          </>}
          {deleting === m.id && <div className="space-y-2 rounded-xl border border-rose-300/30 p-3" role="group" aria-label={t("Confirm deletion", "确认删除")}><p className="text-sm text-rose-200">{t("Remove this memory from the local library? This is different from hiding. A local backup is created first; other apps are not affected.", "确定从本地记忆库删除这条记录？删除不同于隐藏。系统会先创建本地备份，不影响其他应用。")}</p><button className={button} disabled={busy} onClick={() => void mutate({ operation: "delete", id: m.id })}>{t("Confirm delete", "确认删除")}</button> <button className={button} disabled={busy} onClick={() => setDeleting(null)}>{t("Cancel", "取消")}</button></div>}
        </article>)}</div>
      </section>
    </main>
  );
}
