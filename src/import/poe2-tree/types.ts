export type LocalizationStatus = 'source' | 'verified' | 'pending' | 'unavailable'
export interface LocalizedSourceText { sourceText: string | null; sourceLocale: 'en'; localizedText: string | null; localizedLocale: string | null; localizationSource: string | null; localizationStatus: LocalizationStatus }
export interface ImportedTreeNode { id: string; sourceInternalId: string | null; name: LocalizedSourceText; stats: LocalizedSourceText[]; nodeType: string; position: { x: number; y: number }; groupId: string; neighbourNodeIds: string[]; isClassStart: boolean; classStartIndex: number | null; isAscendancyStart: boolean; ascendancyId: string | null; isJewelSocket: boolean; isClusterSocket: false; sourceReference: string }
export interface ImportedTreeConnection { id: string; fromNodeId: string; toNodeId: string; connectionType: 'passive-tree'; directed: false; hideInDefaultState?: true; sourceReference: string }
export interface ImportedTreeGroup { groupId: string; position: { x: number; y: number }; nodeIds: string[]; orbits: number[]; sourceReference: string }

// Adaptergrenze für eine spätere, ausdrücklich beauftragte Integration. Engine und UI importieren diese Typen derzeit nicht.
