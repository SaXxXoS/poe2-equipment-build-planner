export const availablePassivePoints = (level: number, storyPoints = 0) =>
  Math.max(0, Math.min(100, Math.trunc(level)) - 1) + Math.max(0, Math.trunc(storyPoints))
