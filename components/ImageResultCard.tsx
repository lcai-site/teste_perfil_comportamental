import React from 'react';

interface ImageResultCardProps {
  title: string;
  imageUrl: string;
}

export const ImageResultCard: React.FC<ImageResultCardProps> = ({ title, imageUrl }) => {
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden">
      <div className="p-6">
        <h3 className="text-2xl font-bold text-center text-teal-400">{title}</h3>
      </div>
      <div className="aspect-w-1 aspect-h-1 bg-black p-4">
        <img src={imageUrl} alt={title} className="w-full h-full object-contain" />
      </div>
    </div>
  );
};