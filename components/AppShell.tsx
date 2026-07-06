"use client";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="plugin-stage">
      <div className="plugin-stage__veil" aria-hidden="true" />
      <div className="relative z-10 mx-auto min-h-screen max-w-6xl px-4 py-5 md:px-6 md:py-6">
        <div className="relative z-10">{children}</div>
      </div>
    </div>
  );
}
