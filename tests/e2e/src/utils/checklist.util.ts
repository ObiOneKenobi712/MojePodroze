export function getExpectedWishlistProgress(visitedCount: number, totalCount: number): string {
  return `Zaliczone: ${visitedCount} z ${totalCount}`;
}

export function getExpectedPackingProgress(packedCount: number, totalCount: number): string {
  return `Spakowane: ${packedCount} z ${totalCount}`;
}
