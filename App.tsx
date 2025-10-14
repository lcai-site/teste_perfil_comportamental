
import React, { useState, useEffect, useCallback } from 'react';
import { useUrlQuery } from './hooks/useUrlQuery';
import { generateAnimalImage, generateBrainImage, sendToN8N, AnimalData } from './services/imageProcessor';
import { ImageResultCard } from './components/ImageResultCard';
import { Loader } from './components/Loader';

// URLs das imagens base
const BASE_IMAGE_BRAIN_URL = 'https://i.postimg.cc/LXMYjwtX/Inserir-um-t-tulo-6.png';
const BASE_IMAGE_ANIMALS_URL = 'https://i.postimg.cc/6QDYdjPb/Design-sem-nome-17.png';

type SubmissionState = 'idle' | 'sending' | 'success' | 'error';

/**
 * Analisa os parâmetros da consulta da URL para obter os dados da aplicação.
 * Suporta o novo parâmetro JSON `data` e recorre aos parâmetros individuais legados como fallback.
 * Para o formato legado, infere o animal "Principal" com base na maior pontuação.
 * @param query - O objeto URLSearchParams da URL.
 * @returns Um objeto de dados estruturado ou nulo se nenhum dado válido for encontrado.
 */
const getNormalizedDataFromQuery = (query: URLSearchParams): Record<string, any> | null => {
  const dataParam = query.get('data');
  if (dataParam) {
    try {
      return JSON.parse(dataParam);
    } catch (e) {
      throw new Error("O valor do parâmetro 'data' não é um JSON válido.");
    }
  }

  // Fallback para o tratamento de parâmetros legados
  const legacyParams: { [key: string]: string } = {
    A: 'aguia', G: 'gato', T: 'tubarao', L: 'lobo',
    "Razão Esquerdo": 'razao', "Emoção Direito": 'emocao',
    "Pensante Anterior": 'pensante', "Atuante Posterior": 'atuante',
  };

  const jsonData: Record<string, any> = {};
  let hasLegacyParams = false;

  for (const [key, paramName] of Object.entries(legacyParams)) {
    const value = query.get(paramName);
    if (value !== null) {
      jsonData[key] = value;
      hasLegacyParams = true;
    }
  }

  if (!hasLegacyParams) {
    return null; // Nenhum dado encontrado
  }

  // Infere o "Principal" para o formato legado, encontrando o animal com a maior porcentagem
  const animalScores: { [key: string]: number } = {
    'Águia': parseInt(jsonData.A, 10) || 0,
    'Gato': parseInt(jsonData.G, 10) || 0,
    'Tubarão': parseInt(jsonData.T, 10) || 0,
    'Lobo': parseInt(jsonData.L, 10) || 0,
  };
  
  let principalAnimal = 'Águia'; // Valor padrão
  let maxScore = -1;

  for (const [animal, score] of Object.entries(animalScores)) {
    if (score > maxScore) {
      maxScore = score;
      principalAnimal = animal;
    }
  }
  jsonData['Principal'] = principalAnimal;

  return jsonData;
};

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

    try {
      const jsonData = getNormalizedDataFromQuery(query);

      if (!jsonData) {
        setError('Parâmetro "data" não encontrado na URL. Forneça um objeto JSON URL-encoded com os dados necessários.');
        setLoading(false);
        return;
      }

      const requiredKeys = ["A", "G", "T", "L", "Principal", "Emoção Direito", "Razão Esquerdo", "Pensante Anterior", "Atuante Posterior"];
      const missingKeys = requiredKeys.filter(key => !(key in jsonData));
      if (missingKeys.length > 0) {
        throw new Error(`As seguintes chaves estão faltando nos dados da URL: ${missingKeys.join(', ')}`);
      }

      const animalData: AnimalData = {
        aguia: parseInt(jsonData.A, 10),
        gato: parseInt(jsonData.G, 10),
        tubarao: parseInt(jsonData.T, 10),
        lobo: parseInt(jsonData.L, 10),
      };

      const brainData = {
        razao: parseInt(jsonData["Razão Esquerdo"], 10),
        emocao: parseInt(jsonData["Emoção Direito"], 10),
        pensante: parseInt(jsonData["Pensante Anterior"], 10),
        atuante: parseInt(jsonData["Atuante Posterior"], 10),
      };
      
      const allData = { ...animalData, ...brainData };
      const invalidParams = Object.entries(allData).filter(([, value]) => isNaN(value)).map(([key]) => key);
      if (invalidParams.length > 0) {
        throw new Error(`Os seguintes parâmetros contêm valores inválidos (não são números): ${invalidParams.join(', ')}.`);
      }

      const principalAnimalFullName = jsonData.Principal;
      const animalNameMap: { [key: string]: keyof AnimalData } = {
          'Águia': 'aguia',
          'Gato': 'gato',
          'Tubarão': 'tubarao',
          'Lobo': 'lobo'
      };
      const principalAnimalKey = animalNameMap[principalAnimalFullName];

      if (!principalAnimalKey) {
        throw new Error(`Valor de "Principal" inválido: "${principalAnimalFullName}". Valores esperados: Águia, Gato, Tubarão, Lobo.`);
      }

      const [generatedAnimalImg, generatedBrainImg] = await Promise.all([
        generateAnimalImage(BASE_IMAGE_ANIMALS_URL, animalData, principalAnimalKey),
        generateBrainImage(BASE_IMAGE_BRAIN_URL, brainData),
      ]);
      setAnimalImage(generatedAnimalImg);
      setBrainImage(generatedBrainImg);

      setSubmissionState('sending');
      try {
        await sendToN8N({
          animalImage: generatedAnimalImg,
          brainImage: generatedBrainImg,
          params: jsonData,
        });
        setSubmissionState('success');
      } catch (n8nError) {
        console.error('N8N submission failed:', n8nError);
        setSubmissionState('error');
        setSubmissionError(n8nError instanceof Error ? n8nError.message : 'Ocorreu um erro desconhecido.');
      }

    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido ao processar os dados.';
      setError(`Falha ao processar dados: ${errorMessage}`);
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
          <p className="mt-4 text-gray-400">Exemplo de URL correta (JSON precisa ser URL-encoded):<br/>
          <code className="text-sm bg-gray-900 p-1 rounded">{'?data={"A":35,"G":20,"T":30,"L":15,"Principal":"Águia","Razão Esquerdo":55,"Emoção Direito":45,"Pensante Anterior":60,"Atuante Posterior":40}'}</code>
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
    <div className="min-h-screen bg-black text-gray-100 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
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
