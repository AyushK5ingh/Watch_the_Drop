"use client";
import { useState } from "react";

export const TruncatedDescription = ({
  description,
}: {
  description: string;
}) => {
  const [showFull, setShowFull] = useState(false);
  const MAX_CHARS = 500;
  const isLong = description.length > MAX_CHARS;

  return (
    <div className="flex flex-col gap-4 sm:w-full max-w-full overflow-hidden">
      <p className="text-gray-600 break-words whitespace-pre-wrap">
        {showFull ? description : description.slice(0, MAX_CHARS) + "..."}
      </p>
      {isLong && (
        <button
          onClick={() => setShowFull(!showFull)}
          className="text-blue-600 hover:text-blue-800 font-medium mt-2 w-fit"
        >
          {showFull ? "Show Less" : "Show More"}
        </button>
      )}
    </div>
  );
};
