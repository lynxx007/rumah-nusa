import { create, insertMultiple } from "@orama/orama";
import newData from "../data/new-data.json";
export const db = create({
  schema: {
    market_title: "string",
    _geoloc: "geopoint",
    image: "string[]",
    price: "number",
    listing_id: "string",
  },
});
//@ts-ignore
await insertMultiple(db, newData);
