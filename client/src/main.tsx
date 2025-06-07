import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";

import "./index.css";

import MainLayout from "./layouts/MainLayout";
import Home from "./pages/Home";

createRoot(document.getElementById("root")!).render(
    <BrowserRouter>
        <Routes>
            <Route element={ <MainLayout /> }>
                <Route index element={ <Home /> } />
            </Route>
        </Routes>
    </BrowserRouter>
);