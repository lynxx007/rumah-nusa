import { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

interface Listing {
  _id: string;
  latitude: number;
  longitude: number;
  title: string;
  image: string;
  size: string;
}

interface MapProps {
  searchLocation: any;
  onMapMove: (title?: string, lat?: number, lng?: number) => void;
  listings: Listing[];
  setCoordinate: React.Dispatch<React.SetStateAction<any>>;
  setIsMapMoving: React.Dispatch<React.SetStateAction<boolean>>;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
}

function CustomPopup({ listing }: { listing: any }) {
  return (
    <Popup className="custom-popup" minWidth={280} maxWidth={320}>
      <div className="overflow-hidden rounded-lg bg-white">
        <div className="relative h-40 w-full overflow-hidden">
          <img
            src={"/gambar.jpg"}
            alt={listing.document.title}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-lg line-clamp-2">
            {listing.document.title}
          </h3>
          <button className="mt-2 w-full bg-blue-500 text-white rounded-md py-2 px-4 text-sm font-medium hover:bg-blue-600 transition-colors">
            View Details
          </button>
        </div>
      </div>
    </Popup>
  );
}

function MapUpdater({
  center,
  zoom,
  shouldUpdate,
  setShouldUpdate,
}: {
  center: any;
  zoom: number;
  shouldUpdate: boolean;
  setShouldUpdate: (value: boolean) => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (center && shouldUpdate) {
      map.setView(center, zoom);
      setShouldUpdate(false);
    }
  }, [center, zoom, map, shouldUpdate, setShouldUpdate]);

  return null;
}

function LocationLogger({
  onMapMove,
  setCoordinate,
  setIsMapMoving,
  setZoom,
}: {
  onMapMove: (title?: string, lat?: number, lng?: number) => void;
  setCoordinate: React.Dispatch<React.SetStateAction<any>>;
  setIsMapMoving: React.Dispatch<React.SetStateAction<boolean>>;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
}) {
  const timeoutRef = useRef<NodeJS.Timeout>();

  useMapEvents({
    movestart: () => {
      setIsMapMoving(true);
    },
    moveend: (event) => {
      const map = event.target;
      const { lat, lng } = map.getCenter();
      console.log("Map moved to:", lat, lng);
      const zoom = map.getZoom();
      console.log("Map zoom level:", zoom);
      setZoom(zoom);
      setCoordinate({ lat, lng });

      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set a new timeout to update after movement has stopped
      timeoutRef.current = setTimeout(() => {
        setIsMapMoving(false);
      }, 500); // Wait 500ms after movement ends before fetching new data
    },
  });

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return null;
}

export default function Map({
  searchLocation,
  onMapMove,
  listings,
  setCoordinate,
  setIsMapMoving,
  setZoom,
}: MapProps) {
  const mapRef = useRef(null);
  const [shouldUpdate, setShouldUpdate] = useState(false);

  useEffect(() => {
    if (searchLocation) {
      setShouldUpdate(true);
    }
  }, [searchLocation]);

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      .leaflet-popup-content-wrapper {
        padding: 0 !important;
        overflow: hidden !important;
        border-radius: 8px !important;
      }
      .leaflet-popup-content {
        margin: 0 !important;
        border-radius: 8px !important;
        width: 280px !important;
      }
      .leaflet-popup-close-button {
        color: white !important;
        z-index: 1 !important;
        margin: 4px !important;
      }
      .custom-popup img {
        max-width: none !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const center =
    searchLocation && listings.length > 0
      ? [listings[0].document.location.lat, listings[0].document.location.lon]
      : [0, 0];

  const zoom = searchLocation && listings.length > 0 ? 13 : 2;

  return (
    <div className="h-full">
      <MapContainer center={[0, 0]} zoom={2} ref={mapRef} className="h-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater
          center={center}
          zoom={zoom}
          shouldUpdate={shouldUpdate}
          setShouldUpdate={setShouldUpdate}
        />
        <LocationLogger
          onMapMove={onMapMove}
          setCoordinate={setCoordinate}
          setIsMapMoving={setIsMapMoving}
          setZoom={setZoom}
        />
        {listings.map((listing) => (
          <Marker
            key={listing.document.title}
            position={[
              listing.document.location.lat,
              listing.document.location.lon,
            ]}
          >
            <CustomPopup listing={listing} />
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
