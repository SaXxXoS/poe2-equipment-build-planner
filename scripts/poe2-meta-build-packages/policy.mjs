export function selectMetaRefreshProfileIds({
  pendingProfiles,
  previousObservations,
  ascendancyOrder,
  maximumNewFetches,
  profileIdFor,
}) {
  const ascendancyRank = new Map(ascendancyOrder.map((value, index) => [value, index]))
  const fairPending = [...pendingProfiles].sort((left, right) => {
    const leftAttempts = previousObservations.get(profileIdFor(left))?.attemptCount ?? 0
    const rightAttempts = previousObservations.get(profileIdFor(right))?.attemptCount ?? 0
    return leftAttempts - rightAttempts
      || left.rank - right.rank
      || (ascendancyRank.get(left.expectedAscendancy) ?? Number.MAX_SAFE_INTEGER)
        - (ascendancyRank.get(right.expectedAscendancy) ?? Number.MAX_SAFE_INTEGER)
      || left.url.localeCompare(right.url)
  })
  return new Set(fairPending
    .slice(0, maximumNewFetches)
    .map(profileIdFor))
}

export function shouldPromoteMetaProduct(previousProduct, candidateProduct) {
  if (candidateProduct.packageCount <= 0) return false
  if (!previousProduct) return true
  return candidateProduct.profileCount >= (previousProduct.profileCount ?? 0)
    && candidateProduct.packageCount >= (previousProduct.packageCount ?? 0)
}
