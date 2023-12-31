/**
 * 编辑器:用于在地球或者建筑节点上编辑子点位.
 * 
 * 数据结构:
 * + 点位表结构(position) {
 *   _id,name,parent,ancestor:[],nodeType:'structure/position',
 *   locationType:'gnss/xy',location:[],areaType:'circle/rectangle/polygon',area:[]
 *   tenant,customer,owner(创建者),createdAt,updatedAt.
 *  }
 * + 点位列表
 * + 当前操作所在节点(即当前parent节点),可能是地球(null)或建筑(structure)
 * 
 * 界面:
 * + 左边节点树(包含创建点位和建筑按钮,分不同形状(null无区域点/circle/rectangle/polygon))
 * + 右边属性框
 *   - 基本属性:名称,父节点,祖先列表,节点类型
 *   - 位置区域属性: 位置类型:gnss/xyz,位置,区域类型,区域
 *   - 扩展插件(面板):关联设备列表框,关联耗材框,可能耗材与设备关联,插件面板带入了各种函数,插件面板本身会带入当前点位信息.
 * + 底部信息框,用来显示操作提示等.
 * + 图表位,可以按广告位方式管理,一般将横向分成M份,纵向分成N份.位置:(0 ~ M-1)/(0 ~ N-1),传入额外参数为当前节点.
 * 
 * 业务逻辑:
 * + 得到第一级节点列表,即查询parent=null的节点列表
 * + 点中某一级的某个节点(不管是在哪一级),界面中parent都是其父节点.如果点中地球,则父节点还在地球,即null.
 * + 点中某个节点,如果是建筑节点,则需要获取其子节点列表,动态加载.
 * 
 * 组件实现:
 * + 属性: 节点保存函数(创建,更新),查找节点函数.
 * + 状态:
 *   - 父节点parent(当前操作节点),
 *   - 节点map(nodeMap)
 *   - 树状结构treeData:[{key(节点_id),title(节点名称name),isLeaf(是否为叶子节点position类型),children:[]},...]
 */
import * as React from 'react';
import LocationEditor from './LocationEditor';
import FlowEditor from './FlowEditor';
import { CSSProperties } from 'react';

import Tree from 'rc-tree';
import "rc-tree/assets/index.css"
import './tools.css';
import { FullEditorProps, Identifier, PositionType } from './types';

const wrapperStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  overflow: 'hidden',
  position: 'relative',
  zIndex: 0,
};

interface TreeItemType {
  key: Identifier;
  title: string;
  isLeaf?: boolean;
  children?: TreeItemType[];
}

function updateTree(tree: TreeItemType[] | undefined, key: Identifier, children: TreeItemType[]): TreeItemType[] | undefined {
  if (!tree) return tree;
  return tree?.map(item => {
    return {
      ...item,
      ...(item?.isLeaf ? {} : { children: updateTree(item?.children, key, children) })
    }
  });
}

function CreateTools() {
  return (
    <div>
      <div className='rc-tools-wrap'>
        <div>建筑：</div>
        <div className='rc-tools'>
          <div className='rc-tools-one-item rc-tools-marker' />
          <div className='rc-tools-split-vertical' />
          <div className='rc-tools-one-item rc-tools-polygon' />
          <div className='rc-tools-split-vertical' />
          <div className='rc-tools-one-item rc-tools-rectangle' />
          <div className='rc-tools-split-vertical' />
          <div className='rc-tools-one-item rc-tools-circle' />
        </div>
      </div>
      <div className='rc-tools-wrap'>
        <div>点位：</div>
        <div className='rc-tools'>
          <div className='rc-tools-one-item rc-tools-marker' />
          <div className='rc-tools-split-vertical' />
          <div className='rc-tools-one-item rc-tools-polygon' />
          <div className='rc-tools-split-vertical' />
          <div className='rc-tools-one-item rc-tools-rectangle' />
          <div className='rc-tools-split-vertical' />
          <div className='rc-tools-one-item rc-tools-circle' />
        </div>
      </div>
    </div>
  )
}

interface PropertyPanelProps {
  value?: Partial<PositionType>;
  onChange?: (value: Partial<PositionType>) => void;
  onSubmit?: (value: Partial<PositionType>) => void;
  onRemove?: (value: Partial<PositionType>) => void;
}
function PropertyPanel({ value, onChange, onSubmit, onRemove }: PropertyPanelProps) {
  const handleChangeField = (fieldName: string) => {
    return (fieldValue: any) => {
      if (onChange && value) {
        const nValue: Partial<PositionType> = { ...value, [fieldName]: fieldValue }
        onChange(nValue);
      }
    }
  }
  if (!value) return <div>未选中节点</div>
  return (
    <div>
      <div>
        <h3>基本信息</h3>
        <div>
          名称:
          <input value={value.name} onChange={handleChangeField('name')} />
        </div>
        <div>
          父节点:
          <span>{value.parent}</span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'row' }}>
        <button style={{ flex: 1 }} onClick={onSubmit}>保存</button>
        <button style={{ width: 60 }} onClick={onRemove}>删除</button>
      </div>
    </div>
  )
}

export default function FullEditor(props: FullEditorProps) {
  const { save, retrieve } = props;
  const [parent, setParent] = React.useState<Identifier | undefined>(undefined);
  const [current, setCurrent] = React.useState<Partial<PositionType> | undefined>(undefined);
  const [nodeMap, setNodeMap] = React.useState<{ [key: Identifier]: any }>({});
  const [treeData, setTreeData] = React.useState<TreeItemType[]>([]);

  const handleSelect = React.useCallback((info: any) => {
    console.log('selected', info);
  }, []);

  const handleCheck = React.useCallback((checkedKeys: any) => {
    console.log('handleCheck', checkedKeys);
    const key1 = checkedKeys && checkedKeys[0];
    const node = nodeMap[key1];
    setCurrent(node);
  }, [nodeMap]);

  const handleLoadChildren = React.useCallback((treeNode: any) => {
    console.log('load data...', treeNode);
    return new Promise(resolve => {
      setTimeout(() => {
        retrieve(treeNode).then((result) => {
          const nodeMap1 = result.reduce((prev: any, item: any) => {
            return { ...prev, [item._id]: item };
          }, {});
          setNodeMap((state: any) => ({ ...state, ...nodeMap1 }));
          const children = result.map((item: any) => {
            return { key: item._id, title: item.name, isLeaf: item.nodeType === 'position' }
          });
          setTreeData(state => updateTree(state, treeNode.key, children) || []);
          resolve(true);
        });
      }, 500);
    });
  }, []);

  const handleChangeCurrent = React.useCallback((value: Partial<PositionType>) => {
    setCurrent(state => ({ ...state, ...value }))
  }, []);
  const handleSavePosition = React.useCallback((value: Partial<PositionType>) => {
    save(value);
  }, []);
  return (
    <div style={{ ...wrapperStyle }}>
      {!parent ? <LocationEditor /> : <FlowEditor />}
      <aside className='rc-aside-panel'>
        <div className='rc-panel-title'>添加节点</div>
        <div><CreateTools /></div>
        <div className='rc-panel-title'>点位节点树</div>
        <Tree
          onSelect={handleSelect}
          checkable={false}
          onCheck={handleCheck}
          checkedKeys={current?._id}
          loadData={handleLoadChildren}
          treeData={treeData}
        />
      </aside>
      <div className='rc-property-panel'>
        <PropertyPanel value={current} onChange={handleChangeCurrent} onSubmit={handleSavePosition} />
      </div>
    </div>
  )
}
