import { JSX, useState } from "react";

import defaultProfile from "../assets/1741664792300-search.png";

export default function Self(): JSX.Element {
  const [hiddenBio, setHiddenBio] = useState<boolean>(true);
  return (
    <div className="w-full h-full px-4 pt-4 bg-transparent flex flex-col justify-items-start items-center">
      <div className="w-full bg-white border-t-2 border-red-400 overflow-hidden rounded flex flex-col justify-start items-center">
        <div className="mt-4 rounded-full overflow-hidden">
          <img className="w-32 h-32 cursor-pointer" src={defaultProfile} alt="profile" title="View profile..." />
        </div>
        <div className="mt-4 text-xl font-extrabold cursor-pointer" title="View profile...">Username</div>
        <div
          onClick={() => setHiddenBio(!hiddenBio)}
          className={`mt-2 px-4 max-w-xs text-sm text-center text-gray-500 cursor-pointer transition-all duration-300 ${hiddenBio ? "max-h-8 overflow-hidden" : "max-h-96"}`}
          title="Show bio..."
        >
          Lorem ipsum dolor, sit amet consectetur adipisicing elit. Consectetur
          libero ipsa quidem hic. Fuga recusandae iusto doloribus rerum cumque,
          eligendi minima eveniet? Debitis, voluptatibus consequatur. Quasi
          adipisci odio dolore tempora. lo
        </div>
        <div className="h-[50px] mt-4 w-full flex items-center justify-center">
            <button className="block flex-1/2 h-full cursor-pointer bg-red-400 hover:bg-red-500 transition-colors text-white"><span className="font-extrabold me-1">0</span> follwer</button>
            <div className="w-[1px] h-full bg-white"></div>
            <button className="block flex-1/2 h-full cursor-pointer bg-red-400 hover:bg-red-500 transition-colors text-white"><span className="font-extrabold me-1">0</span> follwing</button>
        </div>
      </div>
      <div className="mt-4 w-full bg-white border-t-2 border-red-400 overflow-hidden rounded flex flex-col justify-start items-center">
        <button className="h-[50px] w-full text-red-400 active:text-red-500 font-extrabold hover:bg-gray-100 cursor-pointer transition-colors">View profile</button>
        <button className="h-[50px] w-full text-red-400 active:text-red-500 font-extrabold hover:bg-gray-100 cursor-pointer transition-colors">My post</button>
        <button className="h-[50px] w-full text-red-400 active:text-red-500 font-extrabold hover:bg-gray-100 cursor-pointer transition-colors">Setting</button>
        <button className="h-[50px] w-full text-white active:text-gray-100 bg-red-400 hover:bg-red-500 font-extrabold cursor-pointer transition-colors">Sign out</button>
      </div>
    </div>
  );
}
