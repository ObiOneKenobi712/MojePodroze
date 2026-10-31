import { useEffect, useId, useRef } from "react";
import type { MouseEvent } from "react";
import styles from "./ConfirmDialog.module.css";

export interface ConfirmOptions {
  title: string;
  message: string;
  /** Napis na przycisku potwierdzenia, np. „Usuń posiłek” */
  confirmLabel: string;
  /** Napis na przycisku rezygnacji, domyślnie „Anuluj” */
  cancelLabel?: string;
}

interface Props extends ConfirmOptions {
  /** true = potwierdzono, false = anulowano (przycisk, Esc albo kliknięcie obok okna) */
  onClose: (confirmed: boolean) => void;
}

// Okno potwierdzenia zamiast window.confirm (którego nie da się ostylować).
// Element <dialog> + showModal(): blokuje stronę pod spodem, trzyma fokus w oknie, Esc = anuluj.
export default function ConfirmDialog({ title, message, confirmLabel, cancelLabel = "Anuluj", onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const idPrefix = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    // Po zamknięciu fokus wraca na przycisk, który otworzył okno (jeśli nadal jest na stronie)
    const previous = document.activeElement as HTMLElement | null;
    dialog?.showModal();
    return () => previous?.focus();
  }, []);

  // Kliknięcie w przyciemnione tło (poza oknem) = anuluj
  function onBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === dialogRef.current) onClose(false);
  }

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby={`${idPrefix}-title`}
      aria-describedby={`${idPrefix}-message`}
      onCancel={(e) => {
        e.preventDefault();
        onClose(false);
      }}
      onClick={onBackdropClick}
      data-testid="confirm-dialog"
    >
      <h2 id={`${idPrefix}-title`} className={styles.title}>
        {title}
      </h2>
      <p id={`${idPrefix}-message`} className={styles.message}>
        {message}
      </p>
      <div className={styles.actions}>
        {/* Fokus startuje na rezygnacji – Enter nie usunie niczego przez przypadek */}
        <button
          type="button"
          className={styles.secondary}
          onClick={() => onClose(false)}
          autoFocus
          data-testid="btn-confirm-cancel"
        >
          {cancelLabel}
        </button>
        <button type="button" className={styles.danger} onClick={() => onClose(true)} data-testid="btn-confirm-ok">
          {confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
