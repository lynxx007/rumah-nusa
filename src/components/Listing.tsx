import { useState } from "react";

export interface Listing {
  _id: string;
  id: string;
  title: string;
  longitude: number;
  latitude: number;
  image: string;
  size: string;
  images: string[];
  location_address: string;
  market_title: string;
  price: number;
}

function ListingComponent({ listings }: { listings: any[] }) {
  if (listings.length === 0) {
    return <p>No listings found.</p>;
  }

  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(listings.length / itemsPerPage);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentListings = listings.slice(indexOfFirstItem, indexOfLastItem);

  const nextPage = () => {
    setCurrentPage((prev: number) => Math.min(prev + 1, totalPages));
  };

  const prevPage = () => {
    setCurrentPage((prev: number) => Math.max(prev - 1, 1));
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">
        {listings.length} listings found (Page {currentPage} of {totalPages})
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {currentListings.map((listing) => (
          <div
            key={listing.document.title}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
          >
            <div className="relative w-full h-48">
              <img
                src={"/gambar.jpg"}
                alt={listing.document.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-4">
              <div className="flex flex-col h-full justify-between">
                <div>
                  <h3 className="text-xl font-semibold mb-2 line-clamp-2">
                    {listing.document.title}
                  </h3>
                  <div className="text-gray-600 text-sm space-y-2">
                    <p className="flex items-center gap-1">
                      <span className="font-medium">Location:</span>
                      <span>
                        {listing.document.location.lat.toFixed(3)},{" "}
                        {listing.document.location.lon.toFixed(3)}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <button className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition duration-200">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-8 flex justify-center items-center space-x-4">
        <button
          onClick={prevPage}
          disabled={currentPage === 1}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <span className="text-lg font-semibold">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={nextPage}
          disabled={currentPage === totalPages}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default ListingComponent;
