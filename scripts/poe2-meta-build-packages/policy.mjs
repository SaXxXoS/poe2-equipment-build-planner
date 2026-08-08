export function selectMetaRefreshProfileIds({
  pendingProfiles,
  previousObservations,
  ascendancyOrder,
  maximumNewFetches,
  profileIdFor,
}) {
  const pendingByAscendancy = ascendancyOrder.map(ascendancy =>
    pendingProfiles
      .filter(value => value.expectedAscendancy === ascendancy)
      .sort((left, right) => {
        const leftAttempts = previousObservations.get(profileIdFor(left))?.attemptCount ?? 0
        const rightAttempts = previousObservations.get(profileIdFor(right))?.attemptCount ?? 0
        return leftAttempts - rightAttempts
          || left.rank - right.rank
          || left.url.localeCompare(right.url)
      }),
  )
  const roundRobinPending = []
  const maximumPendingRanks = Math.max(0, ...pendingByAscendancy.map(values => values.length))
  for (let index = 0; index < maximumPendingRanks; index += 1) {
    for (const values of pendingByAscendancy) {
      if (values[index]) roundRobinPending.push(values[index])
    }
  }
  return new Set(roundRobinPending
    .slice(0, maximumNewFetches)
    .map(profileIdFor))
}

export function shouldPromoteMetaProduct(previousProduct, candidateProduct) {
  if (candidateProduct.packageCount <= 0) return false
  if (!previousProduct) return true
  return candidateProduct.profileCount >= (previousProduct.profileCount ?? 0)
    && candidateProduct.packageCount >= (previousProduct.packageCount ?? 0)
}
