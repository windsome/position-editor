import { useCallback } from 'react';
import { Handle, Position } from 'reactflow';
import './bg-node.css';

const handleStyle = { left: 10 };

function BgNode({ data, isConnectable }: any) {
  const { image, corners } = data?.bg || {};
  
  return (
    <div className="text-updater-node">
      <div>
        <label htmlFor="text">Text:</label>
        <input id="text" name="text" onChange={onChange} className="nodrag" />
      </div>
    </div>
  );
}

export default BgNode;
