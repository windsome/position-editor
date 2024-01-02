import React from 'react';
import ReactDOM from 'react-dom/client';

import FullEditor from './editor/FullEditor';

import './index.css';
import { PositionType } from './editor/types';
import { createPosition, removePosition, retrievePosition, updatePosition } from './editor/demoData';

async function save(record: Partial<PositionType>): Promise<PositionType> {
  if (record._id) {
    return await updatePosition(record._id, record);
  } else {
    return await createPosition(record);
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <FullEditor save={save} remove={removePosition} retrieve={retrievePosition}/>
  </React.StrictMode>
);
