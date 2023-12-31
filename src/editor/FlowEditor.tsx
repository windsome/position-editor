import { MouseEvent, DragEvent, useState } from 'react';
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

const onNodeDrag = (_: MouseEvent, node: Node) => console.log('drag', node);
const onNodeDragStop = (_: MouseEvent, node: Node) => console.log('drag stop', node);
const onNodeClick = (_: MouseEvent, node: Node) => console.log('click', node);

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'input',
    data: { label: 'Node 1' },
    position: { x: 250, y: 5 },
    className: 'light',
  },
  {
    id: '2',
    data: { label: 'Node 2' },
    position: { x: 100, y: 100 },
    className: 'light',
  },
  {
    id: '3',
    data: { label: 'Node 3' },
    position: { x: 400, y: 100 },
    className: 'light',
  },
  {
    id: '4',
    data: { label: 'Node 4' },
    position: { x: 400, y: 200 },
    className: 'light',
    connectable: false,
  },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true },
  { id: 'e1-3', source: '1', target: '3' },
];

const defaultEdgeOptions = {};

const onDragOver = (event: DragEvent) => {
  event.preventDefault();
  if (event.dataTransfer)
    event.dataTransfer.dropEffect = 'move';
};

let id = 0;
const getId = () => `dndnode_${id++}`;


const BasicFlow = () => {
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance>();
  const instance = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);

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

  const onDrop = (event: DragEvent) => {
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

      setNodes((nds) => nds.concat(newNode));
    }
  };


  return (
    <ReactFlow
      defaultNodes={initialNodes}
      defaultEdges={initialEdges}
      onNodeClick={onNodeClick}
      onNodeDragStop={onNodeDragStop}
      onNodeDrag={onNodeDrag}
      nodes={nodes}
      onNodesChange={onNodesChange}
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
    >
      <Background variant={BackgroundVariant.Dots} />
      <MiniMap />
      <Controls />

      <Panel position="top-right">
        <button onClick={resetTransform}>reset transform</button>
        <button onClick={updatePos}>change pos</button>
        <button onClick={toggleClassnames}>toggle classnames</button>
        <button onClick={logToObject}>toObject</button>
      </Panel>
    </ReactFlow>
  );
};

export default function FlowEditor() {
  return (
    <ReactFlowProvider>
      <BasicFlow />
      <Sidebar />
    </ReactFlowProvider>
  );
}
