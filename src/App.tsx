import { memo, useCallback, useEffect, useRef, useState } from "react";

import Navbar from "./components/Navbar";
import MarkerClasterGroup from 'react-leaflet-cluster'
import { search } from "@orama/orama";
import { db } from "./lib/orama";
import ListingCard from "./components/Card";
import {
  ChevronLeft,
  ChevronRight,
  CircleUser,
  Heart,
  ListIcon,
  MapIcon,
  Search,
} from "lucide-react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useNavigate } from "react-router-dom";
import { useStore } from "./store/store";

const cache: { [key: string]: any } = {}
function App() {
  const [searchLocation, setSearchLocation] = useState<any>(null);
  const [coordinate, setCoordinate] = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [ListingsOnCurrentLocation, setListingsOnCurrentLocation] = useState<
    any[]
  >([]);
  const [isMapMoving, setIsMapMoving] = useState(false);
  const [zoom, setZoom] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [currentLocation, setCurrentLocation] = useState({ lat: 0, lon: 0 });
  const [mapListingsCurrentPage, setMapListingsCurrentPage] = useState(1);
  const [mapListingsTotalPages, setMapListingsTotalPages] = useState(1);
  const [searchedLocation, setSearchedLocation] = useState<{lat: number, lon: number} | null>(null);
  const listingsPerMapPage = 12;

  const listingsPerPage = 12;

  // const [isMapView, setIsMapView] = useState(false);
  const { isMapView, setIsMapView } = useStore()
  const mapRef = useRef(null);

  const [mapCenter, setMapCenter] = useState<{ lat: number; lon: number }>({
    lat: 0,
    lon: 0,
  });
  const [mapZoom, setMapZoom] = useState(16);

  const navigate = useNavigate();

  const handleFirstResult = (lat: number, lon: number) => {
    setSearchedLocation({ lat, lon });
    if (mapRef.current) {
      // @ts-ignore
      mapRef.current.setView([lat, lon], 16);
      setMapCenter({ lat, lon });
    }
  };
  

  const MapEventHandler = useCallback(() => {
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
      // zoomend: () => {
      //   // Explicitly fetch listings when zoom changes
      //   fetchListingsOnMapCenter();
      // },
    });
    return null;
  }, []);

  const fetchListingsOnMapCenter = useCallback(async () => {
    try {
      // Get the current map bounds
      const map = mapRef.current;
      if (!map) return;

      //@ts-ignore
      const bounds = map.getBounds();
      const northEast = bounds.getNorthEast();
      const southWest = bounds.getSouthWest();

      const cacheKey = `map-${northEast.lat}-${northEast.lng}-${southWest.lat}-${southWest.lng}`;
      if (cache[cacheKey]) {
        setListingsOnCurrentLocation(cache[cacheKey].hits);
        setMapListingsTotalPages(Math.ceil(cache[cacheKey].count / listingsPerMapPage));
        return;
      }

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
            return 3000;
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
        limit: 1000,
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

      // const data = await fetch(`http://localhost:8000/v1/api/map?latNortheast=${northEast.lat}&lonNortheast=${northEast.lng}&latSouthwest=${southWest.lat}&lonSouthwest=${southWest.lng}`);
      // const res = await data.json();
      cache[cacheKey] = res;
      setListingsOnCurrentLocation(res.hits);
      setMapListingsTotalPages(Math.ceil(res.count / listingsPerMapPage));
      console.log(
        `Fetched ${
          res.hits.length
        } listings within ${mapDiagonalDistance.toFixed(2)} km map view`
      );
    } catch (error) {
      console.error("Error fetching listings on map:", error);
    }
  }, []);

  // const cachedFetch = useCallback(fetchListingsOnMapCenter, []);

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

  // useEffect(() => {
  //   if (mapCenter.lat !== 0 && mapCenter.lon !== 0) {
  //     fetchListingsOnMapCenter();
  //   }
  // }, [mapCenter, mapZoom]);

  const getLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
        },
        (err) => {
          console.log(err);
        }
      );
    }
  };

  const fetchListingsOnCurrentLocation = async () => {
    const res = await search(db, {
      limit: 1000,
      where: {
        _geoloc: {
          radius: {
            coordinates: {
              lat: currentLocation.lat,
              lon: currentLocation.lon,
            },
            value: 100000,
            inside: true,
            unit: "km",
          },
        },
      },
    });
    const cacheKey = `location-${currentLocation.lat}-${currentLocation.lon}`;
    if (cache[cacheKey]) {
      setListingsOnCurrentLocation(cache[cacheKey]);
      return;
    }
    // const data = await fetch(`http://localhost:8000/v1/api/location?lat=${currentLocation.lat}&lon=${currentLocation.lon}`);
    // const res = await data.json();
    cache[cacheKey] = res.hits;
    setListingsOnCurrentLocation(res.hits);
  };
  useEffect(() => {
    if (currentLocation.lat !== 0 && currentLocation.lon !== 0) {
      fetchListingsOnCurrentLocation();
    }
  }, [currentLocation]);

  useEffect(() => {
    getLocation();
  }, []);
  useEffect(() => {
    const fetchListings = async () => {
      const cacheKey = `listings-${currentPage}`;
      if (cache[cacheKey]) {
        setListings(cache[cacheKey].hits);
        setTotalPages(Math.ceil(cache[cacheKey].count / listingsPerPage));
        return;
      }

      const res = await search(db, {
        limit: listingsPerPage,
        offset: (currentPage - 1) * listingsPerPage,
      });
      cache[cacheKey] = res;
      setListings(res.hits);
      setTotalPages(Math.ceil(res.count / listingsPerPage));
    };
    fetchListings();
  }, [currentPage]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const renderPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-1 mx-1 border rounded-md ${
            currentPage === i
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

  useEffect(() => {
    if (isMapView) {
      fetchListingsOnMapCenter();
    }
  }, [mapListingsCurrentPage, isMapView]);

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
    setMapListingsCurrentPage(newPage);
  };
  const MemoizedMarker = memo(({ listing, navigate } : any) => (
    <Marker
      key={listing.id}
      position={[
        listing.document._geoloc.lat,
        listing.document._geoloc.lon,
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
              navigate(
                `/listings/${listing.document.listing_id}`
              )
            }
            className="mt-2 px-4 py-1 bg-green-500 text-white rounded"
          >
            Visit
          </button>
        </div>
      </Popup>
    </Marker>
  ));

  return (
    <div className="flex flex-col min-h-screen">
      {
        <Navbar
        onSearch={setSearchLocation}
        setListings={setListings}
        isMapview={isMapView}
        currentPage={currentPage}
        listingPerPage={listingsPerPage}
        setTotalPage={setTotalPages}
        onFirstResult={handleFirstResult}
        // setIsMapView={setIsMapView}
      />
      }
      <main className="flex-1 p-4 pt-20 pb-20">
        {isMapView ? (
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="w-full h-[400px] z-0 md:h-screen">
              <MapContainer
                center={[currentLocation.lat, currentLocation.lon]}
                zoom={10}
                ref={mapRef}
                className="w-full h-[400px] md:h-screen"
              >
                <MapEventHandler />
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MarkerClasterGroup chunkedLoading>
                {ListingsOnCurrentLocation.length > 0 &&
                  ListingsOnCurrentLocation.map((listing) => (
                    <MemoizedMarker
                    key={listing.id}
                    listing={listing}
                    navigate={navigate}
                  />
                  ))}
                  </MarkerClasterGroup>
              </MapContainer>
            </div>
            <div className="flex flex-col">
              <h2 className="text-2xl font-bold mb-4 pl-4">
                {ListingsOnCurrentLocation.length} listings found
              </h2>
              <div className="p-4 grid grid-cols-2 gap-4">
                {ListingsOnCurrentLocation.slice(
                  (mapListingsCurrentPage - 1) * listingsPerMapPage,
                  mapListingsCurrentPage * listingsPerMapPage
                ).map((listing) => (
                  <ListingCard
                    key={listing.id}
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
        ) : listings.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {listings.map((listing) => (
                <ListingCard
                  key={listing.id}
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
            </div>
            <div className="flex justify-center items-center space-x-2 mt-4">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded-md bg-white text-gray-700 disabled:opacity-50"
                aria-label="Go to previous page"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              {renderPageNumbers()}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded-md bg-white text-gray-700 disabled:opacity-50"
                aria-label="Go to next page"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
            <div className="flex justify-center items-center mt-2 text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </div>
          </>
        ) : listings.length === 0 ? (
          <div className="flex items-center justify-center h-screen">
            <h2 className="text-2xl font-bold mb-4">No listings found</h2>
          </div>
        ) : null}
        <button
          onClick={() => setIsMapView(!isMapView)}
          className={`fixed bottom-24 md:bottom-6 right-6 z-50 bg-primary text-white bg-black 
          rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 
          flex items-center justify-center p-4 
          hover:scale-105 active:scale-95`}
          aria-label={isMapView ? "Show Listings" : "Show Map"}
        >
          <div className="flex items-center space-x-2">
            {isMapView ? (
              <>
                <ListIcon className="h-6 w-6" />
                <span className="text-sm font-semibold hidden md:block">
                  Show listings
                </span>
              </>
            ) : (
              <>
                <MapIcon className="h-6 w-6" />
                <span className="text-sm font-semibold hidden md:block">
                  Show map
                </span>
              </>
            )}
          </div>
        </button>
      </main>
      {/* <footer className="md:hidden flex justify-center items-center space-x-16 fixed bottom-0 left-0 w-full bg-white text-center text-red-300 p-4 z-10">
        <a
          href="/"
          className="text-sm font-semibold flex flex-col items-center"
        >
          <Search /> Explore
        </a>
        <a
          href="/wishlist"
          className="text-sm font-semibold flex flex-col items-center"
        >
          <Heart /> Wishlist
        </a>
        <a
          href="/login"
          className="text-sm font-semibold flex flex-col items-center"
        >
          <CircleUser /> Log in
        </a>
      </footer> */}
    </div>
  );
}

export default App;
