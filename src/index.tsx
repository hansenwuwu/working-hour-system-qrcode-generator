import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import reportWebVitals from "./reportWebVitals";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import CardGenerator from "./routes/CardGenerator/CardGenerator";
import CardGeneratorV2 from "./routes/CardGenerator/CardGeneratorV2";

const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <CardGeneratorV2 />,
    },
  ],
  { basename: "/working-hour-system-qrcode-generator" }
);

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
