import { LayersControl, TileLayer } from 'react-leaflet';

const { BaseLayer } = LayersControl;

// Karena BaseLayer adalah bagian dari LayersControl,
// kamu harus import LayersControl dari react-leaflet jika belum.

const BaseLayers = () => {
    return (
        <>
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
            &copy; <a href="https://stadiamaps.com/" target="_blank" rel="noreferrer">Stadia Maps</a> 
            &copy; <a href="https://stamen.com/" target="_blank" rel="noreferrer">Stamen Design</a> 
            &copy; <a href="https://openmaptiles.org/" target="_blank" rel="noreferrer">OpenMapTiles</a> 
            &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>
          `}
                />
            </BaseLayer>

            <BaseLayer name="Stamen Terrain">
                <TileLayer
                    url="https://tiles.stadiamaps.com/tiles/stamen_terrain/{z}/{x}/{y}{r}.png"
                    maxZoom={20}
                    attribution={`
            &copy; <a href="https://stadiamaps.com/" target="_blank" rel="noreferrer">Stadia Maps</a>
            &copy; <a href="https://stamen.com/" target="_blank" rel="noreferrer">Stamen Design</a>
            &copy; <a href="https://openmaptiles.org/" target="_blank" rel="noreferrer">OpenMapTiles</a>
            &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>
          `}
                />
            </BaseLayer>

            <BaseLayer name="Carto Positron">
                <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" attribution="&copy; CARTO &copy; OpenStreetMap" />
            </BaseLayer>

            <BaseLayer name="Carto Dark">
                <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution="&copy; CARTO &copy; OpenStreetMap" />
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
        </>
    );
};

export default BaseLayers;
