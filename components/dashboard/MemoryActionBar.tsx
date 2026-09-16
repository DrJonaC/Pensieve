"use client";

import { useLocale } from "@/lib/locale";

type MemoryActionBarProps = {
  canRestore: boolean;
  isPinned: boolean;
  isSoftened: boolean;
  isPending: boolean;
  onPin: () => void;
  onSoften: () => void;
  onHide: () => void;
  onRestore: () => void;
};

export function MemoryActionBar({
  canRestore,
  isPinned,
  isSoftened,
  isPending,
  onPin,
  onSoften,
  onHide,
  onRestore
}: MemoryActionBarProps) {
  const { ui } = useLocale();
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={onPin}
        disabled={isPending || canRestore}
        className="dashboard-action-button"
      >
        {isPinned ? ui("Unpin") : ui("Pin")}
      </button>
      <button
        type="button"
        onClick={onSoften}
        disabled={isPending || canRestore}
        className="dashboard-action-button"
      >
        {isSoftened ? ui("Unsoften") : ui("Soften")}
      </button>
      {canRestore ? (
        <button
          type="button"
          onClick={onRestore}
          disabled={isPending}
          className="dashboard-action-button dashboard-action-button--accent"
        >
          {ui("Restore")}
        </button>
      ) : (
        <button
          type="button"
          onClick={onHide}
          disabled={isPending}
          className="dashboard-action-button"
        >
          {ui("Hide")}
        </button>
      )}
    </div>
  );
}
