import { useEffect, useRef } from "react";
import type { ButtonProps, DetailPanelProps, EmptyStateProps, NoticeProps } from "../contracts";

export { EmptyStateV2, ErrorState, EvidencePresentation, LoadingState, MetricSignal } from "./v2";
export type { EvidencePresentationProps, MetricSignalProps } from "./v2";

export function Button({ variant = "primary", busy = false, children, disabled, className, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      aria-busy={busy || undefined}
      className={["ui-button", `ui-button--${variant}`, className].filter(Boolean).join(" ")}
      disabled={disabled || busy}
    >
      {busy ? "Working…" : children}
    </button>
  );
}

export function Notice({ tone = "neutral", title, children }: NoticeProps) {
  return (
    <section className={`ui-notice ui-notice--${tone}`}>
      {title ? <strong>{title}</strong> : null}
      <div>{children}</div>
    </section>
  );
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <section className="ui-empty-state">
      <h2>{title}</h2>
      <p>{description}</p>
      {action}
    </section>
  );
}

export function DetailPanel({
  open,
  title,
  closeLabel = "Close details",
  onClose,
  returnFocusRef,
  children,
  testId,
}: DetailPanelProps) {
  const panelRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (!open) {
      if (wasOpenRef.current) returnFocusRef?.current?.focus();
      wasOpenRef.current = false;
      return;
    }

    wasOpenRef.current = true;
    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === "Tab") {
        const focusable = Array.from(
          panelRef.current?.querySelectorAll<HTMLElement>(
            'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
          ) ?? [],
        );
        const first = focusable[0];
        const last = focusable.at(-1);
        if (!first || !last) {
          event.preventDefault();
          panelRef.current?.focus();
        } else if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose, open, returnFocusRef]);

  if (!open) return null;
  return (
    <aside
      aria-label={title}
      aria-modal="true"
      className="ui-detail-panel"
      data-testid={testId}
      ref={panelRef}
      role="dialog"
      tabIndex={-1}
    >
      <header>
        <h2>{title}</h2>
        <button ref={closeButtonRef} type="button" onClick={onClose} aria-label={closeLabel}>
          Close
        </button>
      </header>
      {children}
    </aside>
  );
}
