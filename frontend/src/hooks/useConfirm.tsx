import { useCallback, useState } from "react";
import ConfirmDialog from "../components/ConfirmDialog/ConfirmDialog";
import type { ConfirmOptions } from "../components/ConfirmDialog/ConfirmDialog";

interface Request extends ConfirmOptions {
  resolve: (confirmed: boolean) => void;
}

/**
 * Własne okno potwierdzenia używane jak window.confirm:
 *   const { confirm, confirmDialog } = useConfirm();
 *   if (!(await confirm({ title, message, confirmLabel }))) return;
 * `confirmDialog` trzeba wstawić w JSX komponentu.
 */
export function useConfirm() {
  const [request, setRequest] = useState<Request | null>(null);

  const confirm = useCallback(
    (options: ConfirmOptions) => new Promise<boolean>((resolve) => setRequest({ ...options, resolve })),
    [],
  );

  const confirmDialog = request && (
    <ConfirmDialog
      title={request.title}
      message={request.message}
      confirmLabel={request.confirmLabel}
      cancelLabel={request.cancelLabel}
      onClose={(confirmed) => {
        request.resolve(confirmed);
        setRequest(null);
      }}
    />
  );

  return { confirm, confirmDialog };
}
