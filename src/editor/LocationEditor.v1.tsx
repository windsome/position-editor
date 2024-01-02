import {
  MapContainer,
  TileLayer,
  ImageOverlay,
  Marker,
  useMap,
  Popup,
} from "react-leaflet";
import { useState, useEffect } from "react";
import L from "leaflet";
import newMarker from "./pin.png";
import isEmpty from 'lodash/isEmpty';
import "leaflet/dist/leaflet.css";
import "./location.editor.css";
// import tileLayer from "../util/tileLayer";

const center: L.LatLngExpression = [50.0595, 19.9379];
const tileLayer = {
  attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
  url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
}

const pointerIcon = new L.Icon({
  iconUrl: newMarker,
  iconSize: [50, 58], // size of the icon
  iconAnchor: [20, 58], // changed marker icon position
  popupAnchor: [0, -60], // changed popup position
});

const customPopup = (
  <div className="customPopup">
    <figure>
      <img
        src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/A-10_Sukiennice_w_Krakowie_Krak%C3%B3w%2C_Rynek_G%C5%82%C3%B3wny_MM.jpg/1920px-A-10_Sukiennice_w_Krakowie_Krak%C3%B3w%2C_Rynek_G%C5%82%C3%B3wny_MM.jpg"
        alt="Kraków"
        width="100%"
      />
      <figcaption>Source: wikipedia.org</figcaption>
    </figure>
    <div>
      Kraków,[a] also written in English as Krakow and traditionally known as
      Cracow, is the second-largest and one of the oldest cities in Poland.
      Situated on the Vistula River in Lesser Poland Voivodeship...{" "}
      <a
        href="https://en.wikipedia.org/wiki/Krak%C3%B3w"
        target="_blank"
        rel="noreferrer"
      >
        → show more
      </a>
    </div>
  </div>
);

// image
const imageUrl =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Krakow_Center_-_basic_map.svg/1440px-Krakow_Center_-_basic_map.svg.png";

// add image to map ;)
const imageBounds: L.LatLngBoundsExpression = [
  [50.0665, 19.93],
  [50.0522, 19.9455],
];

const OverlayImage = () => {
  const map = useMap();

  map.fitBounds(imageBounds);

  return (
    <div style={{ border: '10px solid #ccc' }}>
      <ImageOverlay
        url={imageUrl}
        // fitBounds={true}
        bounds={imageBounds}
        opacity={1}
      />
    </div>
  );
};

const MyMarkers = ({ map }) => {
  const [currentCampus, setCurrentCampus] = useState<any>({});
  const [marker, setMarker] = useState([])
  const [legend, setLegend] = useState()

  useEffect(() => {
    if (!map) return;
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      console.log('click', lat, lng);
      setCurrentCampus(old => {
        // 一个时刻只有一个处于编辑状态. 后续的点击不添加新园区.
        if (isEmpty(old)) return { pos: [lat, lng] }
        return old;
      })

    })

  }, [map]);
  const removeCampus = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentCampus({});
  }

  console.log('marker', currentCampus.pos)
  return currentCampus?.pos?.length > 0 ? (
    <Marker
      position={currentCampus?.pos}
      draggable={true}
      eventHandlers={{
        moveend(e) {
          const { lat, lng } = e.target.getLatLng();
          setCurrentCampus(old => {
            // 一个时刻只有一个处于编辑状态. 后续的点击不添加新园区.
            console.log('moveend', lat, lng);
            return { ...old, pos: [lat, lng] }
          })
        }
      }}
    >
      <Popup keepInView={true}>
        <button onClick={removeCampus}>delete marker 💔</button>
      </Popup>
    </Marker>
  )
    : null
}

const LocationEditor = () => {
  const [map, setMap] = useState<any>(null);

  return (
    <div className="leaflet-wrapper">
      <MapContainer
        // ref={setMap}
        // @ts-ignore
        whenReady={setMap}
        center={center}
        zoom={15}
        scrollWheelZoom={true}
      >
        <TileLayer {...tileLayer} />

        <Marker
          icon={pointerIcon}
          position={center}
          eventHandlers={{
            click: (e) => {
              map.setView(e.target.getLatLng(), 15);
            },
          }}
        >
          <Popup keepInView={true} minWidth={220}>
            {customPopup}
          </Popup>
        </Marker>

        <OverlayImage />
        <MyMarkers map={map} />

      </MapContainer>
    </div>
  );
};

export default LocationEditor;
