export const TREE_ZOOM = { min: 1, max: 12, buttonFactor: 1.4, wheelFactor: 1.15, pinchSensitivity: 1 } as const
export interface TreeCamera { centerX: number; centerY: number; zoom: number }
export interface ScreenPoint { x: number; y: number }
export interface ViewportRect { left: number; top: number; width: number; height: number }
export interface TreeSize { width: number; height: number }
export const clampTreeZoom = (zoom: number) => Math.max(TREE_ZOOM.min, Math.min(TREE_ZOOM.max, Number.isFinite(zoom) ? zoom : TREE_ZOOM.min))
export const pointerDistance = (a: ScreenPoint, b: ScreenPoint) => Math.hypot(b.x - a.x, b.y - a.y)
export const pointerMidpoint = (a: ScreenPoint, b: ScreenPoint) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })
export function screenPointToWorld(camera: TreeCamera, tree: TreeSize, rect: ViewportRect, point: ScreenPoint) { const viewWidth = tree.width / camera.zoom, viewHeight = tree.height / camera.zoom; return { x: camera.centerX + ((point.x - rect.left) / rect.width - .5) * viewWidth, y: camera.centerY + ((point.y - rect.top) / rect.height - .5) * viewHeight } }
export function zoomTreeCameraAt(camera: TreeCamera, factor: number, tree: TreeSize, rect: ViewportRect, point: ScreenPoint): TreeCamera { const anchor = screenPointToWorld(camera, tree, rect, point), zoom = clampTreeZoom(camera.zoom * factor), nextViewWidth = tree.width / zoom, nextViewHeight = tree.height / zoom; return { zoom, centerX: anchor.x - ((point.x - rect.left) / rect.width - .5) * nextViewWidth, centerY: anchor.y - ((point.y - rect.top) / rect.height - .5) * nextViewHeight } }
export function panTreeCamera(camera: TreeCamera, tree: TreeSize, rect: ViewportRect, delta: ScreenPoint): TreeCamera { return { ...camera, centerX: camera.centerX - delta.x * (tree.width / camera.zoom) / rect.width, centerY: camera.centerY - delta.y * (tree.height / camera.zoom) / rect.height } }
