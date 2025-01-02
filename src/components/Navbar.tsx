import { useEffect, useRef, useState } from "react";
import { Globe, Menu, Search, UserCircle } from "lucide-react";
import { search } from "@orama/orama";
import { db } from "../lib/orama";
import { FaHouse } from "react-icons/fa6";
import { MdOutlineVilla } from "react-icons/md";
import { useNavigate } from "react-router-dom";

export default function Navbar({
  setListings,
  isMapview,
  listingPerPage,
  currentPage,
  setTotalPage,
}: {
  onSearch?: any;
  setListings?: any;
  isMapview?: boolean;
  listingPerPage?: number;
  currentPage?: number;
  setTotalPage?: any;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  // Ref for the search input and suggestions container
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const getData = async (query: string) => {
    const data = await search(db, {
      term: query,
      limit: listingPerPage,
    });
    // const res = await fetch('http://localhost:8000/v1/api/search?searchTerm=' + query);
    // const data = await res.json();
    setSuggestions(data.hits);
    setShowSuggestions(true);
    setListings(data.hits);
    setTotalPage(Math.ceil(data.count / listingPerPage));
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

  // Effect to handle clicks outside of the search container
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if the click is outside the search container
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
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
            <img
              src={
                "https://th.bing.com/th/id/OIP.h7XeAZB8m0tydtSzecgD4wAAAA?rs=1&pid=ImgDetMain"
              }
              alt="Airbnb Logo"
              className="h-8 w-8"
            />
            <span className="text-[#FF5A5F] font-bold text-xl hidden md:block">
              Rumahnusa
            </span>
          </div>

          {/* Search Bar */}
          <div
            className={`flex items-center border rounded-full shadow-sm hover:shadow-md transition-all duration-300 py-2 px-4 space-x-4 ${
              isMapview && "hidden"
            }`}
          >
            <input
              type="text"
              placeholder="Start your search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="outline-none bg-transparent w-full text-sm"
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

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          className="fixed top-24 left-1/2 transform -translate-x-1/2 w-[400px] max-h-[300px] 
    overflow-y-auto bg-white rounded-lg shadow-2xl z-[1000] mt-2 border"
        >
          {suggestions.map((suggestion: any, index: number) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full px-4 py-3 text-left hover:bg-gray-100 transition-colors duration-150 border-b last:border-b-0"
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
    </div>
  );
}
