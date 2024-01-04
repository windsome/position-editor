import L from 'leaflet';
import 'leaflet-toolbar';
// @ts-ignore
import 'leaflet-distortableimage';
import {
  type MediaOverlayProps,
  createElementObject,
  createLayerComponent,
  extendContext,
  updateMediaOverlay,
} from '@react-leaflet/core'
import 'leaflet-toolbar/dist/leaflet.toolbar.css';
import 'leaflet-distortableimage/dist/leaflet.distortableimage.css';

export function calculateTransform(cornersAsPoint: L.Point[], w: number = 500, h: number = 375) {
  if (!cornersAsPoint || cornersAsPoint.length < 4) return undefined;
  const offset = cornersAsPoint[0];
  const c = [];
  for (let j = 0; j < 4; j++) {
    c.push(cornersAsPoint[j].subtract(offset));
  }
  return (L as any).MatrixUtil.general2DProjection(
      0, 0, c[0].x, c[0].y,
      w, 0, c[1].x, c[1].y,
      0, h, c[2].x, c[2].y,
      w, h, c[3].x, c[3].y
  );
}
export function getMatrixString(matrix: any): string {
  return (L.DomUtil as any).getMatrixString(matrix);
}

// @ts-ignore
export interface ReactDistortableImageOverlayProps extends MediaOverlayProps {
  url: string;
  corners?: any;
  bounds?: L.LatLngBoundsExpression;
  mode?: string;     // 'rotate', 'distort', 'translate' or 'scale'
  selected: boolean;
  editing: boolean;
  actions?: any[];
}
export const ReactDistortableImageOverlay = createLayerComponent<
  // @ts-ignore
  L.DistortableImageOverlay,
  ReactDistortableImageOverlayProps
>(
  function createImageOveraly({ url, ...options }, ctx) {
    const overlay = (L as any).distortableImageOverlay(url, {
      actions: [
        // (L as any).ScaleAction,
        (L as any).DistortAction,
        // L.RotateAction,
        (L as any).FreeRotateAction,
        // L.LockAction,
        // L.OpacityAction,
        // L.DeleteAction,
        // L.StackAction,
      ], ...options
    })
    return createElementObject(
      overlay,
      extendContext(ctx, { layerContainer: overlay, overlayContainer: overlay }),
    )
  },
  function updateImageOverlay(overlay, props, prevProps) {
    // 确认什么属性的改变触发了overlay的改变.
    // @ts-ignore
    updateMediaOverlay(overlay, props, prevProps)
    // if (props.bounds !== prevProps.bounds) {
    //   const bounds =
    //     props.bounds instanceof LatLngBounds
    //       ? props.bounds
    //       : new LatLngBounds(props.bounds)
    //   overlay.setBounds(bounds)
    // }
    // if (props.corners !== prevProps.corners) {
    //   overlay.setCorners(props.corners)
    // }
    if (props.url !== prevProps.url) {
      overlay.setUrl(props.url)
    }
    if (props.mode !== prevProps.mode) {
      overlay.setOptions({ mode: props.mode });
    }
    if (props.selected !== prevProps.selected) {
      overlay.setOptions({ selected: props.selected });
    }
    if (props.editing !== prevProps.editing) {
      overlay.setOptions({ editing: props.editing });
    }
  },
)
