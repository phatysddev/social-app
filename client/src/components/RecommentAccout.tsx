import { JSX } from "react";
import { IoIosAdd } from "react-icons/io";

import defaultProfile from "../assets/1741664792300-search.png";

export default function RecommentAccout(): JSX.Element {
    return (
        <div className="w-full h-[50px] flex justify-start items-center overflow-hidden">
          <div className="w-full h-[50px] flex justify-start items-center overflow-hidden">
            <div className="w-[42px] h-[42px] ms-2 shrink-0">
              <img
                className="w-full h-full"
                src={defaultProfile}
                alt="profile"
              />
            </div>
            <div className="mx-2">
              <h1 className="font-extrabold">Username</h1>
              <p className="text-gray-500 line-clamp-1">Bio..</p>
            </div>
          </div>
          <div className="w-[42px] h-[42px] ms-2 shrink-0">
            <IoIosAdd className="w-full h-full text-red-400" />
          </div>
        </div>
    );
}