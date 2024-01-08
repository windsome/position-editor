import L from "leaflet";
import newMarker from "./pin.png";

/// 原始地图.
// const center: L.LatLngExpression = [50.0595, 19.9379];
export const tileLayerOrig = {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
}

/// 天地图.
export const center: L.LatLngExpression = [31.22, 121.39];
export const tileLayer_TianDiTu_Normal_Map = {
    url: 'https://t{s}.tianditu.gov.cn/DataServer?T=vec_w&X={x}&Y={y}&L={z}&tk=d6f4af9510cc1bde9a1f6541150167b3',
    subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
}
export const tileLayer_TianDiTu_Normal_Annotion = {
    url: 'https://t{s}.tianditu.gov.cn/DataServer?T=cva_w&X={x}&Y={y}&L={z}&tk=d6f4af9510cc1bde9a1f6541150167b3',
    subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
}
export const tileLayer_TianDiTu_Satellite_Map = {
    url: 'https://t{s}.tianditu.gov.cn/DataServer?T=img_w&X={x}&Y={y}&L={z}&tk=d6f4af9510cc1bde9a1f6541150167b3',
    subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
}
export const tileLayer_TianDiTu_Satellite_Annotion = {
    url: 'https://t{s}.tianditu.gov.cn/DataServer?T=cia_w&X={x}&Y={y}&L={z}&tk=d6f4af9510cc1bde9a1f6541150167b3',
    subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
}
export const tileLayer_TianDiTu_Terrain_Map = {
    url: 'https://t{s}.tianditu.gov.cn/DataServer?T=ter_w&X={x}&Y={y}&L={z}&tk=d6f4af9510cc1bde9a1f6541150167b3',
    subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
}
export const tileLayer_TianDiTu_Terrain_Annotion = {
    url: 'https://t{s}.tianditu.gov.cn/DataServer?T=cta_w&X={x}&Y={y}&L={z}&tk=d6f4af9510cc1bde9a1f6541150167b3',
    subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
}

export const pointerIcon = new L.Icon({
    iconUrl: newMarker,
    iconSize: [50, 58], // size of the icon
    iconAnchor: [20, 58], // changed marker icon position
    popupAnchor: [0, -60], // changed popup position
});

