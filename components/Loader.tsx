
import React from 'react';

export const Loader: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8">
      <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-teal-500"></div>
      <h2 className="text-2xl font-semibold text-gray-300 mt-6">Processando Imagens...</h2>
      <p className="text-gray-400 mt-2">Aguarde um momento, estamos aplicando a mágica.</p>
    </div>
  );
};
