/**
 * Utility functions for GeoJSON operations
 */

export interface MapBounds {
    center: [number, number];
    zoom: number;
    bounds?: {
        minLat: number;
        maxLat: number;
        minLng: number;
        maxLng: number;
    };
}

/**
 * Calculate the center coordinates and appropriate zoom level from GeoJSON data
 * @param geojsonData - GeoJSON Feature or FeatureCollection
 * @returns Object containing center coordinates, zoom level, and bounds
 */
export function calculateGeojsonCenter(geojsonData: any): MapBounds {
    // Default fallback coordinates (Indonesia center)
    const defaultResult: MapBounds = { 
        center: [1.0, 104.521117], 
        zoom: 11 
    };

    if (!geojsonData) {
        return defaultResult;
    }

    let allCoords: number[][] = [];

    // Handle FeatureCollection
    if (geojsonData.type === 'FeatureCollection' && geojsonData.features) {
        geojsonData.features.forEach((feature: any) => {
            const coords = extractCoordinatesFromGeometry(feature.geometry);
            allCoords = allCoords.concat(coords);
        });
    } 
    // Handle single Feature
    else if (geojsonData.type === 'Feature' && geojsonData.geometry) {
        allCoords = extractCoordinatesFromGeometry(geojsonData.geometry);
    }
    // Handle direct geometry
    else if (geojsonData.geometry) {
        allCoords = extractCoordinatesFromGeometry(geojsonData.geometry);
    }
    // Handle direct geometry object
    else if (geojsonData.type && geojsonData.coordinates) {
        allCoords = extractCoordinatesFromGeometry(geojsonData);
    }

    if (allCoords.length === 0) {
        return defaultResult;
    }

    // Calculate bounds
    const lats = allCoords.map(coord => coord[1]);
    const lngs = allCoords.map(coord => coord[0]);
    
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    // Calculate center
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;

    // Calculate appropriate zoom level based on bounds
    const latDiff = maxLat - minLat;
    const lngDiff = maxLng - minLng;
    const maxDiff = Math.max(latDiff, lngDiff);
    
    let zoom = 11; // default
    if (maxDiff < 0.01) zoom = 16;
    else if (maxDiff < 0.05) zoom = 14;
    else if (maxDiff < 0.1) zoom = 13;
    else if (maxDiff < 0.5) zoom = 11;
    else if (maxDiff < 1) zoom = 10;
    else if (maxDiff < 2) zoom = 9;
    else zoom = 8;

    return {
        center: [centerLat, centerLng],
        zoom,
        bounds: {
            minLat,
            maxLat,
            minLng,
            maxLng
        }
    };
}

/**
 * Extract coordinates from different geometry types
 * @param geometry - GeoJSON geometry object
 * @returns Array of coordinate pairs [lng, lat]
 */
function extractCoordinatesFromGeometry(geometry: any): number[][] {
    if (!geometry || !geometry.coordinates) {
        return [];
    }

    let coords: number[][] = [];

    switch (geometry.type) {
        case 'Point':
            coords = [geometry.coordinates];
            break;
        
        case 'LineString':
            coords = geometry.coordinates;
            break;
        
        case 'Polygon':
            // Take the first ring (exterior ring) of the polygon
            coords = geometry.coordinates[0];
            break;
        
        case 'MultiPoint':
            coords = geometry.coordinates;
            break;
        
        case 'MultiLineString':
            geometry.coordinates.forEach((lineString: number[][]) => {
                coords = coords.concat(lineString);
            });
            break;
        
        case 'MultiPolygon':
            geometry.coordinates.forEach((polygon: number[][][]) => {
                // Take the first ring of each polygon
                coords = coords.concat(polygon[0]);
            });
            break;
        
        case 'GeometryCollection':
            geometry.geometries.forEach((geom: any) => {
                coords = coords.concat(extractCoordinatesFromGeometry(geom));
            });
            break;
    }

    return coords;
}

/**
 * Format coordinates for display
 * @param lat - Latitude
 * @param lng - Longitude
 * @param precision - Number of decimal places (default: 6)
 * @returns Formatted coordinate string
 */
export function formatCoordinates(lat: number, lng: number, precision: number = 6): string {
    return `${lat.toFixed(precision)}, ${lng.toFixed(precision)}`;
}

/**
 * Convert decimal degrees to degrees, minutes, seconds format
 * @param decimal - Decimal degrees
 * @param isLatitude - Whether this is latitude (true) or longitude (false)
 * @returns DMS formatted string
 */
export function toDMS(decimal: number, isLatitude: boolean): string {
    const absolute = Math.abs(decimal);
    const degrees = Math.floor(absolute);
    const minutesFloat = (absolute - degrees) * 60;
    const minutes = Math.floor(minutesFloat);
    const seconds = (minutesFloat - minutes) * 60;
    
    const direction = isLatitude 
        ? (decimal >= 0 ? 'N' : 'S')
        : (decimal >= 0 ? 'E' : 'W');
    
    return `${degrees}°${minutes}'${seconds.toFixed(2)}"${direction}`;
}