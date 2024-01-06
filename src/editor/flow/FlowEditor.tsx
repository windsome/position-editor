import * as React from 'react';
import {
  ReactFlow,
  MiniMap,
  Background,
  BackgroundVariant,
  Controls,
  ReactFlowProvider,
  Node,
  Edge,
  useReactFlow,
  Panel,
  ReactFlowInstance,
  useNodesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import Sidebar from './Sidebar';
import NodeBg from './NodeBg';
import NodePosition from './NodePosition';
import { Identifier, InnerEditorProps, PositionType } from '../types';
import { findChildrenIdsByParentId } from '../tree';
import { xor } from 'lodash';
const nodeTypes = { NodeBg, NodePosition };

const onNodeDrag = (_: React.MouseEvent, node: Node) => console.log('drag', node);
const onNodeDragStop = (_: React.MouseEvent, node: Node) => console.log('drag stop', node);
const onNodeClick = (_: React.MouseEvent, node: Node) => console.log('click', node);

// const initialNodes: Node[] = [
//   {
//     id: '0',
//     type: 'BgNode',
//     deletable: false,
//     draggable: false,
//     selectable: false,
//     connectable: false,
//     focusable: false,
//     data: { label: 'Node 0', bg: { image: '/images/example.jpg' } },
//     position: { x: 0, y: 0 },
//     className: 'light',
//   },
//   {
//     id: '1',
//     type: 'input',
//     data: { label: 'Node 1' },
//     position: { x: 250, y: 5 },
//     className: 'light',
//   },
//   {
//     id: '2',
//     data: { label: 'Node 2' },
//     position: { x: 100, y: 100 },
//     className: 'light',
//   },
// ];

// const initialEdges: Edge[] = [
//   { id: 'e1-2', source: '1', target: '2', animated: true },
//   { id: 'e1-3', source: '1', target: '3' },
// ];

const defaultEdgeOptions = {};

function distance(point1: number[], point2: number[]): number {
  return Math.sqrt((point2[0]-point1[0]) * (point2[0]-point1[0]) + (point2[1]-point1[1]) * (point2[1]-point1[1]))
}

const onDragOver = (event: React.DragEvent) => {
  event.preventDefault();
  if (event.dataTransfer)
    event.dataTransfer.dropEffect = 'move';
};

let id = 0;
const getId = () => `dndnode_${id++}`;

interface FlowState {
  nodeBg?: Node;
  nodesWithoutCurrent: Node[];
  nodeCurrent?: Node;
  nodeIdsWithoutCurrent: Identifier[];
  current?: Partial<PositionType>;
  nodes: Node[];
  editing: boolean; // 是否处于编辑状态.
}

const BasicFlow = ({ dbNodeMap = {}, dbNodeTree = [], parent, value, onChange }: InnerEditorProps) => {

  const [reactFlowInstance, setReactFlowInstance] = React.useState<ReactFlowInstance>();
  const instance = useReactFlow();
  // const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);

  const mode = !value ? 'view' : !value._id ? 'create' : 'edit';
  const areaType = value?.areaType;
  const [state, setState] = React.useState<FlowState>({ nodesWithoutCurrent: [], nodeIdsWithoutCurrent: [], nodes: [], editing: false });

  React.useEffect(() => {
    // 当前节点更新,更新state.current.
    setState(state => ({ ...state, current: value, editing: false }));
  }, [value]);
  // 初始化背景节点.
  React.useEffect(() => {
    setState(state => ({
      ...state, nodeBg: {
        id: parent?._id || '0',
        type: 'NodeBg',
        deletable: false,
        draggable: false,
        selectable: false,
        connectable: false,
        focusable: false,
        data: parent,
        position: { x: 0, y: 0 },
      }
    }))
  }, [parent]);

  // 根据parent,value及dbNodeTree更新当前未选中节点id列表.
  React.useEffect(() => {
    const parentId = parent?._id ?? null;
    const currentId = value?._id ?? null;
    const subIds = findChildrenIdsByParentId(dbNodeTree, parentId) || [];
    // 如果当前编辑节点在subIds中,去掉.当前节点的渲染不同.
    const nodeIdsWithoutCurrent = !currentId ? subIds : subIds.filter((value) => value !== currentId);
    setState(state => {
      if (xor(state.nodeIdsWithoutCurrent, nodeIdsWithoutCurrent).length > 0) {
        // 数组变化时才更新state.
        return {
          ...state,
          nodeIdsWithoutCurrent
        }
      } else {
        return state;
      }
    })
  }, [parent?._id, value?._id, dbNodeTree]);

  React.useEffect(() => {
    // const staticNodes = subIdsWithoutCurrent.map(key => dbNodeMap[key]).filter(o => !!(o && o.location)); //过滤掉没有location的节点.
    const nodesWithoutCurrent = state.nodeIdsWithoutCurrent.map(key => {
      const position = dbNodeMap[key];
      if (!position?._id) {
        console.log('error! no position._id', position);
      }
      return {
        id: position?._id,
        type: 'NodePosition',
        // deletable: false,
        draggable: false,
        selectable: false,
        // connectable: false,
        focusable: false,
        data: position,
        position: { x: position?.location?.[0] || 0, y: position?.location?.[1] || 0 },
      }
    });
    setState(state => {
      return {
        ...state, nodesWithoutCurrent
      }
    })
  }, [state.nodeIdsWithoutCurrent]);

  React.useEffect(() => {
    let nodes: Node[] = [];
    if (state.nodeBg) nodes.push(state.nodeBg);
    if (state.nodesWithoutCurrent.length > 0) {
      nodes.push(...state.nodesWithoutCurrent);
    }
    if (state.current) {
      nodes.push({
        id: state.current?._id || '',
        type: 'NodePosition',
        // deletable: false,
        draggable: false,
        selectable: false,
        // connectable: false,
        focusable: false,
        data: state.current,
        position: { x: state.current?.location?.[0] || 0, y: state.current?.location?.[1] || 0 },
      })
    }
    setState(state => ({ ...state, nodes }));
  }, [state.nodeBg, state.nodesWithoutCurrent, state.current]);

  const funcs = React.useMemo(() => {
    return ['onMove', 'onMoveStart', 'onMoveEnd', 'onPaneContextMenu', 'onPaneScroll', 'onPaneMouseEnter', 'onPaneMouseLeave'].reduce((prev: any, item: string) => {
      const func = (evt: any) => {
        if (evt) {
          const position = reactFlowInstance?.screenToFlowPosition({
            x: evt.clientX,
            y: evt.clientY,
          });
          console.log(item, position);
        }
      }
      return { ...prev, [item]: func }
    }, {})
  }, [reactFlowInstance])
  const handlePaneClick = React.useCallback((evt: React.MouseEvent)=>{
    const position = reactFlowInstance?.screenToFlowPosition({
      x: evt.clientX,
      y: evt.clientY,
    });
    console.log('handlePaneClick', position);
    const current = state.current;
    if (!current) {
      // 当前无节点处于编辑状态.
      return;
    }
    if (!position) {
      return;
    }
    const point = [position.x, position.y];
    if (current.areaType === 'point') {
      // location不存在才设置.
      if (!current.location) {
        // 点只需要一个点即可,直接提交改变,
        onChange?.({...current, location: point})
      }
    } else if (current.areaType === 'circle') {
      // 圆,两个点.
      if (!current.location) {
        // 圆心不存在,先设置圆心.
        setState(state => {
          return {
            ...state,
            current: {...state.current, location: point},
            editing: true
          }
        })
        // onChange?.({...current, location: [position?.x, position?.y]})
        return;
      }
      if (!current.area??undefined) {
        // area即为半径,如果未设置,表示还在编辑阶段.此时可以设置,并直接提交.
        const location0 = current.location;
        const radius = distance(location0, point);
        // const radius = Math.sqrt((location0[0]-position.x) * (location0[0]-position.x) + (location0[1]-position.y) * (location0[1]-position.y))
        onChange?.({...current, area: radius});
      }
      return;
    } else if (current.areaType === 'rectangle') {
      // 矩形,两个点.
      if (!current.location) {
        // 第一个点不存在,先设置第一个.
        setState(state => {
          return {
            ...state,
            current: {...state.current, location: point},
            editing: true,
          }
        })
        // onChange?.({...current, location: point})
        return;
      }
      if (!current.area??undefined) {
        // area即为第二个点,如果未设置,表示还在编辑阶段.此时可以设置,并直接提交.
        onChange?.({...current, area: point})
      }
      return;
    } else if (current.areaType === 'polygon') {
      // 多边形,至少三个点.
      if (!current.location) {
        // 第一个点不存在,先设置第一个.
        setState(state => {
          return {
            ...state,
            current: {...state.current, location: point},
            editing: true
          }
        })
        // onChange?.({...current, location: [position?.x, position?.y]})
        return;
      }
      // 设置第二个及其他点.
      // 判断该点与第一个点的距离,如果小于5,表示完成多边形.
      if (state.editing) {
        const distance0  =distance(current.location, point);
        if (distance0 <= 5) {
          // 在起始点附近了.结束多边形.
          setState(state => ({...state, editing: false}));
          onChange?.({...current, area: [...(current.area||[]), point], areaTemp: undefined})
        } else {
          // 多边形增加了一个点.
          setState(state => ({...state, current: {...current, area: [...(current.area||[]), point], areaTemp: undefined }}));
        }
      }
      return;
    }
  },[reactFlowInstance, state.current, state.editing]);

  const handlePaneMouseMove = React.useCallback((evt: React.MouseEvent)=>{
    // 鼠标移动,触发形状改变.
    if (!state.editing) {
      // 非编辑状态.
      return;
    }
    const position = reactFlowInstance?.screenToFlowPosition({
      x: evt.clientX,
      y: evt.clientY,
    });
    console.log('handlePaneMouseMove', position);
    const current = state.current;
    if (!current) {
      // 当前无节点处于编辑状态.
      return;
    }
    if (!position) {
      return;
    }
    const point = [position.x, position.y];
    const location0 = current.location;
    if (!location0) {
      // 已经设置过location才允许改变中间值areaTemp.
      return;
    }

    if (current.areaType === 'circle') {
      // 临时半径
      const radius = distance(location0, point);
      setState(state => {
        return {...state, current: {...(state.current||{}), areaTemp: radius}}
      })
      return;
    } else if (current.areaType === 'rectangle') {
      // 设置第二个点(临时).
      setState(state => {
        return {...state, current: {...(state.current||{}), areaTemp: point}}
      })
      return;
    } else if (current.areaType === 'polygon') {
      // 多边形,临时点.
      setState(state => {
        return {...state, current: {...(state.current||{}), areaTemp: point}}
      })
      return;
    }
  },[reactFlowInstance, state.current, state.editing]);
  
  const updatePos = () => {
    instance.setNodes((nodes) =>
      nodes.map((node) => {
        node.position = {
          x: Math.random() * 400,
          y: Math.random() * 400,
        };

        return node;
      })
    );
  };

  const logToObject = () => console.log(instance.toObject());
  const resetTransform = () => instance.setViewport({ x: 0, y: 0, zoom: 1 });

  const toggleClassnames = () => {
    instance.setNodes((nodes) =>
      nodes.map((node) => {
        node.className = node.className === 'light' ? 'dark' : 'light';

        return node;
      })
    );
  };
  const onInit = (rfi: ReactFlowInstance) => setReactFlowInstance(rfi);

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault();
    if (reactFlowInstance) {
      const type = event.dataTransfer?.getData('application/reactflow');
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      const newNode: Node = {
        id: getId(),
        type,
        position,
        data: { label: `${type} node` },
      };

      // setNodes((nds) => nds.concat(newNode));
    }
  };


  return (
    <ReactFlow
      nodeTypes={nodeTypes}
      // defaultNodes={initialNodes}
      // defaultEdges={initialEdges}
      onNodeClick={handlePaneClick}
      // onNodeClick={onNodeClick}
      onNodeDragStop={onNodeDragStop}
      onNodeDrag={onNodeDrag}
      nodes={state.nodes}
      // onNodesChange={onNodesChange}
      className="react-flow-basic-example"
      minZoom={0.2}
      maxZoom={4}
      fitView
      defaultEdgeOptions={defaultEdgeOptions}
      selectNodesOnDrag={false}
      elevateEdgesOnSelect
      elevateNodesOnSelect={false}
      onInit={onInit}
      onDrop={onDrop}
      onDragOver={onDragOver}

      onMove={funcs?.['onMove']}
      onMoveStart={funcs?.['onMoveStart']}
      onMoveEnd={funcs?.['onMoveEnd']}
      onPaneClick={handlePaneClick}
      onPaneContextMenu={funcs?.['onPaneContextMenu']}
      onPaneScroll={funcs?.['onPaneScroll']}
      onPaneMouseMove={handlePaneMouseMove}
      onPaneMouseEnter={funcs?.['onPaneMouseEnter']}
      onPaneMouseLeave={funcs?.['onPaneMouseLeave']}

    >
      <Background variant={BackgroundVariant.Dots} />
      <MiniMap />
      <Controls position='bottom-left' />

      {/* <Panel position="top-right">
        <button onClick={resetTransform}>reset transform</button>
        <button onClick={updatePos}>change pos</button>
        <button onClick={toggleClassnames}>toggle classnames</button>
        <button onClick={logToObject}>toObject</button>
      </Panel> */}
    </ReactFlow>
  );
};

export default function FlowEditor(props: InnerEditorProps) {
  return (
    <ReactFlowProvider>
      <BasicFlow {...props} />
      <Sidebar />
    </ReactFlowProvider>
  );
}
