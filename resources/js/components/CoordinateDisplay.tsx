import React from 'react';
import { Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { formatCoordinates, toDMS } from '@/utils/geojsonUtils';

// Custom icon for center marker
const centerIcon = new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="24" height="24">
            <circle cx="12" cy="12" r="10" fill="#ef4444" stroke="#ffffff" stroke-width="2"/>
            <circle cx="12" cy="12" r="3" fill="#ffffff"/>
        </svg>
    `),
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
});

interface CoordinateDisplayProps {
    center: [number, number];
    showMarker?: boolean;
    showPopup?: boolean;
}

const CoordinateDisplay: React.FC<CoordinateDisplayProps> = ({ 
    center, 
    showMarker = true, 
    showPopup = true 
}) => {
    const [lat, lng] = center;

    return (
        <>
            {showMarker && (
                <Marker position={center} icon={centerIcon}>
                    {showPopup && (
                        <Popup>
                            <div className="p-2">
                                <h4 className="font-semibold text-gray-800 mb-2">Koordinat Tengah Polygon</h4>
                                <div className="space-y-1 text-sm">
                                    <div>
                                        <span className="font-medium">Decimal:</span>
                                        <br />
                                        <span className="font-mono">{formatCoordinates(lat, lng)}</span>
                                    </div>
                                    <div>
                                        <span className="font-medium">DMS:</span>
                                        <br />
                                        <span className="font-mono">
                                            {toDMS(lat, true)}, {toDMS(lng, false)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Popup>
                    )}
                </Marker>
            )}
        </>
    );
};

export default CoordinateDisplay;