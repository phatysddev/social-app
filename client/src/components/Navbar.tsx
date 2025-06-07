import { JSX } from "react";

import Container from "../layouts/Container";
import SearchBar from "./SearchBar";

export default function Navbar(): JSX.Element {
  return (
    <>
      <nav className="w-full h-[50px] bg-red-400">
        <Container>
          <div className="w-full h-full flex justify-between items-center">
            <div className="text-2xl text-white font-bold">Social App</div>
            <div className=""><SearchBar /></div>
          </div>
        </Container>
      </nav>
    </>
  );
}
