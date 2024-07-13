import { TaskData } from "../../lib/models";
import projectCardTemplate from "../../assets/images/project_card.jpg";
import designCardTemplate from "../../assets/images/design_dep_card.jpg";
import adminCardTemplate from "../../assets/images/admin_dep_card.jpg";
import engineerCardTemplate from "../../assets/images/engineer_dep_card.jpg";
import marketingCardTemplate from "../../assets/images/marketing_dep_card.jpg";
import misCardTemplate from "../../assets/images/mis_dep_card.jpg";
import operationCardTemplate from "../../assets/images/operation_dep_card.jpg";
import salesCardTemplate from "../../assets/images/sales_dep_card.jpg";

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
  fontColor: string;
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

function generateArray(
  initialValue: number,
  diff: number,
  count: number
): number[] {
  const result: number[] = [];
  for (let i = 0; i < count; i++) {
    result.push(initialValue + i * diff);
  }
  return result;
}

export const projectCardInfo: CardTemplateInfo = {
  backgroundImage: projectCardTemplate,
  project: generateCombinations(
    generateArray(200, 640, 5),
    generateArray(340, 1060, 2)
  ),

  milestone: generateCombinations(
    generateArray(200, 640, 5),
    generateArray(460, 1060, 2)
  ),
  userId: generateCombinations(
    generateArray(200, 640, 5),
    generateArray(610, 1060, 2)
  ),
  name: generateCombinations(
    generateArray(200, 640, 5),
    generateArray(680, 1060, 2)
  ),
  qrCode: generateCombinations(
    generateArray(310, 640, 5),
    generateArray(800, 1060, 2)
  ),
  fontColor: "#FFFFFF",
};

const depCardUserIdPos = generateCombinations(
  generateArray(480, 640, 5),
  generateArray(620, 1060, 2)
);
const depCardNamePos = generateCombinations(
  generateArray(480, 640, 5),
  generateArray(700, 1060, 2)
);
const depCardQRCodeIdPos = generateCombinations(
  generateArray(325, 640, 5),
  generateArray(780, 1060, 2)
);
const depCardFontColor = "#1a4499";

export const designCardInfo: CardTemplateInfo = {
  backgroundImage: designCardTemplate,
  userId: depCardUserIdPos,
  name: depCardNamePos,
  qrCode: depCardQRCodeIdPos,
  fontColor: depCardFontColor,
};

export const getBackgroundImage = (dep: string) => {
  dep = dep.toLowerCase();

  if (dep === "admin") {
    return adminCardTemplate;
  }
  if (dep === "design") {
    return designCardInfo;
  }
  if (dep === "engineer") {
    return engineerCardTemplate;
  }
  if (dep === "marketing") {
    return marketingCardTemplate;
  }
  if (dep === "mis") {
    return misCardTemplate;
  }
  if (dep === "operation") {
    return operationCardTemplate;
  }
  if (dep === "sales") {
    return salesCardTemplate;
  }
  // Engineer the best
  return engineerCardTemplate;
};

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
