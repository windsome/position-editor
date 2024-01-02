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
import { AreaType, FullEditorProps, Identifier, NodeType, PositionType, TreeItemType, addTreeItem, delTreeItem, updateTreeChildren } from './types';

const wrapperStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  overflow: 'hidden',
  position: 'relative',
  zIndex: 0,
};


interface ToolPanelProps {
  onSelect: (value?: { nodeType: NodeType; areaType: AreaType }) => void;
}

function CreateTools({ onSelect }: ToolPanelProps) {

  return (
    <div>
      <div className='rc-tools-wrap'>
        <div>建筑：</div>
        <div className='rc-tools'>
          <div className='rc-tools-one-item rc-tools-marker' onClick={() => onSelect({ nodeType: 'structure', areaType: 'point' })} />
          <div className='rc-tools-split-vertical' />
          <div className='rc-tools-one-item rc-tools-polygon' onClick={() => onSelect({ nodeType: 'structure', areaType: 'polygon' })} />
          <div className='rc-tools-split-vertical' />
          <div className='rc-tools-one-item rc-tools-rectangle' onClick={() => onSelect({ nodeType: 'structure', areaType: 'rectangle' })} />
          <div className='rc-tools-split-vertical' />
          <div className='rc-tools-one-item rc-tools-circle' onClick={() => onSelect({ nodeType: 'structure', areaType: 'circle' })} />
        </div>
      </div>
      <div className='rc-tools-wrap'>
        <div>点位：</div>
        <div className='rc-tools'>
          <div className='rc-tools-one-item rc-tools-marker' onClick={() => onSelect({ nodeType: 'position', areaType: 'point' })} />
          <div className='rc-tools-split-vertical' />
          <div className='rc-tools-one-item rc-tools-polygon' onClick={() => onSelect({ nodeType: 'position', areaType: 'polygon' })} />
          <div className='rc-tools-split-vertical' />
          <div className='rc-tools-one-item rc-tools-rectangle' onClick={() => onSelect({ nodeType: 'position', areaType: 'rectangle' })} />
          <div className='rc-tools-split-vertical' />
          <div className='rc-tools-one-item rc-tools-circle' onClick={() => onSelect({ nodeType: 'position', areaType: 'circle' })} />
        </div>
      </div>
    </div>
  )
}

interface PropertyPanelProps {
  value?: Partial<PositionType>;
  onChange?: (value: Partial<PositionType>) => void;
  onChangeParent?: (_id: Identifier) => void;
  onSubmit?: (value: Partial<PositionType>) => void;
  onRemove?: (_id?: Identifier) => void;
}
function PropertyPanel({ value, onChange, onChangeParent, onSubmit, onRemove }: PropertyPanelProps) {
  const handleChangeField = (fieldName: string) => {
    return (evt: any) => {
      if (onChange && value) {
        const nValue: Partial<PositionType> = { ...value, [fieldName]: evt.target.value }
        onChange(nValue);
      }
    }
  }

  if (!value) return <div>未选中节点</div>
  return (
    <div>
      <div>
        <h3>基本信息</h3>
        {(value._id && value.nodeType === 'structure') ? (
          <div style={{ color: 'blue' }} onClick={() => onChangeParent?.(value._id)}>切换进入编辑该节点的子节点</div>
        ) : null}
        <div>
          <span>_id:</span>
          <span>{value._id}</span>
        </div>
        <div>
          <span>节点类型:</span>
          <span>{value.nodeType}</span>
        </div>
        <div>
          <span>名称:</span>
          <input value={value.name} onChange={handleChangeField('name')} />
        </div>
        <div>
          <span>父节点:</span>
          <span>{value.parent}</span>
        </div>
        <div>
          <span>上级节点: </span>
          {value.ancestor?.map(item => (<p>{item}</p>))}
        </div>
      </div>
      <div>
        <h3>位置与区域</h3>
        <div>
          <span>位置类型:</span>
          <span>{value.locationType}</span>
        </div>
        <div>
          <span>位置:</span>
          <span>{value.location && value.location[0]}</span>
          <span>X</span>
          <span>{value.location && value.location[1]}</span>
        </div>
        <div>
          <span>区域类型:</span>
          <span>{value.areaType}</span>
        </div>
        <div>
          <span>区域: </span>
          <span>{JSON.stringify(value.area)}</span>
        </div>
      </div>
      <div>
        <h3>背景</h3>
        <div>
          <span>图片:</span>
          <input value={value.bg?.image} type='file' onChange={handleChangeField('bg.image')} />
        </div>
        <div>
          <div>四顶点位置:</div>
          <div>
            <span>{value.bg?.bounds?.[0]?.[0]}</span>
            <span>X</span>
            <span>{value.bg?.bounds?.[0]?.[1]}</span>
          </div>
          <div>
            <span>{value.bg?.bounds?.[1]?.[0]}</span>
            <span>X</span>
            <span>{value.bg?.bounds?.[1]?.[1]}</span>
          </div>
          <div>
            <span>{value.bg?.bounds?.[2]?.[0]}</span>
            <span>X</span>
            <span>{value.bg?.bounds?.[2]?.[1]}</span>
          </div>
          <div>
            <span>{value.bg?.bounds?.[3]?.[0]}</span>
            <span>X</span>
            <span>{value.bg?.bounds?.[3]?.[1]}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'row' }}>
        <button style={{ flex: 1 }} onClick={() => onSubmit?.(value)}>保存</button>
        <button style={{ width: 60 }} onClick={() => onRemove?.(value?._id)}>删除</button>
      </div>
    </div>
  )
}

interface FullEditorState {
  parent?: Identifier;
  current?: Partial<PositionType>;
  nodeMap: { [key: Identifier]: PositionType };
  treeData: TreeItemType[];
}
export default function FullEditor(props: FullEditorProps) {
  const { save, remove, retrieve } = props;
  const [state, setState] = React.useState<FullEditorState>({
    nodeMap: {},
    treeData: [],
  })
  // const { current: treeDataWithEarth } = React.useRef<TreeItemType[]>([{
  //   key: 'earth',
  //   title: '地球',
  //   expanded: true,
  //   isLeaf: false,
  // }]);
  // React.useEffect(()=>{
  //   treeDataWithEarth[0].children = state.treeData;
  // },[state.treeData]);

  const handleSelect = React.useCallback((info: any) => {
    console.log('selected 当前节点', info);
    const key1 = info && info[0];
    setState(state => {
      const current = state.nodeMap[key1];
      const parentId = current?.parent;
      return { ...state, parent: parentId, current }
    })
  }, []);

  const handleCheck = React.useCallback((checkedKeys: any) => {
    console.log('handleCheck', checkedKeys);
    const key1 = checkedKeys && checkedKeys[0];
    setState(state => {
      const node = state.nodeMap[key1];
      return { ...state, current: node }
    })
  }, []);

  const handleLoadChildren = React.useCallback(async (treeNode: any) => {
    const qopts = (treeNode.key === 'earth') ? { where: { parent: null } } : { where: { parent: treeNode.key } };
    const result = await retrieve(qopts);
    console.log('load data...', treeNode, result);
    setState(state => {
      const nodeMap1 = result.items.reduce((prev: any, item: any) => {
        return { ...prev, [item._id]: item };
      }, {});
      const children = result.items.map((item_1: any) => {
        return { key: item_1._id, title: item_1.name, isLeaf: item_1.nodeType === 'position' };
      });

      const nTreeData = updateTreeChildren(state.treeData, treeNode.key, children) || []
      // treeDataWithEarth[0].children = nTreeData;
      return { ...state, nodeMap: { ...state.nodeMap, ...nodeMap1 }, treeData: nTreeData };
    });
  }, []);

  const handleChangeCurrent = React.useCallback((value: Partial<PositionType>) => {
    console.log('handleChangeCurrent', value);
    setState(state => ({ ...state, current: value }))
  }, []);
  const handleChangeParent = React.useCallback((_id: Identifier) => {
    console.log('handleChangeParent', _id);
    setState(state => {
      return { ...state, parent: _id, current: undefined }
    });
  }, []);
  const handleSavePosition = React.useCallback((value: Partial<PositionType>) => {
    console.log('handleSavePosition', value);
    save(value).then((record: PositionType) => {
      setState(state => {
        const nTreeData = addTreeItem(state.treeData, record.parent, { key: record._id, title: record.name, isLeaf: record.nodeType === 'position' }) || [];
        // treeDataWithEarth[0].children = nTreeData;
        return { ...state, current: record, nodeMap: { ...(state.nodeMap || {}), [record._id]: record }, treeData: nTreeData };
      })
    });
  }, []);
  const handleRemovePosition = React.useCallback(async (_id?: Identifier) => {
    console.log('handleRemovePosition', _id);
    if (_id) {
      await remove(_id);
      setState(state => {
        const nTreeData = delTreeItem(state.treeData, _id) || [];
        return { ...state, current: undefined, treeData: nTreeData };
      })
    } else {
      setState(state => {
        return { ...state, current: undefined };
      })
    }
  }, []);

  const parent = state.parent;
  const parentItem = parent ? state.nodeMap[parent] : undefined;
  let currentAncestor = parentItem?.ancestor || [];
  if (parent) currentAncestor = [...currentAncestor, parent];
  const locationType = !parent ? 'gnss' : 'xyz'; // 顶层节点是gnss.

  const handleSelectTool = React.useCallback((value?: { nodeType: NodeType; areaType: AreaType }) => {
    if (value) {
      setState(state => {
        return {
          ...state, current: {
            name: value.nodeType === 'structure' ? '新建筑' : '新节点',
            parent,
            ancestor: currentAncestor,
            nodeType: value.nodeType,
            locationType,
            areaType: value.areaType,
          }
        }
      });
    }
  }, [currentAncestor, parent, locationType]);

  const treeDataWithEarth2 = [{
    key: 'earth',
    title: '地球',
    expanded: true,
    isLeaf: false,
    children: state.treeData,
  }];
  console.log('FullEditor', state, currentAncestor);
  return (
    <div style={{ ...wrapperStyle }}>
      {!parent ? <LocationEditor dbNodeMap={state.nodeMap} dbNodeTree={state.treeData} parent={parentItem} value={state.current} onChange={handleChangeCurrent} /> : <FlowEditor />}
      <aside className='rc-aside-panel'>
        <div className='rc-panel-title'>添加节点</div>
        <div><CreateTools onSelect={handleSelectTool} /></div>
        <div className='rc-panel-title'>点位节点树</div>
        <Tree
          onSelect={handleSelect}
          checkable={false}
          onCheck={handleCheck}
          checkedKeys={state.current?._id}
          loadData={handleLoadChildren}
          treeData={treeDataWithEarth2}
        />
      </aside>
      <div className='rc-property-panel'>
        <PropertyPanel value={state.current} onChange={handleChangeCurrent} onChangeParent={handleChangeParent} onSubmit={handleSavePosition} onRemove={handleRemovePosition} />
      </div>
    </div>
  )
}
