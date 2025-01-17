import "./index.css";

import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App";
import List from "./routes/List";
import Map from "./routes/Map";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/listings/:id",
    element: <List />,
  },
  {
    path: "/map/:id/:location/:lat/:lon",
    element: <Map />,
  },
]);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
