import { TaskData } from "../../lib/models";
import projectCardTemplate from "../../assets/images/project_card.jpg";

export const TIMECARD_URL =
  "https://hansenwuwu.github.io/working-hour-system-fe";

export const CARD_WIDTH = 550;
export const CARD_LINE_HEIGHT = 55;

export function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  let words = text.split(" ");
  let line = "";
  let yPosition = y;

  for (let i = 0; i < words.length; i++) {
    let testLine = line + words[i] + " ";
    let metrics = ctx.measureText(testLine);
    let testWidth = metrics.width;

    if (testWidth > maxWidth && i > 0) {
      ctx.fillText(line, x, yPosition);
      line = words[i] + " ";
      yPosition += lineHeight;
    } else {
      line = testLine;
    }
  }

  ctx.fillText(line, x, yPosition);
}

export const uniquePairs = (list: TaskData[]): TaskData[] => {
  const seen = new Set<string>();
  return list.filter((pair) => {
    const key = `${pair.member}-${pair.type}`;
    if (seen.has(key)) {
      return false;
    } else {
      seen.add(key);
      return true;
    }
  });
};

interface Pos {
  x: number;
  y: number;
}

export interface CardTemplateInfo {
  backgroundImage: any;
  project?: Pos[];
  milestone?: Pos[];
  userId: Pos[];
  name: Pos[];
  qrCode: Pos[];
}

const generateCombinations = (rows: number[], cols: number[]): Pos[] => {
  const combinations: Pos[] = [];

  cols.forEach((col) => {
    rows.forEach((row) => {
      const pos: Pos = { x: row, y: col };
      combinations.push(pos);
    });
  });

  return combinations;
};

export const projectCardInfo: CardTemplateInfo = {
  backgroundImage: projectCardTemplate,
  project: generateCombinations([200, 840, 1480, 2120, 2760], [340, 1400]),
  milestone: generateCombinations([200, 840, 1480, 2120, 2760], [420, 1480]),
  userId: generateCombinations([200, 840, 1480, 2120, 2760], [620, 1680]),
  name: generateCombinations([200, 840, 1480, 2120, 2760], [700, 1760]),
  qrCode: generateCombinations([330, 970, 1610, 2250, 2890], [800, 1860]),
};

// export const depCardInfo: CardTemplateInfo = {
//   backgroundImage: projectCardTemplate,
// };
