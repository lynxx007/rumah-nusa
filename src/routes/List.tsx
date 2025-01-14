import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import MarkerClasterGroup from 'react-leaflet-cluster'
import { search } from "@orama/orama";
import { db } from "../lib/orama";
import {
  Bath,
  Bed,
  BedDouble,
  Building2,
  ChevronLeft,
  ChevronRight,
  Dam,
  DoorClosed,
  Flower2,
  Heart,
  Maximize2,
  Sticker,
  Upload,
  Utensils,
  Wifi,
} from "lucide-react";
import Avatar from "../components/Avatar";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { formatPriceToIdr } from "../lib/formatPrice";
import { useStore } from "../store/store";
import ListingCard from "../components/Card";

const cache = {}
export default function List() {
  
  let { id } = useParams();
  const [data, setData] = useState<any>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [listings, setListings] = useState<any[]>([]);


  const [mapListingsCurrentPage, setMapListingsCurrentPage] = useState(1);

  const [mapListingsTotalPages, setMapListingsTotalPages] = useState(1);
  const {isMapView} = useStore();
  const [currentLocation, setCurrentLocation] = useState({ lat: 0, lon: 0 });
  const mapRef = useRef(null);
  const [ListingsOnCurrentLocation, setListingsOnCurrentLocation] = useState<
    any[]
  >([]);
    const navigate = useNavigate();
  

  const listingsPerMapPage = 12;

  const listingsPerPage = 12;

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

   const MapEventHandler = useCallback(() => {
      const map = useMapEvents({
        moveend: () => {
          // Get the current center of the map
          const center = map.getCenter();
          const zoom = map.getZoom();
  
          // setMapCenter({
          //   lat: center.lat,
          //   lon: center.lng,
          // });
          // setMapZoom(zoom);
  
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

    // useEffect(() => {
    //     // fetchListingsOnMapCenter();    
    //     // fetchListingsOnCurrentLocation();  
    // }, [mapListingsCurrentPage, isMapView]);
  
    useEffect(() => {
      fetchListingsOnCurrentLocation();
    }, [currentLocation]);

  useEffect(() => {
    getLocation();
  }, []);
  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await search(db, {
          where: {
            listing_id: id,
          },
        });
        console.log(data);
        setData(data.hits[0]);
      } catch (error) {
        console.log(error);
      }
    };
    fetch();
  }, [id]);

    // useEffect(() => {
    //   const fetchListings = async () => {
    //     const cacheKey = `listings-${currentPage}`;
    //     if (cache[cacheKey]) {
    //       setListings(cache[cacheKey].hits);
    //       setTotalPages(Math.ceil(cache[cacheKey].count / listingsPerPage));
    //       return;
    //     }
  
    //     const res = await search(db, {
    //       limit: listingsPerPage,
    //       offset: (currentPage - 1) * listingsPerPage,
    //     });
    //     cache[cacheKey] = res;
    //     setListings(res.hits);
    //     setTotalPages(Math.ceil(res.count / listingsPerPage));
    //   };
    //   fetchListings();
    // }, [currentPage]);
  
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      {data.document !== undefined ? (
        <main className={`flex flex-col p-4 md:p-16 pt-32 pb-20 ${isMapView ? "hidden" : ""}`}>
          <div className="pt-0 md:pt-8 flex w-full items-center justify-end  md:justify-center space-x-4">
            <h1 className="text-md font-bold hidden md:block">
              {data.document.market_title}
            </h1>
            <div className="ml-4 flex md:items-center">
              <a className="text-gray-500 flex items-center space-x-2">
                <Upload />
                <span className="ml-2 md:block hidden">Share</span>
              </a>
              <a className="text-gray-500 ml-2 flex items-center space-x-2">
                <Heart />
                <span className="ml-2 md:block hidden">Save</span>
              </a>
            </div>
          </div>
          <div className="mt-4 flex w-full items-center justify-center">
            <div className="grid-cols-1 grid md:grid-cols-2 gap-2">
              <img
                src={data.document.images[0]}
                alt=""
                className="w-full h-auto rounded"
              />
              <div className="hidden md:grid grid-cols-2 gap-2 invisible md:visible">
                {data.document.images
                  .slice(0, 4)
                  .map((image: string, index: number) => (
                    <img
                      key={index}
                      src={image}
                      alt=""
                      className="w-full rounded"
                    />
                  ))}
              </div>
            </div>
          </div>
          <div className="flex w-full md:hidden items-start justify-items-start p-4 flex-col border-b-2">
            <h1 className="text-md font-bold">{data.document.market_title}</h1>
            <h2 className="text-sm text-gray-500">
              {data.document.location_address}
            </h2>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center">
                <BedDouble className="h-4 w-4 mr-1" />
                <span>{data.document.spec_bedroom}</span>
              </div>
              <div className="flex items-center">
                <Bath className="h-4 w-4 mr-1" />
                <span>{data.document.spec_bathroom}</span>
              </div>
              <div className="flex items-center">
                <Maximize2 className="h-4 w-4 mr-1" />
                <span>{data.document.spec_dim_total} m²</span>
              </div>
              <div className="flex items-center">
                <Building2 className="h-4 w-4 mr-1" />
                <span>{data.document.spec_floor}</span>
              </div>
            </div>
          </div>
          <div className="flex  w-full items-start justify-items-start p-4 flex-row border-b-2 space-x-4">
            <Avatar
              src={data.document.images[0]}
              alt={data.document.market_title}
            />
            <div className="flex flex-col text-sm text-gray-600">
              <h2 className="font-bold">Hosted by Lorem</h2>
              <h2 className="text-gray-400">Lorem ipsum dolor sit amet</h2>
            </div>
          </div>
          <div className="flex flex-col w-full items-start justify-items-start p-4 space-y-4  border-b-2">
            <div className="flex flex-row space-x-4 text-sm text-gray-600">
              <DoorClosed />
              <div className="flex flex-col text-sm text-gray-600">
                <h2 className="font-bold">Hosted by Lorem</h2>
                <h2 className="text-gray-400">Lorem ipsum dolor sit amet</h2>
              </div>
            </div>
            <div className="flex flex-row space-x-4 text-sm text-gray-600">
              <Dam />
              <div className="flex flex-col text-sm text-gray-600">
                <h2 className="font-bold">Hosted by Lorem</h2>
                <h2 className="text-gray-400">Lorem ipsum dolor sit amet</h2>
              </div>
            </div>
            <div className="flex flex-row space-x-4 text-sm text-gray-600">
              <Sticker />
              <div className="flex flex-col text-sm text-gray-600">
                <h2 className="font-bold">Hosted by Lorem</h2>
                <h2 className="text-gray-400">Lorem ipsum dolor sit amet</h2>
              </div>
            </div>
          </div>
          <div className="flex flex-col w-full items-start justify-items-start p-4 space-y-4  border-b-2">
            <p>{data.document.market_description}</p>
          </div>
          <div className="flex flex-col w-full items-start justify-items-start p-4 space-y-4  border-b-2">
            <h2 className="font-bold text-xl">Where you'll sleep</h2>
            <div className="flex flex-col w-64 h-32 rounded-lg bg-gray-100  p-4 py-8">
              <Bed />
              <h2 className="text-gray-400">Lorem ipsum dolor sit amet</h2>
            </div>
          </div>
          <div className="flex flex-col w-full items-start justify-items-start p-4 space-y-4  border-b-2">
            <h2 className="font-bold text-xl">What this place offers</h2>
            <div className="flex flex-row space-x-4 text-sm text-gray-600">
              <Flower2 />
              <div className="flex flex-col text-sm text-gray-600">
                <h2 className="font-bold">Courtyyard view</h2>
              </div>
            </div>
            <div className="flex flex-row space-x-4 text-sm text-gray-600">
              <Flower2 />
              <div className="flex flex-col text-sm text-gray-600">
                <h2 className="font-bold">Garden view</h2>
              </div>
            </div>
            <div className="flex flex-row space-x-4 text-sm text-gray-600">
              <Utensils />
              <div className="flex flex-col text-sm text-gray-600">
                <h2 className="font-bold">Kitchen</h2>
              </div>
            </div>
            <div className="flex flex-row space-x-4 text-sm text-gray-600">
              <Wifi />
              <div className="flex flex-col text-sm text-gray-600">
                <h2 className="font-bold">Wifi</h2>
              </div>
            </div>
            <div className="flex flex-row space-x-4 text-sm text-gray-600 w-full">
              <button className="text-primary w-full h-full rounded-md text-md font-bold p-4 bg-slate-50 text-black">
                More
              </button>
            </div>
          </div>
          <div className="flex flex-col w-full items-start justify-items-start p-4 space-y-4  border-b-2">
            <h2 className="font-bold text-xl">Where you'll be</h2>
            <h3>
              {data.document.location_administrative_area_level_4},
              {data.document.location_administrative_area_level_3},{" "}
              {data.document.location_administrative_area_level_2},{" "}
              {data.document.location_administrative_area_level_1}
            </h3>
            <div className="w-full">
              <MapContainer
                center={[data.document._geoloc.lat, data.document._geoloc.lon]}
                zoom={13}
                scrollWheelZoom={false}
                ref={mapRef}
                className="w-full h-80 z-0"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker
                  position={[
                    data.document._geoloc.lat,
                    data.document._geoloc.lon,
                  ]}
                >
                  <Popup>
                    A pretty CSS3 popup. <br /> Easily customizable.
                  </Popup>
                </Marker>
              </MapContainer>
            </div>
          </div>
        </main>
      ) : (
        <main className="flex flex-col p-4 pt-40 pb-20">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-primary"></div>
          </div>
        </main>
      )}
      <main className="flex-1 p-4 pt-20 pb-20">

      {isMapView ? (
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="w-full h-[400px] z-0 md:h-screen">
            <MapContainer
              center={[currentLocation.lat, currentLocation.lon]}
              zoom={10}
              className="w-full h-[400px] md:h-screen"
              ref={mapRef}
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
      )  : null}
      </main>
      {data.document !== undefined && (
        <footer className={`flex justify-between items-center space-x-16 fixed bottom-0 left-0 w-full bg-gray-200 text-center text-red-300 p-4 z-10 ${isMapView ? "hidden" : ""}`}>
          <div className="flex flex-row space-x-4">
            <h1 className="font-bold">{formatPriceToIdr(data.document.price)}</h1>
          </div>
          <div>
            <button className="bg-red-500 text-white rounded-full p-4">
              Buy Now
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}
