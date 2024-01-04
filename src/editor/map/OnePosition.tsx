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
import * as React from 'react';
import {
  Marker,
  Popup,
  Circle,
  Rectangle,
  Polygon,
} from "react-leaflet";
import L from "leaflet";
import { PositionType } from "../types";
import { ReactDistortableImageOverlay, calculateTransform, getMatrixString } from "./ReactDistortableImageOverlay";

const fillBlueOptions = { fillColor: 'blue' }

interface OnePositionProps {
  value: Partial<PositionType>;
  onChange?: (value: Partial<PositionType>) => void;
  editing?: boolean;
}
const OnePosition = ({ value, onChange, editing = false }: OnePositionProps) => {
  // 展示一个节点.
  const imgRef = React.useRef<any>(undefined);
  const areaType = value.areaType;
  
  function handleChangeCorners(evt: any) {
    console.log('evt', evt.type, evt.target._corners, evt);
    const corners = evt.target._corners;
    if (corners) {
      const _map = evt.target._map;
      const points = corners.map(_map.latLngToLayerPoint.bind(_map));
      const w = imgRef.current?.getElement()?.offsetWidth || 500;
      const h = imgRef.current?.getElement()?.offsetHeight || 375;
      const matrix = calculateTransform(points, w, h);
      const matrixString = getMatrixString(matrix);
      const nCorners = corners?.map((item: L.LatLng) => [item.lat, item.lng]);
      const bg = { ...(value.bg || {}), corners: nCorners, matrix, matrixString };
      console.log('onChange', bg);
      onChange?.({ ...(value || {}), bg });
    }
  }
  const bgEventHandlers = {
    // load: handleChangeCorners,
    update: handleChangeCorners,
    // edit: handleChangeCorners,
    // dragend: handleChangeCorners
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
          editing ? <ReactDistortableImageOverlay ref={imgRef} url={value.bg?.image} eventHandlers={bgEventHandlers} editing={editing} selected={editing} corners={corners1} />
            : <ReactDistortableImageOverlay ref={imgRef} url={value.bg?.image} eventHandlers={bgEventHandlers} editing={false} selected={false} corners={corners1} /> : null}

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

export default OnePosition;
