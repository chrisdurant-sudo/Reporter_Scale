import type { ButtonProps, DetailPanelProps, EmptyStateProps, NoticeProps } from "../contracts";

export function Button({ variant = "primary", busy = false, children, disabled, ...props }: ButtonProps) {
  return (
    <button {...props} className={`ui-button ui-button--${variant}`} disabled={disabled || busy}>
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

export function DetailPanel({ open, title, closeLabel = "Close details", onClose, children, testId }: DetailPanelProps) {
  if (!open) return null;
  return (
    <aside aria-label={title} className="ui-detail-panel" data-testid={testId}>
      <header>
        <h2>{title}</h2>
        <button type="button" onClick={onClose} aria-label={closeLabel}>
          Close
        </button>
      </header>
      {children}
    </aside>
  );
}
