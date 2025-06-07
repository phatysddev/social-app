import { JSX } from "react";
import { Outlet } from "react-router";

import Navbar from "../components/Navbar";

export default function MainLayout(): JSX.Element {
    return (
        <>
            <Navbar />
            <Outlet />
        </>
    );
}