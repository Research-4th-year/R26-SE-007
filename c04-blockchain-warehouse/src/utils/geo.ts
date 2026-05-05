/**
 * Haversine formula — calculates the great-circle distance
 * between two coordinates on Earth in kilometres.
 */
export function haversineKm(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R    = 6371;                         // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Composite warehouse ranking score used during disaster response.
 *
 * Formula:
 *   score = 0.40 × distanceScore
 *         + 0.35 × capacityScore
 *         + 0.25 × reliabilityScore
 *
 * distanceScore  = 1 / (1 + distanceKm)   → closer = higher score
 * capacityScore  = availableTons / totalCapacityTons
 * reliabilityScore = GNN score (0–1), defaults to 0.5 until GNN is live
 */
export function computeRankingScore(
  distanceKm:       number,
  availableTons:    number,
  capacityTons:     number,
  reliabilityScore: number = 0.5
): number {
  const distanceScore  = 1 / (1 + distanceKm);
  const capacityScore  = capacityTons > 0 ? availableTons / capacityTons : 0;

  return (
    0.40 * distanceScore  +
    0.35 * capacityScore  +
    0.25 * reliabilityScore
  );
}

