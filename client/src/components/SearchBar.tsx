import { JSX } from "react";

export default function SearchBar(): JSX.Element {
  return (
    <form className="mx-auto">
      <label
        htmlFor="default-search"
        className="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white"
      >
        Search
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
          <svg
            className="w-4 h-4 text-gray-500 dark:text-gray-400"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 20 20"
          >
            <path
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
            />
          </svg>
        </div>
        <input type="search" className="block text-sm text-gray-900 pe-[72px] ps-10 py-1 w-64 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:w-80 transition-all" />
        <button type="button" className="absolute text-red-400 end-2 top-1/2 h-3/4 px-2 bg-white border-2 border-red-400 hover:bg-red-200 transition-colors cursor-pointer rounded text-sm" style={{
            transform: "translate(0, -50%)"
        }}>Search</button>
      </div>
    </form>
  );
}
