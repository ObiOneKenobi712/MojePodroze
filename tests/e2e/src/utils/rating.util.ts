export function getRatingCountLabel(count: number): string {
  if (count === 1) {
    return "ocena";
  }

  if (count >= 2 && count <= 4) {
    return "oceny";
  }

  return "ocen";
}

export function formatAverageRating(ratings: number[]): string {
  let sum = 0;

  for (const rating of ratings) {
    sum += rating;
  }

  const average = (sum / ratings.length).toLocaleString("pl-PL", { maximumFractionDigits: 1 });

  return `★ ${average} / 5 (${ratings.length} ${getRatingCountLabel(ratings.length)})`;
}
