import React from "react";

interface AvatarProps {
  src?: string;
  alt: string;
  size?: "sm" | "md" | "lg" | "xl";
  rounded?: boolean;
}

const Avatar = ({ src, alt, size = "md", rounded = true }: AvatarProps) => {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-24 h-24",
  };

  return (
    <div
      className={`inline-block overflow-hidden ${
        rounded ? "rounded-full" : "rounded-md"
      } ${sizeClasses[size]} border-2 border-gray-300`}
    >
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <div className="flex items-center justify-center w-full h-full bg-gray-200 text-gray-600 text-xl">
          {alt ? alt[0].toUpperCase() : "?"}
        </div>
      )}
    </div>
  );
};

export default Avatar;
