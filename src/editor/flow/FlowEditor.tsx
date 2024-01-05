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
}

const BasicFlow = ({ dbNodeMap = {}, dbNodeTree = [], parent, value, onChange }: InnerEditorProps) => {
  const [reactFlowInstance, setReactFlowInstance] = React.useState<ReactFlowInstance>();
  const instance = useReactFlow();
  // const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);

  const [state, setState] = React.useState<FlowState>({ nodesWithoutCurrent: [], nodeIdsWithoutCurrent: [], nodes: [] });

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
    if (value) {
      nodes.push({
        id: value?._id || '',
        type: 'NodePosition',
        // deletable: false,
        draggable: false,
        selectable: false,
        // connectable: false,
        focusable: false,
        data: value,
        position: { x: value?.location?.[0] || 0, y: value?.location?.[1] || 0 },
      })
    }
    setState(state => ({ ...state, nodes }));
  }, [state.nodeBg, state.nodesWithoutCurrent, value]);

  const funcs = React.useMemo(() => {
    return ['onMove', 'onMoveStart', 'onMoveEnd', 'onPaneContextMenu', 'onPaneScroll', 'onPaneMouseMove', 'onPaneMouseEnter', 'onPaneMouseLeave'].reduce((prev: any, item: string) => {
      const func = (evt: any) => {
        // if (evt) {
        //   const position = reactFlowInstance?.screenToFlowPosition({
        //     x: evt.clientX,
        //     y: evt.clientY,
        //   });
        //   console.log('printLog', item, { clientX: evt.clientX, clientY: evt.clientY, screenX: evt.screenX, screenY: evt.screenY }, position, evt);
        // }
      }
      return { ...prev, [item]: func }
    }, {})
  }, [reactFlowInstance])
  const handlePaneClick = React.useCallback((evt: React.MouseEvent)=>{
    if (!value) {
      // 当前无节点处于编辑状态.
      return;
    }
    const position = reactFlowInstance?.screenToFlowPosition({
      x: evt.clientX,
      y: evt.clientY,
    });
    console.log('handlePaneClick', position);
    if (position) {
      if (value?.areaType === 'point') {
        onChange?.({...value, location: [position?.x, position?.y]})
      } else if (value?.areaType === 'circle') {
        // 两个点.
        if (!value?.location) {
          // 圆心不存在,先设置圆心.
          onChange?.({...value, location: [position?.x, position?.y]})
          return;
        }
        const location0 = value.location;
        const radius = Math.sqrt((location0[0]-position.x) * (location0[0]-position.x) + (location0[1]-position.y) * (location0[1]-position.y))
        onChange?.({...value, area: radius});
        return;
      } else if (value?.areaType === 'rectangle') {
        // 两个点.
        if (!value?.location) {
          // 第一个点不存在,先设置第一个.
          onChange?.({...value, location: [position?.x, position?.y]})
          return;
        }
        // 设置第二个点.
        onChange?.({...value, area: [position?.x, position?.y]})
        return;
      }
    }
  },[reactFlowInstance, value]);

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
      onNodeClick={onNodeClick}
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
      onPaneMouseMove={funcs?.['onPaneMouseMove']}
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
