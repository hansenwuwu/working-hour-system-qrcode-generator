import { TaskData } from "../../lib/models";
import projectCardTemplate from "../../assets/images/project.jpg";
import designCardTemplate from "../../assets/images/design.jpg";
import adminCardTemplate from "../../assets/images/admin.jpg";
import engineerCardTemplate from "../../assets/images/engineer.jpg";
import marketingCardTemplate from "../../assets/images/marketing.jpg";
import misCardTemplate from "../../assets/images/mis.jpg";
import operationCardTemplate from "../../assets/images/operation.jpg";
import salesCardTemplate from "../../assets/images/sales.jpg";
import qcsCardTemplate from "../../assets/images/qcs.jpg";

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
  avatar: Pos[];
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
    generateArray(400, 640, 5),
    generateArray(610, 1060, 2)
  ),
  name: generateCombinations(
    generateArray(400, 640, 5),
    generateArray(680, 1060, 2)
  ),
  qrCode: generateCombinations(
    generateArray(307, 638, 5),
    generateArray(827, 1063, 2)
  ),
  avatar: generateCombinations(
    generateArray(200, 640, 5),
    generateArray(555, 1060, 2)
  ),
  fontColor: "#FFFFFF",
};

const depCardUserIdPos = generateCombinations(
  generateArray(467, 638, 5),
  generateArray(710, 1060, 2)
);
const depCardNamePos = generateCombinations(
  generateArray(467, 638, 5),
  generateArray(770, 1060, 2)
);
const depCardQRCodeIdPos = generateCombinations(
  generateArray(307, 638, 5),
  generateArray(827, 1063, 2)
);
const depCardAvatarPos = generateCombinations(
  generateArray(385, 638, 5),
  generateArray(500, 1060, 2)
);
const depCardFontColor = "#1a4499";

export const designCardInfo: CardTemplateInfo = {
  backgroundImage: designCardTemplate,
  userId: depCardUserIdPos,
  name: depCardNamePos,
  qrCode: depCardQRCodeIdPos,
  avatar: depCardAvatarPos,
  fontColor: depCardFontColor,
};

const depToTemplate: { [id: string]: any } = {
  admin: adminCardTemplate,
  design: designCardTemplate,
  engineer: engineerCardTemplate,
  marketing: marketingCardTemplate,
  mis: misCardTemplate,
  operation: operationCardTemplate,
  sales: salesCardTemplate,
  qcs: qcsCardTemplate,
};

export const getBackgroundImage = (dep: string) => {
  dep = dep.toLowerCase();

  if (dep in depToTemplate) {
    return depToTemplate[dep];
  }
  if (dep == "q/cs") {
    return depToTemplate.qcs;
  }

  // Engineer the best
  return engineerCardTemplate;
};

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const loadBgImage = (imgSrc: any) => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = imgSrc;
    image.onload = async () => {
      resolve(image);
    };
  });
};

export const extractPrefix = (filename: string): string => {
  const match = filename.match(/^([A-Za-z0-9]+)_/);
  return match ? match[1] : "";
};

export const importAll = (r: __WebpackModuleApi.RequireContext) => {
  let images: { [key: string]: string } = {};
  r.keys().forEach((item: string) => {
    images[extractPrefix(item.replace("./", ""))] = r(item);
  });
  return images;
};
