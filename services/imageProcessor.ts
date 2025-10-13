interface AnimalData {
  lobo: number;
  aguia: number;
  tubarao: number;
  gato: number;
}

interface BrainData {
  pensante: number;
  atuante: number;
  razao: number;
  emocao: number;
}

// --- N8N Integration ---

// IMPORTANTE: Substitua esta URL de placeholder pela URL real do seu webhook N8N.
const N8N_WEBHOOK_URL = 'https://n8n.lcai.com.br/webhook/imagensprontas';

interface N8nPayload {
  animalImage: string;
  brainImage: string;
  params: { [key: string]: number };
}

export const sendToN8N = async (payload: N8nPayload): Promise<void> => {
  // Verification to prevent sending to a placeholder URL
  if (N8N_WEBHOOK_URL.includes('your-n8n-instance.com') || N8N_WEBHOOK_URL.includes('placeholder')) {
    console.warn('URL do Webhook N8N é um placeholder. Envio ignorado. Por favor, configure a URL correta em services/imageProcessor.ts');
    // For demonstration, we resolve successfully to not show an error in the UI.
    // In a real application, you might want to throw an error here.
    return;
  }

  const response = await fetch(N8N_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Falha ao enviar dados para N8N. Status: ${response.status}. Corpo: ${errorBody}`);
  }
};


// --- Image Processing ---

const drawTextWithShadow = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  font: string,
  fillStyle: string,
  textAlign: CanvasTextAlign,
  textBaseline: CanvasTextBaseline
) => {
  ctx.font = font;
  ctx.fillStyle = fillStyle;
  ctx.textAlign = textAlign;
  ctx.textBaseline = textBaseline;

  // Sombra para legibilidade
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;

  ctx.fillText(text, x, y);
  
  // Reset shadow for next drawing
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
};


export const generateAnimalImage = (baseImageUrl: string, data: AnimalData): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = baseImageUrl;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width; // Should be 1080
      canvas.height = img.height; // Should be 1350
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        return reject(new Error('Não foi possível obter o contexto do canvas.'));
      }

      ctx.drawImage(img, 0, 0);

      const animalEntries = Object.entries(data);
      const [highestAnimalName] = animalEntries.reduce((max, current) => current[1] > max[1] ? current : max, animalEntries[0]);

      const fontName = 'Montserrat, sans-serif';
      const normalFontSize = 90;
      const highestFontSize = 120;
      const normalColor = '#FFFFFF';
      const highestColor = '#FFED00'; // Amarelo vibrante

      // Posições ajustadas para uma tela de 1080x1350, com alinhamento central.
      const positions: { [key: string]: { x: number; y: number } } = {
        lobo: { x: 270, y: 450 },     // Quadrante superior esquerdo
        aguia: { x: 810, y: 450 },    // Quadrante superior direito
        tubarao: { x: 270, y: 990 },  // Quadrante inferior esquerdo
        gato: { x: 810, y: 990 },     // Quadrante inferior direito
      };

      for (const [name, percentage] of animalEntries) {
        const isHighest = name === highestAnimalName;
        const fontSize = isHighest ? highestFontSize : normalFontSize;
        const color = isHighest ? highestColor : normalColor;
        const font = `bold ${fontSize}px ${fontName}`;
        const text = `${percentage}%`;
        const { x, y } = positions[name as keyof AnimalData];

        drawTextWithShadow(ctx, text, x, y, font, color, 'center', 'middle');
      }

      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = () => {
      reject(new Error(`Falha ao carregar a imagem base de ${baseImageUrl}. Verifique a URL e as políticas de CORS.`));
    };
  });
};


export const generateBrainImage = (baseImageUrl: string, data: BrainData): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = baseImageUrl;

    img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width; // Should be 1080
        canvas.height = img.height; // Should be 1350
        const ctx = canvas.getContext('2d');
  
        if (!ctx) {
          return reject(new Error('Não foi possível obter o contexto do canvas.'));
        }
  
        ctx.drawImage(img, 0, 0);
        
        const fontName = 'Montserrat, sans-serif';
        const fontSize = 60;
        const color = '#FFFFFF';
        const font = `bold ${fontSize}px ${fontName}`;

        // Posições ajustadas para a nova imagem do cérebro (1080x1350)
        const positions: { [key: string]: { x: number; y: number } } = {
            pensante: { x: 540, y: 295 },  // Topo
            razao: { x: 270, y: 680 },     // Esquerda
            emocao: { x: 810, y: 680 },    // Direita
            atuante: { x: 540, y: 995 },   // Base
        };
  
        drawTextWithShadow(ctx, `${data.pensante}%`, positions.pensante.x, positions.pensante.y, font, color, 'center', 'middle');
        drawTextWithShadow(ctx, `${data.razao}%`, positions.razao.x, positions.razao.y, font, color, 'center', 'middle');
        drawTextWithShadow(ctx, `${data.emocao}%`, positions.emocao.x, positions.emocao.y, font, color, 'center', 'middle');
        drawTextWithShadow(ctx, `${data.atuante}%`, positions.atuante.x, positions.atuante.y, font, color, 'center', 'middle');
  
        resolve(canvas.toDataURL('image/png'));
      };
  
      img.onerror = () => {
        reject(new Error(`Falha ao carregar a imagem base de ${baseImageUrl}. Verifique a URL e as políticas de CORS.`));
      };
  });
};