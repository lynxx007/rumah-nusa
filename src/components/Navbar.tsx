import { useEffect, useRef, useState } from "react";
import { Globe, Menu, Search, UserCircle } from "lucide-react";
import { search } from "@orama/orama";
import { db } from "../lib/orama";
import { FaHouse } from "react-icons/fa6";
import { MdOutlineVilla } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { FcHome } from "react-icons/fc";
export default function Navbar({
  setListings,
  isMapview,
  listingPerPage,
  currentPage,
  setTotalPage,
  onFirstResult,
  setIsMapView
}: {
  onSearch?: any;
  setListings?: any;
  isMapview?: boolean;
  listingPerPage?: number;
  currentPage?: number;
  setTotalPage?: any;
  onFirstResult?: (lat: number, lng: number) => void;
  setIsMapView?: (value: boolean) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [suggestions2, setSuggestions2] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showSuggestions2, setShowSuggestions2] = useState(false);
  const [apiData,setApiData] = useState([])
  // Ref for the search input and suggestions container
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const getData = async (query: string) => {
    
    // const res = await fetch('http://localhost:8000/v1/api/search?searchTerm=' + query);
    // const data = await res.json();
    const apiRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${query}, Indonesia&format=json`)
    const apiData = await apiRes.json();
    setApiData(apiData)
    console.log(apiData);
    const data = await search(db, {
      term: query,
      limit: listingPerPage,
      properties: ['location_address','market_title']
    });
    // setLandmarkSuggestion(apiData);
    setSuggestions(data.hits);
    setShowSuggestions(true);
    if (apiData.length === 0){
      return
    }

    const res = await search(db, {
        limit: 1000,
        where: {
          _geoloc: {
            radius: {
              coordinates: {
                lat: Number(apiData[0].lat),
                lon: Number(apiData[0].lon),
              },
              value: 1,
              unit: "km",
              inside: true,
            },
          }, 
        },
      });
      console.log(res.hits);
      setSuggestions2(res.hits);
      setShowSuggestions2(true);
      setListings(res.hits);
      setTotalPage(Math.ceil(res.count / listingPerPage));
   
    if (res.hits.length > 0 && res.hits[0].document._geoloc) {
      // Center map on first result
      onFirstResult?.(
        res.hits[0].document._geoloc.lat,
        res.hits[0].document._geoloc.lon
      );
    }

    // setListings(data.hits);
    // setTotalPage(Math.ceil(data.count / listingPerPage));

   
    
    // else{
    //   const res = await search(db, {
    //     limit: 1000,
    //     where: {
    //       _geoloc: {
    //         radius: {
    //           coordinates: {
    //             lat: Number(apiData[0].lat),
    //             lon: Number(apiData[0].lon),
    //           },
    //           value: 1,
    //           unit: "km",
    //           inside: true,
    //         },
    //       }, 
    //     },
    //   });
    //   setSuggestions(res.hits);
    //   setLandmarkSuggestion(apiData);
    //   setShowSuggestions(true);
    //   setListings(res.hits);
    //   setTotalPage(Math.ceil(res.count / listingPerPage));

    //   if (res.hits.length > 0 && res.hits[0].document._geoloc) {
    //     // Center map on first result
    //     onFirstResult?.(
    //       // res.hits[0].document._geoloc.lat,
    //       // res.hits[0].document._geoloc.lon
    //       Number(apiData[0].lat),
    //       Number(apiData[0].lon)
    //     );
    //      // Enable map view
    //      setIsMapView?.(true);
    //   }
    // }
    
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery) {
          getData(searchQuery);
      } else {
          setShowSuggestions(false);
      }
  }, 500); // 500ms delay

  return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // useEffect(() => {
  //   const url = 'https://nominatim.openstreetmap.org/search?q=Taman anggrek, Indonesi&format=json'
  // },[])

  // Effect to handle clicks outside of the search container
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if the click is outside the search container
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setShowSuggestions2(false);
      }
    };

    // Add event listener to the document
    document.addEventListener("mousedown", handleClickOutside);

    // Clean up the event listener
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSuggestionClick = (suggestion: any) => {
    navigate(`/listings/${suggestion.document.listing_id}`);
    // setSearchQuery(suggestion.document.title);
    // setShowSuggestions(false);
    // onSearch({
    //   lat: parseFloat(suggestion.document.location.lat),
    //   lng: parseFloat(suggestion.document.location.lon),
    // });
    // onSearch(suggestion.document.title);
  };

  return (
    <div className="relative" ref={searchContainerRef}>
      <nav className="fixed top-0 w-full bg-white z-50 shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <a
              href="/"
              className="text-[#FF5A5F] font-bold text-xl flex gap-1 items-center"
            ><FaHouse color="#FF5A5F" size={20} />
            <span className="text-[#FF5A5F] font-bold text-xl hidden md:block">
              Rumahnusa
            </span>
            </a>
          </div>

          {/* Search Bar */}
          <div
            className={`flex items-center border rounded-full shadow-sm hover:shadow-md transition-all duration-300 py-2 px-4 space-x-4`}
          >
            <input
              type="text"
              placeholder="Start your search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="outline-none bg-transparent w-full text-sm"
              autoFocus={false}
              onFocus={()=>{
                setIsMapView(true)
              }}
              // onKeyDown={(e) => {
              //   if (e.key === "Enter") setListings} }
            />
            <button
              className="bg-[#FF5A5F] text-white rounded-full p-2"
              onClick={handleSuggestionClick}
            >
              <Search size={16} />
            </button>
          </div>

          {/* Right Side Menu */}
          <div className="flex items-center space-x-4">
            <button className="text-sm font-medium hover:bg-gray-100 px-3 py-2 rounded-full hidden md:block">
              Become a host
            </button>

            <button className="hover:bg-gray-100 p-2 rounded-full">
              <Globe size={20} />
            </button>

            <div className="flex items-center space-x-2 border rounded-full px-2 py-1 hover:shadow-md transition-all">
              <Menu size={20} />
              <UserCircle size={24} className="text-gray-500" />
            </div>
          </div>
        </div>
      </nav>

      {showSuggestions && suggestions.length > 0 && (
  <div className="absolute top-12 left-1/2 transform -translate-x-1/2 w-[400px] max-h-[150px] overflow-y-auto bg-white rounded-lg shadow-2xl z-[1000] mt-2 border">
    {suggestions.map((suggestion: any, index: number) => (
      <button
        key={index}
        className="w-full px-4 py-3 text-left hover:bg-gray-100 transition-colors duration-150 border-b last:border-b-0"
        onClick={() => handleSuggestionClick(suggestion)}
      >
        <p className="text-sm text-gray-800 font-medium truncate">
          {suggestion.document.market_title}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {suggestion.document.location_address}
        </p>
      </button>
    ))}
  </div>
)}

{/* Suggestions dropdown */}
{showSuggestions2 && suggestions2.length > 0 && (
  <div
    className="absolute top-52 left-1/2 transform -translate-x-1/2 w-[400px] max-h-[300px] 
    overflow-y-auto bg-white rounded-lg shadow-2xl z-[1000] mt-2 border"
  >
    {suggestions2.map((suggestion: any, index: number) => (
      <button
        key={index}
        onClick={() => handleSuggestionClick(suggestion)}
        className="w-full px-4 py-3 text-left hover:bg-gray-100 transition-colors duration-150 border-b last:border-b-0"
      >
        {apiData.length > 0 && <p className="text-sm text-gray-800 font-medium truncate">Near {apiData[0].name}</p>}
        <p className="text-sm text-gray-800 font-medium truncate">
          {suggestion.document.title}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {suggestion.document.location_address}
        </p>
      </button>
    ))}
  </div>
)}
    </div>
  );
}
