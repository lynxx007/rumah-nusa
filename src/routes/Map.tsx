import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMapEvents,
} from "react-leaflet";
import Navbar from "../components/Navbar";
import "leaflet/dist/leaflet.css";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { search } from "@orama/orama";
import { db } from "../lib/orama";
import ListingCard from "../components/Card";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Map() {
  const { id, lat, lon } = useParams();
  const [data, setData] = useState<any[]>([]);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lon: number }>({
    lat: 0,
    lon: 0,
  });
  const [mapZoom, setMapZoom] = useState(16);
  const mapRef = useRef(null);
  const [ListingsOnCurrentLocation, setListingsOnCurrentLocation] = useState<
    any[]
  >([]);
  const [mapListingsCurrentPage, setMapListingsCurrentPage] = useState(1);
  const [mapListingsTotalPages, setMapListingsTotalPages] = useState(1);
  const listingsPerMapPage = 12;
  const navigate = useNavigate();

  const getRadiusByZoom = (zoom: number): number => {
    // Adjust these values based on your specific requirements
    switch (true) {
      case zoom <= 10:
        return 5000; // 5 km
      case zoom <= 12:
        return 2000; // 2 km
      case zoom <= 14:
        return 1000; // 1 km
      case zoom <= 16:
        return 500; // 500 m
      default:
        return 250; // 250 m for very close zooms
    }
  };
  const renderMapPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(
      1,
      mapListingsCurrentPage - Math.floor(maxVisiblePages / 2)
    );
    let endPage = Math.min(
      mapListingsTotalPages,
      startPage + maxVisiblePages - 1
    );

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(
        <button
          key={i}
          onClick={() => handleMapPageChange(i)}
          className={`px-3 py-1 mx-1 border rounded-md ${
            mapListingsCurrentPage === i
              ? "bg-primary text-white"
              : "bg-white text-gray-700"
          } hidden sm:inline-block`}
          aria-label={`Go to page ${i}`}
        >
          {i}
        </button>
      );
    }

    return pageNumbers;
  };

  const handleMapPageChange = (newPage: number) => {
    // Ensure new page is within valid range
    const validatedPage = Math.max(1, Math.min(newPage, mapListingsTotalPages));
    setMapListingsCurrentPage(validatedPage);
  };
  const fetchListingsOnMapCenter = async () => {
    try {
      // Get the current map bounds
      const map = mapRef.current;
      if (!map) return;

      const bounds = map.getBounds();
      const northEast = bounds.getNorthEast();
      const southWest = bounds.getSouthWest();

      // Calculate the diagonal distance of the map view
      const calculateDistance = (
        lat1: number,
        lon1: number,
        lat2: number,
        lon2: number
      ) => {
        const R = 6371; // Radius of the Earth in kilometers
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
      };

      const mapDiagonalDistance = calculateDistance(
        southWest.lat,
        southWest.lng,
        northEast.lat,
        northEast.lng
      );

      // Dynamically adjust listing limit based on map size
      const getListingLimit = () => {
        switch (true) {
          case mapDiagonalDistance > 50: // Large area view
            return 200;
          case mapDiagonalDistance > 20: // Medium area view
            return 100;
          case mapDiagonalDistance > 10: // Smaller area view
            return 50;
          case mapDiagonalDistance > 5: // Close area view
            return 25;
          default: // Very close view
            return 12;
        }
      };

      const res = await search(db, {
        limit: getListingLimit(),
        where: {
          _geoloc: {
            // Use polygon to match exact map boundaries
            polygon: {
              coordinates: [
                { lat: northEast.lat, lon: northEast.lng },
                { lat: southWest.lat, lon: northEast.lng },
                { lat: southWest.lat, lon: southWest.lng },
                { lat: northEast.lat, lon: southWest.lng },
                { lat: northEast.lat, lon: northEast.lng },
              ],
            },
          },
        },
      });

      setMapListingsCurrentPage(1);

      // Set total pages based on fetched listings
      setMapListingsTotalPages(Math.ceil(res.hits.length / listingsPerMapPage));

      setListingsOnCurrentLocation(res.hits);
      console.log(
        `Fetched ${
          res.hits.length
        } listings within ${mapDiagonalDistance.toFixed(2)} km map view`
      );
    } catch (error) {
      console.error("Error fetching listings on map:", error);
    }
  };

  const MapEventHandler = () => {
    const map = useMapEvents({
      moveend: () => {
        // Get the current center of the map
        const center = map.getCenter();
        const zoom = map.getZoom();

        setMapCenter({
          lat: center.lat,
          lon: center.lng,
        });
        setMapZoom(zoom);

        // Trigger listing fetch on significant map movement
        fetchListingsOnMapCenter();
      },
      zoomend: () => {
        // Explicitly fetch listings when zoom changes
        fetchListingsOnMapCenter();
      },
    });
    return null;
  };

  useEffect(() => {
    const getData = async () => {
      try {
        const data = await search(db, {
          where: {
            _geoloc: {
              radius: {
                coordinates: {
                  lat: parseFloat(lat as string),
                  lon: parseFloat(lon as string),
                },
                value: 5000,
              },
            },
          },
        });
        setData(data.hits);
        console.log(data);
      } catch (error) {
        console.log(error);
      }
    };

    getData();
  }, [id]);

  useEffect(() => {
    if (mapCenter.lat !== 0 && mapCenter.lon !== 0) {
      fetchListingsOnMapCenter();
    }
  }, [mapCenter, mapZoom]);
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 p-4 pt-40 pb-20">
        <Navbar />
        <div className="w-full h-[calc(100vh-64px)] sm:h-[50vh]">
          <div className="grid grid-cols-1 md:grid-cols-2">
            <MapContainer
              center={[parseFloat(lat as string), parseFloat(lon as string)]}
              zoom={13}
              scrollWheelZoom={false}
              className="w-full h-screen z-0"
              ref={mapRef}
            >
              <MapEventHandler />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {ListingsOnCurrentLocation.map((listing) => (
                <Marker
                  key={listing.id}
                  position={[
                    parseFloat(listing.document._geoloc.lat as string),
                    parseFloat(listing.document._geoloc.lon as string),
                  ]}
                >
                  <Popup>
                    <div className="p-2 bg-white shadow-lg rounded-md">
                      <h3 className="text-lg font-bold text-gray-800">
                        Rp {listing.document.price}
                      </h3>
                      <p className="text-gray-600">
                        {listing.document.market_title}
                      </p>
                      <button
                        onClick={() =>
                          navigate(`/listings/${listing.document.listing_id}`)
                        }
                        className="mt-2 px-4 py-1 bg-green-500 text-white rounded"
                      >
                        Visit
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
            <div className="p-4">
              {ListingsOnCurrentLocation.slice(
                (mapListingsCurrentPage - 1) * listingsPerMapPage,
                mapListingsCurrentPage * listingsPerMapPage
              ).map((listing) => (
                <ListingCard
                  key={listing.document.listing_id}
                  title={listing.document.market_title}
                  imageUrl={listing.document.images}
                  location={listing.document.location_address}
                  price={listing.document.price}
                  type={listing.document.spec_subtype}
                  id={listing.document.listing_id}
                  beds={listing.document.spec_bedroom}
                  baths={listing.document.spec_bathroom}
                  width={listing.document.spec_dim_total}
                  floor={listing.document.spec_floor}
                  description={listing.document.market_description}
                />
              ))}
              <div className="flex justify-center items-center space-x-2 mt-4">
                <button
                  onClick={() =>
                    handleMapPageChange(mapListingsCurrentPage - 1)
                  }
                  disabled={mapListingsCurrentPage === 1}
                  className="px-3 py-1 border rounded-md bg-white text-gray-700 disabled:opacity-50"
                  aria-label="Go to previous page"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                {renderMapPageNumbers()}
                <button
                  onClick={() =>
                    handleMapPageChange(mapListingsCurrentPage + 1)
                  }
                  disabled={mapListingsCurrentPage === mapListingsTotalPages}
                  className="px-3 py-1 border rounded-md bg-white text-gray-700 disabled:opacity-50"
                  aria-label="Go to next page"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
              <div className="flex justify-center items-center mt-2 text-sm text-gray-600">
                Page {mapListingsCurrentPage} of {mapListingsTotalPages}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
