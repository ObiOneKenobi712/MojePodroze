import { formatMoney } from "@_src/utils/money.util";

export function formatBudgetPercent(spent: number, budget: number): string {
  const percent = (spent / budget) * 100;

  return percent.toLocaleString("pl-PL", { maximumFractionDigits: 1 });
}

export function getExpectedSpentText(spent: number, budget: number): string {
  return `Wydano ${formatMoney(spent)} z ${formatMoney(budget)}`;
}

export function getExpectedWithinBudgetStatus(spent: number, budget: number): string {
  return `W budżecie – zostało ${formatMoney(budget - spent)}.`;
}

export function getExpectedBudgetWarningStatus(spent: number, budget: number): string {
  return `Uwaga: wykorzystano ${formatBudgetPercent(spent, budget)}% budżetu – zostało ${formatMoney(budget - spent)}.`;
}

export function getExpectedBudgetExceededStatus(spent: number, budget: number): string {
  return `Budżet przekroczony o ${formatMoney(spent - budget)}.`;
}
