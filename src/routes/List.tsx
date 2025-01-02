import { useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useEffect, useRef, useState } from "react";
import { search } from "@orama/orama";
import { db } from "../lib/orama";
import {
  Bath,
  Bed,
  BedDouble,
  Building2,
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
export default function List() {
  let { id } = useParams();
  const [data, setData] = useState<any>({});
  const mapRef = useRef(null);

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
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      {data.document !== undefined ? (
        <main className="flex flex-col p-4 md:p-16 pt-40 pb-20">
          <div className="flex w-full items-center justify-end  md:justify-center space-x-4">
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
      {data.document !== undefined && (
        <footer className="md:hidden flex justify-between items-center space-x-16 fixed bottom-0 left-0 w-full bg-gray-200 text-center text-red-300 p-4 z-10">
          <div className="flex flex-row space-x-4">
            <h1 className="font-bold ">Rp {data.document.price}</h1>
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
