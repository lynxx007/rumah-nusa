import { create, insertMultiple } from "@orama/orama";
import newData from "../data/new-data.json";
export const db = create({
  schema: {
    market_title: "string",
    _geoloc: "geopoint",
    image: "string[]",
    price: "number",
    listing_id: "string",
    location_address: "string",
  },
});
async function insertData() {
  //@ts-ignore
  await insertMultiple(db, newData);
}
insertData().then(() => console.log("Data inserted"));
