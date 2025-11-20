import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Container } from "@mui/material";

import LandingPage from "./components/LandingPage";
import DetailPage from "./pages/DetailPage";

export default function App(): JSX.Element {
  return (
    <BrowserRouter>
      <main>
        <div>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/item/:id" element={<DetailPage />} />
          </Routes>
        </div>
      </main>
    </BrowserRouter>
  );
}
