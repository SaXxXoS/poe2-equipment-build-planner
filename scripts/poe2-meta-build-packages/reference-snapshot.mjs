export function pinnedReferenceSnapshot(reference, leagueUrl) {
  const snapshot = {
    name: reference?.source?.league,
    url: reference?.source?.leagueUrl,
    version: reference?.source?.version,
    snapshotName: reference?.source?.snapshotName,
    passiveTree: reference?.source?.passiveTree,
  }
  if (snapshot.url !== leagueUrl || !snapshot.version || !snapshot.snapshotName) {
    throw new Error(`Kein gepinnter Referenz-Snapshot für ${leagueUrl}`)
  }
  return snapshot
}
