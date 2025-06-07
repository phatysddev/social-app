import React from "react";

export default function Container({ children }: {  children: React.ReactNode }) {
    return (
        <div className="my-0 mx-auto px-4 sm:px-8 md:px-0 w-full md:w-4/6 lg:w-5/6 xl:w-3/4 h-full">{ children }</div>
    );
}