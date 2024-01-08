/**
 * 点位/建筑节点.
 * 需要使用的属性有:
 * + bg背景
 * + location定位点
 * + areaType区域类型
 * + area区域描述
 * 
 * areaType区域类型:
 * + point: {location:[10,20],areaType:'point'}
 * + circle: {location:[10,20],area:30,areaType:'circle'}
 * + rectangle: {location:[10,20],area:[30,60],areaType:'rectangle'}
 * + polygon: {location:[10,20],area:[[30,60],[20,70],[15,40]],areaType:'polygon'}
 * location为第一点,
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
// import { Handle, Position } from 'reactflow';
import max from 'lodash/max';
import min from 'lodash/min';

import './node-bg.css';
import { AreaType } from '../types';

interface RectType {
  x1: number; y1: number; x2: number; y2: number;
}
interface ShapeDataType {
  location: number[]; areaType: AreaType; area: any; areaTemp?: any
}
// 计算得到包含该区域的最小矩形,得到左上角,右下角.
function calcMinRect({ location, areaType, area, areaTemp }: ShapeDataType): RectType | undefined {
  if (!location) return undefined;
  switch (areaType) {
    case 'point': return { x1: location[0] - 5, y1: location[1] - 5, x2: location[0] + 5, y2: location[1] + 5 };
    case 'circle': {
      let radius = areaTemp || area || 0;
      if (radius < 5) radius = 5;
      return { x1: location[0] - radius, y1: location[1] - radius, x2: location[0] + radius, y2: location[1] + radius }
    }
    case 'rectangle': {
      const point2 = areaTemp || area;
      if (!point2) return { x1: location[0], y1: location[1], x2: location[0], y2: location[1] };
      const x = location[0] > point2[0] ? [point2[0], location[0]] : [location[0], point2[0]];
      const y = location[1] > point2[1] ? [point2[1], location[1]] : [location[1], point2[1]];
      return { x1: x[0], y1: y[0], x2: x[1], y2: y[1] };
    }
    case 'polygon': {
      const points = areaTemp ? [...(area || []), areaTemp] : area;
      if (!points || points.length === 0) return { x1: location[0], y1: location[1], x2: location[0], y2: location[1] };
      const { x, y } = points.reduce((prev: { x: number[]; y: number[] }, item: number[]) => {
        prev.x.push(item[0]);
        prev.y.push(item[1]);
        return prev;
      }, { x: [location[0]], y: [location[1]] })
      return { x1: min(x) || 0, y1: min(y) || 0, x2: max(x) || 0, y2: max(y) || 0 }
    }
    default: return undefined;
  }
}

function genShapeProps({ location, areaType, area, areaTemp }: ShapeDataType, minRect: RectType): { [key: string]: any } {
  switch (areaType) {
    case 'point': return { cx: location[0] - minRect.x1, cy: location[1] - minRect.y1, r: 3 };
    case 'circle': return { cx: location[0] - minRect.x1, cy: location[1] - minRect.y1, r: areaTemp || area || 0 };
    case 'rectangle': return { x: 0, y: 0, width: minRect.x2 - minRect.x1, height: minRect.y2 - minRect.y1 };
    case 'polygon': {
      const points1 = areaTemp ? [...(area || []), areaTemp] : area || [];
      const points = [location, ...points1].map(item => `${item[0] - minRect.x1},${item[1] - minRect.y1}`).join(' ');
      return { points };
    }
  }
}

const shapeStyle = {
  fill: 'blue',
  stroke: 'pink',
  strokeWidth: 2,
  opacity: 0.5
}

function NodePosition({ data }: any) {
  const { name, bg, location, areaType, areaTemp } = data || {};
  const { image, matrixString } = bg || {};
  const style = React.useMemo(() => {
    return {
      left: 0,
      top: 0,
      transform: matrixString,
      transformOrigin: '0px 0px 0px',
    }
  }, [matrixString]);

  // 为保证svg能显示,需要计算得到包含所有点的最小矩形
  const minRect = calcMinRect(data);
  const w = minRect ? (minRect?.x2 - minRect?.x1) : 0;
  const h = minRect ? (minRect?.y2 - minRect?.y1) : 0;
  // 需要计算svg的相对偏移
  const x = minRect ? (minRect.x1 - location[0]) : 0;
  const y = minRect ? (minRect.y1 - location[1]) : 0;
  // 所有点为了在svg中,需要减掉(minRect.x1, minRect.y1).
  const svgStyle = {
    transform: `translate(${x}px, ${y}px)`,
  }
  const shapeProps = minRect ? genShapeProps(data, minRect) : {};
  // 
  // const onChange = useCallback((evt:any) => {
  //   console.log(evt.target.value);
  // }, []);

  return (
    <div>
      {image ? <img src={image} style={style} alt='无背景图片' /> : null}
      <svg width={w} height={h} style={svgStyle}>
        {areaType === 'rectangle' ? (
          <rect {...shapeProps} style={shapeStyle} />
        ) : areaType === 'point' ? (
          <circle {...shapeProps} style={shapeStyle} />
        ) : areaType === 'circle' ? (
          <circle {...shapeProps} style={shapeStyle} />
        ) : areaType === 'polygon' ? (
          <polygon {...shapeProps} style={shapeStyle} />
        ) : null}
      </svg>
      <div style={{position: 'absolute', left:0, top:0}}>
        <label>{name || '未命名'}</label>
      </div>
    </div>
  );
}

export default NodePosition;
