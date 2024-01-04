# 点位编辑器
从地球开始的建筑结构树的编辑,包含了点,圆,矩形,多边形,及背景图的编辑.
编辑器分成两个部分,当在地球一级时,用leaflet地图编辑器进行点位编辑, 当在建筑层级时,使用reactflow进行节点编辑.

## 参考
地图编辑器: 
+ leaflet, react-leaflet, <https://tomickigrzegorz.github.io/react-leaflet-examples/#/add-move-and-delete-marker>,<https://github.com/tomickigrzegorz/react-leaflet-examples>
+ Leaflet.draw, react-leaflet-draw, svg编辑 <https://leaflet.github.io/Leaflet.draw/docs/examples/full.html>
+ react-designer 
+ svg编辑 <https://github.com/geoman-io/leaflet-geoman>, <https://www.geoman.io/demo>
+ Leaflet.DistortableImage, 图片转换

xyflow编辑器:

组态:
[FUXA组态](https://frangoteam.github.io/)
[svg实现图形编辑器系列一：精灵系统](https://juejin.cn/post/7210539669204566077)(https://alanyf.gitee.io/monorepo/graphic-editor/#/)

## 设计
编辑器:用于在地球或者建筑节点上编辑子点位.

数据结构:
+ 点位表结构(position) {
  _id,name,parent,ancestor:[],nodeType:'structure/position',
  locationType:'gnss/xy',location:[],areaType:'circle/rectangle/polygon',area:[]
  tenant,customer,owner(创建者),createdAt,updatedAt.
 }
+ 点位列表
+ 当前操作所在节点(即当前parent节点),可能是地球(null)或建筑(structure)

界面:
+ 左边节点树(包含创建点位和建筑按钮,分不同形状(null无区域点/circle/rectangle/polygon))
+ 右边属性框
  - 基本属性:名称,父节点,祖先列表,节点类型
  - 位置区域属性: 位置类型:gnss/xyz,位置,区域类型,区域
  - 扩展插件(面板):关联设备列表框,关联耗材框,可能耗材与设备关联,插件面板带入了各种函数,插件面板本身会带入当前点位信息.
+ 底部信息框,用来显示操作提示等.
+ 图表位,可以按广告位方式管理,一般将横向分成M份,纵向分成N份.位置:(0 ~ M-1)/(0 ~ N-1),传入额外参数为当前节点.

业务逻辑:
+ 得到第一级节点列表,即查询parent=null的节点列表
+ 点中某一级的某个节点(不管是在哪一级),界面中parent都是其父节点.如果点中地球,则父节点还在地球,即null.
+ 点中某个节点,如果是建筑节点,则需要获取其子节点列表,动态加载.

组件实现:
+ 属性: 节点保存函数(创建,更新),查找节点函数.
+ 状态:
  - 父节点parent(当前操作节点),
  - 节点map(nodeMap)
  - 树状结构treeData:[{key(节点_id),title(节点名称name),isLeaf(是否为叶子节点position类型),children:[]},...]

## leaflet使用天地图
申请天地图key<http://lbs.tianditu.gov.cn/server/MapService.html>

可以参考<https://github.com/htoooth/Leaflet.ChineseTmsProviders/blob/master/src/leaflet.ChineseTmsProviders.js>得到天地图的配置.

## 测试

```sh
yarn
yarn dev
```
## 问题
1. leaflet-distortableimage卸载时报错,`Uncaught TypeError: Cannot read properties of null (reading 'off')`
见<https://github.com/publiclab/Leaflet.DistortableImage/issues/1391>,修改EditHandle.