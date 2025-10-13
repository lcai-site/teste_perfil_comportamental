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
      canvas.width = img.width;
      canvas.height = img.height;
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
      const highestColor = '#FF4136'; // Vermelho vibrante

      const positions: { [key: string]: { x: number; y: number } } = {
        lobo: { x: 45, y: 450 },
        aguia: { x: 585, y: 450 },
        tubarao: { x: 45, y: 990 },
        gato: { x: 585, y: 990 },
      };

      for (const [name, percentage] of animalEntries) {
        const isHighest = name === highestAnimalName;
        const fontSize = isHighest ? highestFontSize : normalFontSize;
        const color = isHighest ? highestColor : normalColor;
        const font = `bold ${fontSize}px ${fontName}`;
        const text = `${percentage}%`;
        const { x, y } = positions[name as keyof AnimalData];

        drawTextWithShadow(ctx, text, x, y, font, color, 'left', 'bottom');
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
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
  
        if (!ctx) {
          return reject(new Error('Não foi possível obter o contexto do canvas.'));
        }
  
        ctx.drawImage(img, 0, 0);
        
        const fontName = 'Montserrat, sans-serif';
        const fontSize = 60;
        const color = '#FFFFFF';
        const font = `bold ${fontSize}px ${fontName}`;

        const positions: { [key: string]: { x: number; y: number } } = {
            pensante: { x: 540, y: 295 },
            razao: { x: 220, y: 680 },
            emocao: { x: 860, y: 680 },
            atuante: { x: 540, y: 995 },
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