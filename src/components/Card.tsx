import React from "react";
import {
  Bath,
  BedDouble,
  Building2,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Star,
} from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";

interface ListingCardProps {
  imageUrl: string[];
  title: string;
  type?: string;
  location: string;
  dates?: string;
  price: number;
  rating?: number;
  id: string;
  description: string;
  beds?: number;
  floor?: number;
  baths?: number;
  width?: number;
}

const ListingCard: React.FC<ListingCardProps> = ({
  id,
  imageUrl,
  title,
  type,
  location,
  dates,
  price,
  rating,
  description,
  beds,
  floor,
  baths,
  width,
}) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });

  const scrollPrev = React.useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = React.useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);
  return (
    <div className="w-full max-w rounded overflow-hidden shadow-lg bg-white">
      <div className="relative">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {imageUrl.slice(0, 2).map((image, index) => (
              <div key={index} className="relative h-48 w-full flex-[0_0_100%]">
                <img
                  src={image}
                  alt={`${title} - Image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
        <button
          className="absolute top-1/2 left-2 transform -translate-y-1/2 bg-white rounded-full p-1 shadow-md"
          onClick={scrollPrev}
          aria-label="Previous image"
        >
          <ChevronLeft className="h-4 w-4 text-gray-600" />
        </button>
        <button
          className="absolute top-1/2 right-2 transform -translate-y-1/2 bg-white rounded-full p-1 shadow-md"
          onClick={scrollNext}
          aria-label="Next image"
        >
          <ChevronRight className="h-4 w-4 text-gray-600" />
        </button>
      </div>
      <a href={`/listings/${id}`}>
        <div className="px-6 py-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h2 className="font-bold text-xl mb-1">{title}</h2>
              <p className="text-gray-600 text-sm">
                {/* {description.slice(0, 40) + "..."} */}
              </p>
            </div>
            <div className="flex items-center">
              <Star className="h-4 w-4 text-red-500 mr-1" />
              <span className="text-sm font-semibold">
                {rating && rating.toFixed(1)}
              </span>
            </div>
          </div>
          <p className="text-gray-700 text-sm mb-2">{dates}</p>
          <p className="text-gray-900 font-bold mb-2">
            Rp{price.toLocaleString()}
          </p>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center">
              <BedDouble className="h-4 w-4 mr-1" />
              <span>{beds}</span>
            </div>
            <div className="flex items-center">
              <Bath className="h-4 w-4 mr-1" />
              <span>{baths}</span>
            </div>
            <div className="flex items-center">
              <Maximize2 className="h-4 w-4 mr-1" />
              <span>{width} m²</span>
            </div>
            <div className="flex items-center">
              <Building2 className="h-4 w-4 mr-1" />
              <span>{floor}</span>
            </div>
          </div>
        </div>
      </a>
    </div>
  );
};

export default ListingCard;
