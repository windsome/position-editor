import * as React from 'react';
import SortableTree, {  changeNodeAtPath } from 'react-sortable-tree';

import styles from './tree.module.css';
import 'react-sortable-tree/style.css';

const initTreeData = [
    {
      name: '地球',
      expanded: true,
      children: [
        { name: '园区1' },
        { name: '园区2' },
      ],
    },
  ];
const getNodeKey = ({ treeIndex }) => treeIndex;
const StructureTree = () => {
  const [treeData, setTreeData] = React.useState(initTreeData);
  return (
    <aside className={styles.aside}>
              <div style={{ height: 300 }}>
          <SortableTree
            treeData={treeData}
            canDrag={false}
            onChange={setTreeData}
            generateNodeProps={({ node, path }) => ({
              title: (
                <input
                  style={{ fontSize: '1.1rem' }}
                  value={node.name}
                  onChange={event => {
                    const name = event.target.value;

                    setTreeData(treeData => (changeNodeAtPath({
                        treeData: treeData,
                        path,
                        getNodeKey,
                        newNode: { ...node, name },
                      })));
                  }}
                />
              ),
            })}
          />
        </div>
    </aside>
  );
};

export default StructureTree;
