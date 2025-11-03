declare module '@tmcw/togeojson' {
  export function kml(doc: Document, options?: any): any; // returns a GeoJSON FeatureCollection
  export function gpx(doc: Document, options?: any): any; // not used, but available
}

