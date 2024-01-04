/**
 * 地图上的点位编辑器.
 * 属性:
 * + editable(编辑模式,否则为展示模式)
 * + maxLevel(最多展示层级,默认为1级,如果层级多,则叠加展示,一般在展示模式会用多层级)
 * + dbPositionMap(点位集合,都是已经在数据库中创建过的节点)
 * + parent(当前编辑节点所在父节点内容,如果为null或undefined表示在根节点,即地球上编辑子节点)
 * + value(即current,当前编辑节点内容,可能是已经在数据库中创建过的节点,也可能是正准备要创建的节点)
 * + onChange(改变了当前节点的属性,更新到current中)
 * 
 * 添加逻辑:
 * + 点,point
 *  - 点击按钮切换到创建状态, 点击地图释放后创建成功, 点击释放后就取消创建状态.
 * + 圆,circle
 *  - 点击按钮切换到创建圆状态, 第一次点击选定圆心, 移动鼠标时改变圆半径, 再次点击后确定圆半径, 并完成创建状态.
 * + 长方形,rectangle
 *  - 同圆, 支持两种模式, 按住并拖动和点击移动二次点击.
 * + 多边形,polygon
 * 参考:
 * 1. 添加移动删除Markers<https://tomickigrzegorz.github.io/react-leaflet-examples/#/add-move-and-delete-marker>
 */
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  Circle,
  Rectangle,
  Polygon,
} from "react-leaflet";
import * as React from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./location.editor.css";
import { InnerEditorProps, PositionType, findChildrenIdsByParentId } from "./types";
import { ReactDistortableImageOverlay } from "./ReactDistortableImageOverlay";
import { center, tileLayer_TianDiTu_Satellite_Annotion as tileLayerAnnotion, tileLayer_TianDiTu_Satellite_Map as tileLayerMap } from './mapConst';

const fillBlueOptions = { fillColor: 'blue' }

interface OnePositionProps {
  value: Partial<PositionType>;
  onChange?: (value: Partial<PositionType>) => void;
  editing?: boolean;
}
const OnePosition = ({ value, onChange, editing = false }: OnePositionProps) => {
  // 展示一个节点.
  const areaType = value.areaType;
  const bgEventHandlers = {
    load() {
      console.log('load');
    },
    edit(evt: any) {
      console.log('edit', evt.target._corners);
      const corners = evt.target._corners;
      const nCorners = corners?.map((item: L.LatLng) => [item.lat, item.lng]);
      const bg = { ...(value.bg || {}), corners: nCorners };
      onChange?.({ ...(value || {}), bg });
    },
    dragend(evt: any) {
      console.log('dragend', evt.target._corners);
      const corners = evt.target._corners;
      const nCorners = corners?.map((item: L.LatLng) => [item.lat, item.lng]);
      const bg = { ...(value.bg || {}), corners: nCorners };
      onChange?.({ ...(value || {}), bg });
    }
  }

  const markerEventHandlers = {
    moveend(e: any) {
      const { lat, lng } = e.target.getLatLng();
      console.log('moveend', lat, lng);
      onChange?.({ ...(value || {}), location: [lat, lng] });
      // setCurrentCampus(old => {
      //   // 一个时刻只有一个处于编辑状态. 后续的点击不添加新园区.
      //   return { ...old, pos: [lat, lng] }
      // })
    }
  }

  const corners = value.bg?.corners;
  const corners1 = corners?.map((item: number[]) => L.latLng(item[0], item[1]));

  if (areaType === 'point') {
    return (
      <>
        {value.bg?.image ?
          editing ? <ReactDistortableImageOverlay url={value.bg?.image} eventHandlers={bgEventHandlers} editing={editing} selected={editing} corners={corners1} />
            : <ReactDistortableImageOverlay url={value.bg?.image} eventHandlers={bgEventHandlers} editing={false} selected={false} corners={corners1} /> : null}

        <Marker
          key={value._id}
          position={value.location}
          draggable={true}
          eventHandlers={markerEventHandlers}
        >
          <Popup keepInView={true}>
            <span >{value.name}</span>
          </Popup>
        </Marker>
      </>
    )
  } else if (areaType === 'circle') {
    return (
      <>
        {value.bg?.image ?
          editing ? <ReactDistortableImageOverlay url={value.bg?.image} eventHandlers={bgEventHandlers} editing={editing} selected={editing} corners={corners1} />
            : <ReactDistortableImageOverlay url={value.bg?.image} eventHandlers={bgEventHandlers} editing={false} selected={false} corners={corners1} /> : null}
        <Circle center={value.location} pathOptions={fillBlueOptions} radius={value.area || 0} />
      </>
    )
  } else if (areaType === 'rectangle') {
    if (value.location && value.area) {
      const rect = [value.location, value.area];
      return (
        <>
          {value.bg?.image ?
            editing ? <ReactDistortableImageOverlay url={value.bg?.image} eventHandlers={bgEventHandlers} editing={editing} selected={editing} corners={corners1} />
              : <ReactDistortableImageOverlay url={value.bg?.image} eventHandlers={bgEventHandlers} editing={false} selected={false} corners={corners1} /> : null}
          <Rectangle bounds={rect} pathOptions={fillBlueOptions} />
        </>
      )
    } else {
      return null;
    }
  } else if (areaType === 'polygon') {
    if (value.location) {
      // area为点列表,不包含第一个点,第一个点为location.
      let polygon = [value.location, ...(value.area || [])];
      if (value.polygonTmp) polygon.push(value.polygonTmp)
      return (
        <>
          {value.bg?.image ?
            editing ? <ReactDistortableImageOverlay url={value.bg?.image} eventHandlers={bgEventHandlers} editing={editing} selected={editing} corners={corners1} />
              : <ReactDistortableImageOverlay url={value.bg?.image} eventHandlers={bgEventHandlers} editing={false} selected={false} corners={corners1} /> : null}
          <Polygon pathOptions={fillBlueOptions} positions={polygon} />
        </>
      )
    } else {
      return null;
    }
  }
}

interface MapInnerState {
  mapDraggable: boolean; // 进入编辑或创建模式前,保存地图是否可以移动的状态.
  editing: boolean; // 是否在编辑状态.
  current?: Partial<PositionType>;
}
const MapInner = ({ dbNodeMap = {}, dbNodeTree = [], parent, value, onChange }: InnerEditorProps) => {
  // 如何判断当前模式,是创建,编辑还是查看模式?
  // + 当前无选中节点,表示为查看模式.
  // + 当前选中节点无_id,表示创建节点中.
  // + 当前节点有id,表示编辑模式.
  // 如何进入编辑状态? 切换节点时(即_id变化),则进入创建中状态.
  // 编辑完成节点后(如何判断是正在创建或编辑点,圆,长方形,多边形过程中?),提交改变,保存节点.
  const mode = !value ? 'view' : !value._id ? 'create' : 'edit';
  const areaType = value?.areaType;

  const [state, setState] = React.useState<MapInnerState>({
    mapDraggable: true,
    editing: false,
  });
  React.useEffect(() => {
    // 切换_id,或者areaType变化,表示进入编辑中状态(可能是创建或者编辑).
    setState(state => ({ ...state, editing: true }));
  }, [value?._id, value?.areaType]);
  React.useEffect(() => {
    // 当前节点更新,更新state.current.
    // const editing = !!value;
    // console.log(`当前选中节点更新,设置editing=${editing}`, value);
    // setState(state => ({ ...state, current: value, editing }));
    setState(state => ({ ...state, current: value }));
  }, [value]);

  const parentId = parent?._id ?? null;
  const currentId = value?._id ?? null;
  const subIds = findChildrenIdsByParentId(dbNodeTree, parentId) || [];
  // 如果当前编辑节点在subIds中,去掉.当前节点的渲染不同.
  const subIdsWithoutCurrent = !currentId ? subIds : subIds.filter((value) => value !== currentId);
  const staticNodes = subIdsWithoutCurrent.map(key => dbNodeMap[key]).filter(o => !!(o && o.location)); //过滤掉没有location的节点.
  const map = useMapEvents({
    click(e) {
      if (state.editing && mode === 'create') {
        const { lat, lng } = e.latlng;
        console.log('click', lat, lng);
        if (areaType === 'point') {
          // 区域类型: 点,即Marker
          const nCurrent = { ...(state.current || {}), location: [lat, lng] }
          setState(state => ({ ...state, current: nCurrent, editing: false }));
          onChange && onChange(nCurrent);
        } else if (areaType === 'polygon') {
          // 区域类型: 多边形
          if (!state.current?.location) {
            // 第一个点未设置,先设置第一个点.
            const nCurrent = { ...(state.current || {}), location: [lat, lng] }
            setState(state => ({ ...state, current: nCurrent }));
            return;
          }
          // 至少要大于等于3个点.
          if (state.current?.area?.length >= 2) {
            const lastPixel = map.project([lat, lng]);
            const firstPixel = map.project(state.current.location);
            const distancePixel = lastPixel.distanceTo(firstPixel);
            if (distancePixel < 10) {
              // 与第一点的距离小于10像素,认为是最后一点,结束了.
              const nCurrent = { ...(state.current || {}), polygonTmp: undefined };
              setState(state => ({ ...state, current: nCurrent, editing: false }));
              onChange && onChange(nCurrent);
              return;
            }
          }
          // 未结束,增加点.
          const nArea = [...(state.current?.area || []), [lat, lng]];
          const nCurrent = { ...(state.current || {}), area: nArea };
          setState(state => ({ ...state, current: nCurrent }));
          return;
        }
      }
      // map.locate()
    },
    mousedown(e) {
      if (state.editing && mode === 'create') {
        const { lat, lng } = e.latlng;
        console.log('mousedown', lat, lng);
        if (areaType === 'circle' || areaType === 'rectangle') {
          // 区域类型: 圆,按下鼠标时设置圆心(即location的值).
          // 注意: 未设置圆心时,才设置圆心. 若已设置圆心表示第二点松开.
          if (!state.current?.location) {
            const nCurrent = { ...(state.current || {}), location: [lat, lng] }
            setState(state => ({ ...state, current: nCurrent }));
          }
        }
      }
    },
    mousemove(e) {
      if (state.editing && mode === 'create') {
        const { lat, lng } = e.latlng;
        console.log('mousemove', lat, lng);
        if (areaType === 'circle') {
          if (state.current?.location) {
            // 已设置过圆心才需要展示圆,否则先设置圆心.
            const radius = map.distance(state.current?.location, [lat, lng]);
            const nCurrent = { ...(state.current || {}), area: radius }
            setState(state => ({ ...state, current: nCurrent }));
          }
        } else if (areaType === 'rectangle') {
          if (state.current?.location) {
            // 已设置过一点,再设置一点.
            const nCurrent = { ...(state.current || {}), area: [lat, lng] }
            setState(state => ({ ...state, current: nCurrent }));
          }
        } else if (areaType === 'polygon') {
          if (state.current?.location) {
            // 已设置过起点,再设置最后一点.
            const nCurrent = { ...(state.current || {}), polygonTmp: [lat, lng] }
            setState(state => ({ ...state, current: nCurrent }));
          }
        }
      }
    },
    mouseup(e) {
      if (state.editing && mode === 'create') {
        const { lat, lng } = e.latlng;
        console.log('mouseup', lat, lng);
        if (areaType === 'circle') {
          // 区域类型: 圆,松开鼠标时判断当前位置是否为圆心位置,如果是则表示点击了圆心,否则表示圆画完了.
          if (!state.current?.location) {
            // 未设置圆心,首先设置圆心
            const nCurrent = { ...(state.current || {}), location: [lat, lng] }
            setState(state => ({ ...state, current: nCurrent }));
            return;
          }
          const circleCenter = state.current?.location;
          const radius = map.distance(circleCenter, [lat, lng]);
          if (isNaN(radius) || radius <= 0) {
            // 松手时无半径,认为当前位置为圆心.
            console.log('松手时无半径,认为当前位置为圆心.', radius);
            const nCurrent = { ...(state.current || {}), location: [lat, lng] }
            setState(state => ({ ...state, current: nCurrent }));
            return;
          }
          const nCurrent = { ...(state.current || {}), area: radius }
          setState(state => ({ ...state, current: nCurrent, editing: false }));
          onChange && onChange(nCurrent);
        } else if (areaType === 'rectangle') {
          // 区域类型: 矩形.
          if (!state.current?.location) {
            // 未设置第一点,先设置第一点.
            const nCurrent = { ...(state.current || {}), location: [lat, lng] }
            setState(state => ({ ...state, current: nCurrent }));
            return;
          }
          // 已经设置了第一点,再设置第二点.
          const nCurrent = { ...(state.current || {}), area: [lat, lng] }
          setState(state => ({ ...state, current: nCurrent, editing: false }));
          onChange && onChange(nCurrent);
        }
      }

    },
    // dragstart(e) {
    //   L.DomEvent.stopPropagation(e);
    //   L.DomEvent.preventDefault(e);
    //   // e.originalEvent.preventDefault();
    //   // e.originalEvent.stopPropagation();
    //   console.log('dragstart');
    // },
    // drag(e) {
    //   console.log('drag');
    // },
    // dragend(e) {
    //   L.DomEvent.preventDefault(e);
    //   L.DomEvent.stopPropagation(e);
    //   console.log('dragend');
    // },
    // locationfound(e) {
    //   setPosition(e.latlng)
    //   map.flyTo(e.latlng, map.getZoom())
    // },
  })

  React.useEffect(() => {
    // 编辑或创建状态下切换地图为不可移动模式.
    const mapDraggable = map.dragging.enabled();
    console.log('mapDraggable', mapDraggable);
    setState(state => ({ ...state, mapDraggable }));
  }, [map]);
  React.useEffect(() => {
    if (mode === 'create' && state.editing) {
      if (state.mapDraggable) {
        map.dragging.disable();
      }
    } else {
      if (state.mapDraggable) {
        map.dragging.enable();
      }
      // onChange && state.current && onChange(state.current);
    }
  }, [mode, state.editing]);
  console.log('MapInner render', { editing: state.editing, mode, count: staticNodes.length }, value);
  return (
    <>
      {staticNodes.map(item => {
        return (
          <OnePosition key={item._id} value={item} />
        )
      })}
      {state.current?.location ? <OnePosition value={state.current} onChange={onChange} /> : null}
    </>
  );
}

const LocationEditor = (props: InnerEditorProps) => {
  // 目前只处理maxLevel=1的情形.
  // const [map, setMap] = React.useState<any>(null);

  return (
    <div className="leaflet-wrapper">
      <MapContainer
        // ref={setMap}
        // @ts-ignore
        // whenCreated={setMap}
        // whenReady={setMap}
        center={center}
        zoom={15}
        scrollWheelZoom={true}
      >
        <TileLayer {...tileLayerMap} />
        <TileLayer {...tileLayerAnnotion} />
        <MapInner {...props} />
      </MapContainer>
    </div>
  );
};

export default LocationEditor;
