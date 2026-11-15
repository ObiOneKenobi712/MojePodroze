export function formatAmount(amount: number): string {
  return amount.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatMoney(amount: number): string {
  return `${formatAmount(amount)} zł`;
}
