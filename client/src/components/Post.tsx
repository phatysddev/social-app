import { JSX, useState, useEffect, useRef } from "react";

export default function Post(): JSX.Element {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (textRef.current) {
      setIsOverflowing(
        textRef.current.scrollHeight > textRef.current.clientHeight
      );
    }
  }, []);

  return (
    <>
      <div className="bg-white rounded overflow-hidden h-fit">
        {/* Header section post */}

        <div className="h-10 bg-red-400"></div>

        {/* Body section post */}

        <div className="h-fit bg-transparent">
          {/* Content text */}
          <div className="w-full px-4 py-2 text-sm indent-6">
            <p
              className={`overflow-hidden text-ellipsis break-words transition-all ${
                isExpanded ? "line-clamp-none" : "line-clamp-3"
              }`}
              ref={textRef}
            >
              Lorem ipsum dolor sit amet consectetur adipisicing elit.
              Laboriosam aspernatur distinctio, laudantium quo ipsum numquam
              porro illum tempore architecto nesciunt, quidem vitae soluta?
              Omnis, animi aperiam expedita illum voluptas repellat.
            </p>

            {/* See more and see less */}
            {isOverflowing && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-blue-500 hover:underline mt-1"
              >
                {isExpanded ? "See Less" : "See More"}
              </button>
            )}
          </div>
          {/* Content image optional */}
          <div className="max-h-96 bg-black overflow-hidden mb-2">
            <div className="h-96"></div>
          </div>
        </div>

        {/* Footer section post */}

        <div className="h-10 border-t border-red-400"></div>
      </div>
    </>
  );
}
