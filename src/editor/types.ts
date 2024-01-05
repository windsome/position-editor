export type Identifier = string | number;
export interface FullEditorProps {
  save: (record: any) => Promise<any>;
  remove: (_id: Identifier) => Promise<any>;
  retrieve: (query: any) => Promise<any>
}

// 点位结构
//  _id,name,parent,ancestor:[],nodeType:'structure/position',
// locationType:'gnss/xy',location:[],areaType:'circle/rectangle/polygon',area:[]
// tenant,customer,owner(创建者),createdAt,updatedAt.
export type NodeType = 'structure' | 'position';
export type AreaType = 'polygon' | 'rectangle' | 'circle' | 'point';
export type Locationype = 'gnss' | 'xyz';
export interface BgType {
  image?: string; // 背景图片路径
  style?: any; // 背景样式
  bounds?: any[]; // 背景图片4个定点对应转换后的点.用来进行matrix3d变换.
  corners?: any[];
  [key: string]: any;
}
// type ToolType = AreaType | 'point';
export interface PositionType {
  name: string;
  parent?: Identifier;
  ancestor?: Identifier[];
  nodeType: NodeType;
  locationType: Locationype;
  location: any;
  areaType?: AreaType;
  area?: any;
  bg?: BgType;
  [key: string]: any;
}

export interface RetrieveResult {
  total: number;
  items: PositionType[]
}

export interface TreeItemType {
  key: Identifier;
  title: string;
  expanded?: boolean;
  isLeaf?: boolean;
  children?: TreeItemType[];
}

export interface InnerEditorProps {
  // mode?: 'edit' | 'create' | 'view';
  maxLevel?: number;
  dbNodeMap: { [key: Identifier]: PositionType };
  dbNodeTree: TreeItemType[];
  parent?: Partial<PositionType> | PositionType; // 在该父节点下编辑所有子孙节点.
  value?: Partial<PositionType> | PositionType;
  onChange?: (value: Partial<PositionType>) => void;
}
