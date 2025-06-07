import { JSX } from "react";

import Self from "../components/Self";
import Feeds from "../components/Feeds";
import Recomment from "../components/Recomment";

export default function FeedLayout(): JSX.Element {
    return (
        <div className="w-full h-screen-nav flex flex-row">
            <div className="flex-3/12 hidden lg:block">
                <Self />
            </div>
            <div className="flex-6/12">
                <Feeds />
            </div>
            <div className="flex-3/12 hidden lg:block">
                <Recomment />
            </div>
        </div>
    );
}