"use client";

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
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={onPin}
        disabled={isPending || canRestore}
        className="dashboard-action-button"
      >
        {isPinned ? "Unpin" : "Pin"}
      </button>
      <button
        type="button"
        onClick={onSoften}
        disabled={isPending || canRestore}
        className="dashboard-action-button"
      >
        {isSoftened ? "Unsoften" : "Soften"}
      </button>
      {canRestore ? (
        <button
          type="button"
          onClick={onRestore}
          disabled={isPending}
          className="dashboard-action-button dashboard-action-button--accent"
        >
          Restore
        </button>
      ) : (
        <button
          type="button"
          onClick={onHide}
          disabled={isPending}
          className="dashboard-action-button"
        >
          Hide
        </button>
      )}
    </div>
  );
}
