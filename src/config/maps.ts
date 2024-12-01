export const GOOGLE_MAPS_LIBRARIES: ("places" | "geometry")[] = ["places", "geometry"];

export const DEFAULT_MAP_OPTIONS = {
  styles: [
    {
      featureType: 'all',
      elementType: 'all',
      stylers: [
        { saturation: -100 },
        { lightness: 0 }
      ]
    }
  ],
  disableDefaultUI: true,
  zoomControl: true,
  streetViewControl: true,
  fullscreenControl: true
}; 