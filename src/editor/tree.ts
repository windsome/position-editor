import { Identifier, TreeItemType } from "./types";

export function findChildrenIdsByParentId(tree: TreeItemType[] | undefined, parentKey: Identifier | undefined | null): Identifier[] | undefined {
  if (!parentKey) {
    // key为null或undefined表示获取顶级子节点,即当前列表.
    if (!tree || tree.length === 0) return [];
    return tree.map(item => item.key);
  }
  // parentKey不为空,表示当前不是在根级(即地球上)
  if (!tree || tree.length === 0) return undefined;
  for (let i = 0; i < tree.length; i++) {
    const item = tree[i];
    if (item.key === parentKey) {
      // 找到父节点.
      if (item.children && item.children.length > 0) {
        return item.children.map(item1 => item1.key);
      } else {
        return [];
      }
    } else {
      // 未找到父节点,继续递归遍历子节点
      const result1 = findChildrenIdsByParentId(item.children, parentKey);
      if (!result1) continue;
      else return result1;
    }
  }
}
export function updateTreeChildren(tree: TreeItemType[] | undefined, parentId: Identifier | undefined, children: TreeItemType[]): TreeItemType[] | undefined {
  if (!tree) return tree;
  return tree?.map(item => {
    return {
      ...item,
      ...(item?.isLeaf ? {} : { children: updateTreeChildren(item?.children, parentId, children) })
    }
  });
}
export function addTreeItem(tree: TreeItemType[] | undefined, parentKey: Identifier | undefined, child: TreeItemType): TreeItemType[] | undefined {
  if (!parentKey) {
    let hasFound = false;
    const updated = tree?.reduce((prev: TreeItemType[], item1)=>{
      if (item1.key === child.key) {
        hasFound = true;
        return [...prev, child];
      }
      return [...prev, item1];
    }, []) || [];
    return hasFound ? updated : [...updated, child];
    // return [...(tree || []),child]; // 父节点为空,则直接加在当前树.
  }
  // parentKey不为空,表示当前不是在根级(即在建筑上)
  if (!tree || tree.length === 0) return undefined;
  const nTree: TreeItemType[] = [];
  for (let i = 0; i < tree.length; i++) {
    const item = tree[i];
    if (item.key === parentKey) {
      // 找到父节点.插入子节点
      let hasFound = false;
      const updated = item.children?.reduce((prev: TreeItemType[], item1)=>{
        if (item1.key === child.key) {
          hasFound = true;
          return [...prev, child];
        }
        return [...prev, item1];
      }, []) || [];
      const children = hasFound ? updated : [...updated, child];
      nTree.push({ ...item, children });
    } else {
      // 未找到父节点,继续递归遍历子节点
      const children = addTreeItem(item.children, parentKey, child);
      nTree.push({ ...item, children });
    }
  }
  return nTree;
}
export function delTreeItem(tree: TreeItemType[] | undefined, key: Identifier | undefined): TreeItemType[] | undefined {
  if (!key) {
    // key不存在,不用删.
    return tree;
  }
  // tree为空,不用删,直接返回.
  if (!tree || tree.length === 0) return undefined;
  const nTree: TreeItemType[] = [];
  for (let i = 0; i < tree.length; i++) {
    const item = tree[i];
    if (item.key === key) {
      // 找到该节点.删除所有自该节点后所有子节点(所有子孙节点都在children下面),即直接删除该节点即可.
    } else {
      // 未找到父节点,继续递归遍历子节点
      const children = delTreeItem(item.children, key);
      nTree.push({ ...item, children });
    }
  }
  return nTree;
}
