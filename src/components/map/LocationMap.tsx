import React from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';

interface LocationMapProps {
  center: {
    lat: number;
    lng: number;
  };
}

const LocationMap: React.FC<LocationMapProps> = ({ center }) => {
  const mapContainerStyle = {
    width: '100%',
    height: '200px',
    borderRadius: '0.5rem',
  };

  const options = {
    disableDefaultUI: true,
    zoomControl: true,
  };

  return (
    <div className="w-full mt-4">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        zoom={15}
        center={center}
        options={options}
      >
        <Marker position={center} />
      </GoogleMap>
    </div>
  );
};

export default LocationMap; 