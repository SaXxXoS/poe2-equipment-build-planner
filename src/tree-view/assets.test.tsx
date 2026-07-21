import { describe,expect,it } from 'vitest'
import manifest from '../../generated/poe2-tree/asset-manifest.json'
import report from '../../generated/poe2-tree/asset-import-report.json'
import registry from '../../generated/poe2-tree/class-registry.json'
import renderData from '../../generated/poe2-tree/tree-render-data.json'
import { resolveAscendancyDisplayTransform,transformAscendancyPoint } from './ascendancy'

describe('offizielle PoE2-Baumassets',()=>{
  it('bindet Release und Commit fest',()=>{expect(manifest.release).toBe('0.5.2');expect(manifest.commit).toBe('1e9eb2d8c1946398c3aaaacfbaead5c75c0d1fa6')})
  it('inventarisiert ausschließlich lokale Exportdateien mit SHA-256',()=>{expect(manifest.files).toHaveLength(36);for(const file of manifest.files){expect(file.relativePath).toMatch(/^assets\/[a-z-]+\.(json|webp)$/);expect(file.sha256).toMatch(/^[a-f0-9]{64}$/);expect(JSON.stringify(file)).not.toMatch(/(?:https?:\/\/|[A-Z]:\\)/)}})
  it('hält alle Spritekoordinaten innerhalb der Atlanten',()=>{for(const frame of Object.values(renderData.atlases)){expect(frame.x+frame.w).toBeLessThanOrEqual(frame.atlasWidth);expect(frame.y+frame.h).toBeLessThanOrEqual(frame.atlasHeight)}})
  it('meldet fehlende Mastery-Icons kontrolliert',()=>{expect(report.status).toBe('validated-with-warnings');expect(report.unresolvedNodeIconReferences.length).toBeGreaterThan(0)})
  it('erkennt zwölf Klassen ohne Sechsergrenze und aktiviert neue Klassen nicht ohne Assets',()=>{expect(registry.classes).toHaveLength(12);expect(registry.classes.filter(value=>value.selectableInCurrentUi)).toHaveLength(8);expect(registry.classes.find(value=>value.displayName==='Marauder')?.selectableInCurrentUi).toBe(false)})
  it('ordnet jede Aszendenz nur ihrer Klasse zu',()=>{const ids=new Set<string>();for(const item of registry.classes)for(const ascendancy of item.ascendancies){expect(ascendancy.classId).toBe(item.classId);expect(ids.has(ascendancy.ascendancyId)).toBe(false);ids.add(ascendancy.ascendancyId)}})
})

describe('zentrale Aszendenztransformation',()=>{it('erhält Geometrie und zentriert deterministisch',()=>{const source={minX:100,minY:200,maxX:1100,maxY:1200,width:1000,height:1000,padding:0},tree={minX:-10000,minY:-9000,maxX:10000,maxY:11000,width:20000,height:20000,padding:420},transform=resolveAscendancyDisplayTransform(source,tree),a=transformAscendancyPoint(transform,{x:100,y:200}),b=transformAscendancyPoint(transform,{x:1100,y:1200});expect(transform.navigationCenter).toEqual({x:0,y:1000});expect((b.x-a.x)/(b.y-a.y)).toBeCloseTo(1);expect(transform).toEqual(resolveAscendancyDisplayTransform(source,tree))})})
