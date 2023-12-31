export type Identifier = string | number;
export interface FullEditorProps {
  save: (record: any) => Promise<any>;
  retrieve: (query: any) => Promise<any>
}

// 点位结构
//  _id,name,parent,ancestor:[],nodeType:'structure/position',
// locationType:'gnss/xy',location:[],areaType:'circle/rectangle/polygon',area:[]
// tenant,customer,owner(创建者),createdAt,updatedAt.
export interface PositionType {
  name: string;
  parent?: Identifier;
  ancestor?: Identifier[];
  nodeType: 'structure' | 'position';
  locationType: 'gnss' | 'xyz';
  location: any;
  areaType?: 'polygon' | 'rectangle' | 'circle';
  area: any;
  [key: string]: any;
}

export interface RetrieveResult {
  total: number;
  items: PositionType[]
}
