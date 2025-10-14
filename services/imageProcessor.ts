export interface AnimalData {
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
  params: { [key: string]: number | string };
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

  // Sombra para legibilidade (agora como um brilho centralizado)
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 0; // Removido o deslocamento para centralização perfeita
  ctx.shadowOffsetY = 0; // Removido o deslocamento para centralização perfeita

  ctx.fillText(text, x, y);
  
  // Reset shadow for next drawing
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
};


export const generateAnimalImage = (baseImageUrl: string, data: AnimalData, principalAnimalKey: keyof AnimalData): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = baseImageUrl;

    img.onload = async () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          return reject(new Error('Não foi possível obter o contexto do canvas.'));
        }

        // --- CORREÇÃO PARA HIGH DPI ---
        const dpr = window.devicePixelRatio || 1;
        canvas.width = img.width * dpr;
        canvas.height = img.height * dpr;
        ctx.scale(dpr, dpr);
        // --- FIM DA CORREÇÃO ---

        // Garante que a fonte customizada está carregada antes de desenhar o texto
        await document.fonts.ready;

        ctx.drawImage(img, 0, 0);

        const animalEntries = Object.entries(data);
        const highestAnimalName = principalAnimalKey;

        const fontName = 'Montserrat, sans-serif';
        const normalFontSize = 36; // Aumentado para melhor visibilidade
        const highestFontSize = 44; // Aumentado para maior destaque
        const normalColor = '#FFFFFF';
        const highestColor = '#FFED00'; // Amarelo vibrante

        // Posições ajustadas com precisão para o novo layout, ao lado dos títulos
        const positions: { [key: string]: { x: number; y: number } } = {
          lobo:    { x: 120, y: 280 },
          aguia:   { x: 420, y: 280 },
          tubarao: { x: 120, y: 620 },
          gato:    { x: 420, y: 620 },
        };

        for (const [name, percentage] of animalEntries) {
          const isHighest = name === highestAnimalName;
          const fontSize = isHighest ? highestFontSize : normalFontSize;
          const color = isHighest ? highestColor : normalColor;
          const font = `bold ${fontSize}px ${fontName}`;
          const text = `${percentage}%`;
          const { x, y } = positions[name as keyof AnimalData];

          drawTextWithShadow(ctx, text, x, y, font, color, 'right', 'middle');
        }

        resolve(canvas.toDataURL('image/png'));
      } catch (err) {
        reject(new Error(`Erro durante o processamento da imagem dos animais: ${err instanceof Error ? err.message : String(err)}`));
      }
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

    img.onload = async () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
  
        if (!ctx) {
          return reject(new Error('Não foi possível obter o contexto do canvas.'));
        }

        // --- CORREÇÃO PARA HIGH DPI ---
        const dpr = window.devicePixelRatio || 1;
        canvas.width = img.width * dpr;
        canvas.height = img.height * dpr;
        ctx.scale(dpr, dpr);
        // --- FIM DA CORREÇÃO ---
        
        // Garante que a fonte customizada está carregada antes de desenhar o texto
        await document.fonts.ready;
  
        ctx.drawImage(img, 0, 0);
        
        const fontName = 'Montserrat, sans-serif';
        const fontSize = 48; // Aumentado para maior destaque e consistência
        const color = '#FFFFFF';
        const font = `bold ${fontSize}px ${fontName}`;

        // Posições ajustadas para alinhar com os indicadores visuais (setas e títulos)
        const positions: { [key: string]: { x: number; y: number; align: CanvasTextAlign } } = {
            pensante: { x: 330, y: 240, align: 'center' }, // Acima do cérebro, alinhado com "PENSANTE"
            atuante:  { x: 350, y: 100, align: 'center' }, // Abaixo do cérebro, alinhado com "ATUANTE"
            razao:    { x: 50, y: 450, align: 'left'   }, // À esquerda, alinhado com a seta "RAZÃO"
            emocao:   { x: 330, y: 100, align: 'right'  }, // À direita, alinhado com a seta "EMOÇÃO"
        };
  
        // Refatorado para usar um loop para consistência e clareza
        const brainEntries = Object.entries(data) as [keyof BrainData, number][];

        for (const [name, percentage] of brainEntries) {
            const pos = positions[name];
            if(pos) {
                drawTextWithShadow(ctx, `${percentage}%`, pos.x, pos.y, font, color, pos.align, 'middle');
            }
        }
  
        resolve(canvas.toDataURL('image/png'));
      } catch (err) {
        reject(new Error(`Erro durante o processamento da imagem do cérebro: ${err instanceof Error ? err.message : String(err)}`));
      }
    };
  
      img.onerror = () => {
        reject(new Error(`Falha ao carregar a imagem base de ${baseImageUrl}. Verifique a URL e as políticas de CORS.`));
      };
  });
};