import { useLayoutEffect, useRef } from "react";
import type { RefObject } from "react";

/**
 * Kreska pod aktywną zakładką, która przesuwa się płynnie między zakładkami.
 * Zwraca ref do elementu kreski (umieszczonego w kontenerze z `position: relative`).
 * Pozycję liczymy z wymiarów zakładek i aktualizujemy, gdy zmienią rozmiar (np. liczniki, czcionka).
 */
export function useTabIndicator(tabRefs: RefObject<(HTMLButtonElement | null)[]>, activeIndex: number) {
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const placed = useRef(false);

  useLayoutEffect(() => {
    const indicator = indicatorRef.current;
    if (!indicator) return;

    function place() {
      const tab = tabRefs.current[activeIndex];
      if (!indicator || !tab) return;
      indicator.style.left = `${tab.offsetLeft}px`;
      indicator.style.width = `${tab.offsetWidth}px`;
    }

    // Pierwsze ustawienie bez animacji – kreska nie „wjeżdża” z lewej przy wejściu na stronę
    if (!placed.current) {
      indicator.style.transition = "none";
      place();
      void indicator.offsetWidth; // wymusza zastosowanie pozycji przed przywróceniem animacji
      indicator.style.transition = "";
      placed.current = true;
    } else {
      place();
    }

    const observer = new ResizeObserver(place);
    for (const tab of tabRefs.current) if (tab) observer.observe(tab);
    return () => observer.disconnect();
  }, [tabRefs, activeIndex]);

  return indicatorRef;
}
