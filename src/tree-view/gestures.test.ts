import { describe, expect, it } from 'vitest'
import { clampTreeZoom, panTreeCamera, pointerDistance, pointerMidpoint, screenPointToWorld, TREE_ZOOM, zoomTreeCameraAt } from './gestures'

const tree = { width: 1000, height: 800 }, rect = { left: 100, top: 50, width: 500, height: 400 }, camera = { centerX: 0, centerY: 0, zoom: 2 }
describe('Baumgesten', () => {
  it('berechnet Distanz und Mittelpunkt unabhängig von der Pointer-Reihenfolge', () => { const a = { x: 120, y: 90 }, b = { x: 320, y: 190 }; expect(pointerDistance(a, b)).toBe(pointerDistance(b, a)); expect(pointerMidpoint(a, b)).toEqual(pointerMidpoint(b, a)) })
  it('vergrößert bei auseinandergezogenen Fingern und verkleinert beim Zusammenziehen', () => { expect(zoomTreeCameraAt(camera, 2, tree, rect, { x: 250, y: 200 }).zoom).toBe(4); expect(zoomTreeCameraAt(camera, .5, tree, rect, { x: 250, y: 200 }).zoom).toBe(1) })
  it('hält die Weltposition unter dem Zoomzentrum stabil', () => { const point = { x: 470, y: 160 }, before = screenPointToWorld(camera, tree, rect, point), afterCamera = zoomTreeCameraAt(camera, 1.8, tree, rect, point), after = screenPointToWorld(afterCamera, tree, rect, point); expect(after.x).toBeCloseTo(before.x); expect(after.y).toBeCloseTo(before.y) })
  it('verschiebt die Kamera beim Pan konsistent', () => expect(panTreeCamera(camera, tree, rect, { x: 50, y: -40 })).toEqual({ centerX: -50, centerY: 40, zoom: 2 }))
  it('erzwingt zentrale Zoomgrenzen und endliche Werte', () => { expect(clampTreeZoom(0)).toBe(TREE_ZOOM.min); expect(clampTreeZoom(99)).toBe(TREE_ZOOM.max); expect(clampTreeZoom(Number.NaN)).toBe(TREE_ZOOM.min) })
})
