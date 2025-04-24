import '@geoman-io/leaflet-geoman-free'; // side-effect: register map.pm
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import 'leaflet/dist/leaflet.css';

import { GeoJSON, LayersControl, MapContainer, ScaleControl, TileLayer } from 'react-leaflet';
import GeomanControl from './GeomanControl';
const { BaseLayer, Overlay } = LayersControl;

interface MapViewProps {
    geojsonData: any[];
}

const MapView: React.FC<MapViewProps> = ({ geojsonData }) => {
    const center: [number, number] = [1.0, 104.521117];
    const zoom = 11;

    const formattedGeojson: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: geojsonData.map((item) => ({
            type: 'Feature',
            geometry: item.geojson.geometry,
            properties: {
                ...item.geojson.properties,
                id_geojson: item.id_geojson,
            },
        })),
    };

    const onEachFeature = (feature: any, layer: any) => {
        if (!feature.properties) return;

        let html = '<div>';
        Object.entries(feature.properties).forEach(([k, v]) => {
            if (k === 'id_geojson') return; // skip showing the id itself
            html += `<p><strong>${k}:</strong> ${v}</p>`;
        });
        html += `
          <div style="text-align:right; margin-top:8px;">
          <hr/>
            <a 
              href="/dashboard/geojson/${feature.properties.id_geojson}/edit"
             class="inline-block rounded bg-white-600 px-2 py-1 text-white hover:bg-white-700"

              target="_blank"
            >
              Edit
            </a>
          </div>
        `;
        html += '</div>';

        layer.bindPopup(html, {
            maxWidth: 240,
        });
    };

    return (
        <div className="relative z-0 h-[500px] w-full" style={{ height: '500px', width: '100%' }}>
            <MapContainer center={center} zoom={zoom} scrollWheelZoom={false} style={{ height: '100vh', width: '100%' }}>
                {/* Scale Bar */}
                <ScaleControl position="bottomleft" />
                <GeomanControl  />
                {/* Layer Switcher */}
                <LayersControl position="topright">
                    {/* Base Layers */}
                    <BaseLayer checked name="Esri Satellite">
                        <TileLayer
                            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                            attribution="Tiles &copy; Esri — Source: Esri, USDA, USGS"
                        />
                    </BaseLayer>

                    <BaseLayer name="OSM Standard">
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
                    </BaseLayer>

                    <BaseLayer name="Stamen Toner">
                        <TileLayer
                            url="https://tiles.stadiamaps.com/tiles/stamen_toner/{z}/{x}/{y}{r}.png"
                            attribution={`
    &copy; <a href="https://stadiamaps.com/" target="_blank">Stadia Maps</a> 
    &copy; <a href="https://stamen.com/" target="_blank">Stamen Design</a> 
    &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> 
    &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>
    `}
                        />
                    </BaseLayer>

                    <BaseLayer name="Stamen Terrain">
                        <TileLayer
                            url="https://tiles.stadiamaps.com/tiles/stamen_terrain/{z}/{x}/{y}{r}.png"
                            maxZoom={20}
                            attribution={`
    &copy; <a href="https://stadiamaps.com/" target="_blank">Stadia Maps</a>
    &copy; <a href="https://stamen.com/" target="_blank">Stamen Design</a>
    &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a>
    &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>
  `}
                        />
                    </BaseLayer>

                    <BaseLayer name="Carto Positron">
                        <TileLayer
                            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                            attribution="&copy; CARTO &copy; OpenStreetMap"
                        />
                    </BaseLayer>

                    <BaseLayer name="Carto Dark">
                        <TileLayer
                            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                            attribution="&copy; CARTO &copy; OpenStreetMap"
                        />
                    </BaseLayer>

                    <BaseLayer name="OpenTopoMap">
                        <TileLayer
                            url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
                            attribution="Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap"
                        />
                    </BaseLayer>

                    <BaseLayer name="NASA City Lights">
                        <TileLayer
                            url="https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_CityLights_2012/default/2012-01-01/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpg"
                            attribution="Imagery courtesy NASA EOSDIS GIBS"
                            maxNativeZoom={8}
                            maxZoom={18}
                        />
                    </BaseLayer>

                    {/* GeoJSON Overlay */}
                    <Overlay checked name="GeoJSON Data">
                        <GeoJSON data={formattedGeojson} onEachFeature={onEachFeature} />
                    </Overlay>
                </LayersControl>
            </MapContainer>
        </div>
    );
};

export default MapView;
