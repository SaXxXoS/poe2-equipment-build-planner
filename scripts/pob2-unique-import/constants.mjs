export const repository = 'PathOfBuildingCommunity/PathOfBuilding-PoE2'
export const commit = 'c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0'
export const scopeId = 'poe2-pob2-unique-planner-data'
export const contractVersion = '2'
export const parserFormatVersion = '1'
export const productPath = 'generated/pob2/uniques.json'
export const allowedFields = [
  'sourceId', 'name', 'baseDisplayName', 'slot', 'itemCategory', 'requiredLevel',
  'variants', 'visibleModifiers', 'rollRanges', 'implicits', 'legacyStatus',
  'provenance', 'resolutionStatus',
]
export const fileMetadata = {
  'src/Data/Uniques/amulet.lua': ['amulet', 'amulet'],
  'src/Data/Uniques/belt.lua': ['belt', 'belt'],
  'src/Data/Uniques/body.lua': ['body-armour', 'body-armour'],
  'src/Data/Uniques/boots.lua': ['boots', 'boots'],
  'src/Data/Uniques/bow.lua': ['weapon', 'bow'],
  'src/Data/Uniques/crossbow.lua': ['weapon', 'crossbow'],
  'src/Data/Uniques/flask.lua': ['special', 'flask'],
  'src/Data/Uniques/focus.lua': ['offhand', 'focus'],
  'src/Data/Uniques/gloves.lua': ['gloves', 'gloves'],
  'src/Data/Uniques/helmet.lua': ['helmet', 'helmet'],
  'src/Data/Uniques/jewel.lua': ['jewel', 'jewel'],
  'src/Data/Uniques/mace.lua': ['weapon', 'mace'],
  'src/Data/Uniques/quiver.lua': ['offhand', 'quiver'],
  'src/Data/Uniques/ring.lua': ['ring', 'ring'],
  'src/Data/Uniques/sceptre.lua': ['weapon', 'sceptre'],
  'src/Data/Uniques/shield.lua': ['offhand', 'shield'],
  'src/Data/Uniques/spear.lua': ['weapon', 'spear'],
  'src/Data/Uniques/staff.lua': ['weapon', 'staff'],
  'src/Data/Uniques/talisman.lua': ['special', 'talisman'],
  'src/Data/Uniques/wand.lua': ['weapon', 'wand'],
}
export const knownDirectives = new Set([
  'Allow Duplicate Variants', 'Grants Skill', 'Has Alt Variant',
  'Has Alt Variant Two', 'Has Alt Variant Three', 'Implicits', 'League',
  'Left ring slot', 'Limited to', 'Radius', 'Requires Level',
  'Right ring slot', 'Selected Alt Variant', 'Selected Alt Variant Two',
  'Selected Alt Variant Three', 'Selected Variant', 'Sockets', 'Source', 'Variant',
])
export const omittedDirectiveKinds = new Set([
  'Allow Duplicate Variants', 'Grants Skill', 'Has Alt Variant',
  'Has Alt Variant Two', 'Has Alt Variant Three', 'League', 'Left ring slot',
  'Limited to', 'Radius', 'Right ring slot', 'Selected Alt Variant',
  'Selected Alt Variant Two', 'Selected Alt Variant Three', 'Selected Variant',
  'Sockets', 'Source',
])
