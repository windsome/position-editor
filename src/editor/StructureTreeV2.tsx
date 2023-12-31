import * as React from 'react';
import Tree from 'rc-tree';

import styles from './tree.module.css';
import "rc-tree/assets/index.css"

const initTreeData = [
    {
      key: 'earth',
      title: '地球',
      expanded: true,
      children: [
        { key: '0-1', title: '园区1' },
        { key: '0-2', title: '园区2' },
      ],
    },
  ];
const getNodeKey = ({ treeIndex }) => treeIndex;
function generateTreeNodes(treeNode) {
  const arr = [];
  const key = treeNode.props.eventKey;
  for (let i = 0; i < 3; i += 1) {
    arr.push({ title: `leaf ${key}-${i}`, key: `${key}-${i}` });
  }
  return arr;
}
function setLeaf(treeData, curKey, level) {
  const loopLeaf = (data, lev) => {
    const l = lev - 1;
    data.forEach(item => {
      if (
        item.key.length > curKey.length
          ? item.key.indexOf(curKey) !== 0
          : curKey.indexOf(item.key) !== 0
      ) {
        return;
      }
      if (item.children) {
        loopLeaf(item.children, l);
      } else if (l < 1) {
         
        item.isLeaf = true;
      }
    });
  };
  loopLeaf(treeData, level + 1);
}
function getNewTreeData(treeData, curKey, child, level) {
  const loop = data => {
    if (level < 1 || curKey.length - 3 > level * 2) return;
    data.forEach(item => {
      if (curKey.indexOf(item.key) === 0) {
        if (item.children) {
          loop(item.children);
        } else {
           
          item.children = child;
        }
      }
    });
  };
  loop(treeData);
  setLeaf(treeData, curKey, level);
}

const StructureTree = () => {
  const [treeData, setTreeData] = React.useState(initTreeData);
  const [checkedKeys, setCheckedKeys] = React.useState([]);
  const onSelect = React.useCallback(info => {
    console.log('selected', info);
  },[]);

  const onCheck = React.useCallback(checkedKeys => {
    console.log(checkedKeys);
    setCheckedKeys(checkedKeys);
  },[]);

  const onLoadData = React.useCallback(treeNode => {
    console.log('load data...');
    return new Promise(resolve => {
      setTimeout(() => {
        setTreeData((treeData) => {
          const treeData2 = [...treeData];
          getNewTreeData(treeData2, treeNode.props.eventKey, generateTreeNodes(treeNode), 2);
          return treeData2
        });
        resolve(true);
      }, 500);
    });
  },[]);

  return (
    <aside className={styles.aside}>
        <h2>dynamic render</h2>
        <Tree
          onSelect={onSelect}
          checkable={false}
          onCheck={onCheck}
          checkedKeys={checkedKeys}
          loadData={onLoadData}
          treeData={treeData}
        />
    </aside>
  );
};

export default StructureTree;
