import { DashboardHostPreview } from "@/components/dashboard/DashboardHostPreview";

export default function DashboardPage() {
  return (
    <main className="plugin-layout">
      <div className="plugin-meta">
        <p className="plugin-meta__eyebrow">Pensieve</p>
        <h1 className="plugin-meta__title">Memory Dashboard</h1>
        <p className="plugin-meta__copy">
          A lightweight local plugin panel for inspecting structured LLM memory and gently adjusting what stays
          prominent.
        </p>
      </div>

      <div className="plugin-preview-stage">
        <div className="plugin-preview-stage__canvas">
          <div className="plugin-preview-stage__ghost" aria-hidden="true" />
          <div className="plugin-preview-stage__host">
            <DashboardHostPreview />
          </div>
        </div>
      </div>
    </main>
  );
}
