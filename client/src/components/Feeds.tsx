import { JSX } from "react";

import Post from "./Post";

export default function Feeds(): JSX.Element { 
  return (
    <div className="pt-4 max-h-screen-post h-full scrollbar-none overflow-y-scroll grid grid-cols-1 gap-4">
      {/* Each posts */}
      <Post />
      <Post />
      <Post />
    </div>
  );
}
