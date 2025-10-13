import React from 'react';

interface ImageResultCardProps {
  title: string;
  imageUrl: string;
  filename: string;
}

export const ImageResultCard: React.FC<ImageResultCardProps> = ({ title, imageUrl, filename }) => {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:border-teal-500/50">
      <div className="p-6">
        <h3 className="text-2xl font-bold text-center text-teal-400">{title}</h3>
      </div>
      <div className="aspect-w-1 aspect-h-1 bg-gray-900">
        <img src={imageUrl} alt={title} className="w-full h-full object-contain" />
      </div>
      <div className="p-6">
        <button
          onClick={handleDownload}
          className="w-full flex items-center justify-center bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 focus:outline-none focus:ring-4 focus:ring-teal-500/50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Baixar Imagem
        </button>
      </div>
    </div>
  );
};