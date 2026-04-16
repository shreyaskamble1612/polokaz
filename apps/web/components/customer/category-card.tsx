"use client";

import { ChevronRightIcon } from "@radix-ui/react-icons";

interface CategoryCardProps {
  title: string;
  description: string;
  image?: string;
  onExplore?: () => void;
}

export function CategoryCard({ title, description, image, onExplore }: CategoryCardProps) {
  return (
    <article className="flex overflow-hidden rounded-lg border border-[#DEDEDE] bg-white hover:shadow-md transition-shadow">
      {/* <img
        src={image || ""}
        alt={title}
        className="h-full w-[130px] object-cover"
      /> */}
      <div className="flex flex-col gap-2 p-4">
        <h3 className="font-inter text-[20px] font-medium">
          {title}
        </h3>
        <p className="font-inter text-[12px] text-[#AFAFAF]">
          {description}
        </p>
        <button
          onClick={onExplore}
          className="mt-auto inline-flex items-center gap-2 font-inter text-[16px] text-[#0378ED] hover:underline"
        >
          Explore now
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}

