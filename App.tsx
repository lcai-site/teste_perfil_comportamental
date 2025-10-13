import React, { useState, useEffect, useCallback } from 'react';
import { useUrlQuery } from './hooks/useUrlQuery';
import { generateAnimalImage, generateBrainImage, sendToN8N } from './services/imageProcessor';
import { ImageResultCard } from './components/ImageResultCard';
import { Loader } from './components/Loader';

// URLs das imagens base
const BASE_IMAGE_BRAIN_URL = 'https://i.postimg.cc/LXMYjwtX/Inserir-um-t-tulo-6.png';
const BASE_IMAGE_ANIMALS_URL = 'https://i.postimg.cc/6QDYdjPb/Design-sem-nome-17.png';

type SubmissionState = 'idle' | 'sending' | 'success' | 'error';

const App: React.FC = () => {
  const query = useUrlQuery();
  const [brainImage, setBrainImage] = useState<string | null>(null);
  const [animalImage, setAnimalImage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [submissionState, setSubmissionState] = useState<SubmissionState>('idle');
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const processImages = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSubmissionState('idle');

    const aguia = query.get('aguia');
    const gato = query.get('gato');
    const tubarao = query.get('tubarao');
    const lobo = query.get('lobo');
    const razao = query.get('razao');
    const emocao = query.get('emocao');
    const pensante = query.get('pensante');
    const atuante = query.get('atuante');

    const params = { aguia, gato, tubarao, lobo, razao, emocao, pensante, atuante };

    const missingParams = Object.entries(params).filter(([, value]) => value === null).map(([key]) => key);
    if (missingParams.length > 0) {
      setError(`Parâmetros não encontrados na URL: ${missingParams.join(', ')}. Verifique se todos os 8 parâmetros foram fornecidos.`);
      setLoading(false);
      return;
    }

    const animalData = {
      aguia: parseInt(aguia!, 10),
      gato: parseInt(gato!, 10),
      tubarao: parseInt(tubarao!, 10),
      lobo: parseInt(lobo!, 10),
    };

    const brainData = {
      razao: parseInt(razao!, 10),
      emocao: parseInt(emocao!, 10),
      pensante: parseInt(pensante!, 10),
      atuante: parseInt(atuante!, 10),
    };
    
    const allData = { ...animalData, ...brainData };
    const invalidParams = Object.entries(allData).filter(([, value]) => isNaN(value)).map(([key]) => key);
    if (invalidParams.length > 0) {
      setError(`Os seguintes parâmetros contêm valores inválidos: ${invalidParams.join(', ')}. Eles devem ser números.`);
      setLoading(false);
      return;
    }

    try {
      const [generatedAnimalImg, generatedBrainImg] = await Promise.all([
        generateAnimalImage(BASE_IMAGE_ANIMALS_URL, animalData),
        generateBrainImage(BASE_IMAGE_BRAIN_URL, brainData),
      ]);
      setAnimalImage(generatedAnimalImg);
      setBrainImage(generatedBrainImg);

      setSubmissionState('sending');
      try {
        await sendToN8N({
          animalImage: generatedAnimalImg,
          brainImage: generatedBrainImg,
          params: allData,
        });
        setSubmissionState('success');
      } catch (n8nError) {
        console.error('N8N submission failed:', n8nError);
        setSubmissionState('error');
        setSubmissionError(n8nError instanceof Error ? n8nError.message : 'Ocorreu um erro desconhecido.');
      }

    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido ao processar as imagens.';
      setError(`Falha ao gerar imagens: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    processImages();
  }, [processImages]);

  const renderSubmissionStatus = () => {
    if (submissionState === 'idle') return null;

    let message = '';
    let textColor = 'text-gray-400';
    let isPulsing = false;

    switch (submissionState) {
      case 'sending':
        message = 'Enviando resultados para o sistema...';
        isPulsing = true;
        break;
      case 'success':
        message = '✅ Resultados enviados com sucesso!';
        textColor = 'text-green-400';
        break;
      case 'error':
        message = `❌ Falha ao enviar os resultados.`;
        textColor = 'text-red-400';
        break;
    }

    return (
        <div className="mt-8 text-center">
            <p className={`text-lg ${textColor} ${isPulsing ? 'animate-pulse' : ''}`}>
                {message}
            </p>
            {submissionState === 'error' && submissionError && (
                 <p className="text-sm text-red-500 mt-1 font-mono">{submissionError}</p>
            )}
        </div>
    );
  };

  const renderContent = () => {
    if (loading) {
      return <Loader />;
    }

    if (error) {
      return (
        <div className="text-center p-8 bg-red-900/50 border border-red-700 rounded-lg max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-red-400 mb-2">Erro</h2>
          <p className="text-red-300 font-mono break-words">{error}</p>
          <p className="mt-4 text-gray-400">Exemplo de URL correta:<br/>
          <code className="text-sm">?lobo=15&amp;aguia=30&amp;tubarao=25&amp;gato=20&amp;razao=48&amp;emocao=52&amp;pensante=52&amp;atuante=48</code>
          </p>
        </div>
      );
    }

    if (animalImage && brainImage) {
      return (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            <ImageResultCard
              title="Perfil Comportamental"
              imageUrl={animalImage}
            />
            <ImageResultCard
              title="Mapeamento Cerebral"
              imageUrl={brainImage}
            />
          </div>
          {renderSubmissionStatus()}
        </>
      );
    }
    
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      <header className="text-center mb-8 lg:mb-12">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500">
          Seu Resultado Personalizado
        </h1>
        <p className="mt-4 text-lg text-gray-400 max-w-3xl mx-auto">
          As imagens abaixo foram geradas dinamicamente com base no seu perfil.
        </p>
      </header>
      <main className="w-full max-w-6xl">
        {renderContent()}
      </main>
      <footer className="mt-12 text-center text-gray-500">
        <p>&copy; {new Date().getFullYear()} - Processamento de Imagem Dinâmica</p>
      </footer>
    </div>
  );
};

export default App;