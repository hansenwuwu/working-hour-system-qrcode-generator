import React, { useState, useRef, useEffect } from "react";
import { Button, Input, QRCode, Space } from "antd";
import { getTasks, getMembers } from "../../lib/api";
import { MemberData, ProjectData, TaskData } from "../../lib/models";
import cardTemplate from "../../assets/images/card.jpg";
import JSZip from "jszip";
import { addQueryParamsToUrl } from "./model";

const rowDiffY = 700;
const projectY = 180;
const milestoneY = 220;
const useridY = 300;
const nameY = 340;
const qrcodeY = 390;
const projectPos = [
  {
    project: { x: 100, y: projectY },
    milestone: { x: 100, y: milestoneY },
    userid: { x: 100, y: useridY },
    name: { x: 100, y: nameY },
    qrcode: { x: 140, y: qrcodeY },
  },
  {
    project: { x: 420, y: projectY },
    milestone: { x: 420, y: milestoneY },
    userid: { x: 420, y: useridY },
    name: { x: 420, y: nameY },
    qrcode: { x: 420, y: qrcodeY },
  },
  {
    project: { x: 740, y: projectY },
    milestone: { x: 740, y: milestoneY },
    userid: { x: 740, y: useridY },
    name: { x: 740, y: nameY },
    qrcode: { x: 740, y: qrcodeY },
  },
  {
    project: { x: 1060, y: projectY },
    milestone: { x: 1060, y: milestoneY },
    userid: { x: 1060, y: useridY },
    name: { x: 1060, y: nameY },
    qrcode: { x: 1060, y: qrcodeY },
  },
  {
    project: { x: 1380, y: projectY },
    milestone: { x: 1380, y: milestoneY },
    userid: { x: 1380, y: useridY },
    name: { x: 1380, y: nameY },
    qrcode: { x: 1380, y: qrcodeY },
  },
  {
    project: { x: 100, y: projectY + rowDiffY },
    milestone: { x: 100, y: milestoneY + rowDiffY },
    userid: { x: 100, y: useridY + rowDiffY },
    name: { x: 100, y: nameY + rowDiffY },
    qrcode: { x: 100, y: qrcodeY + rowDiffY },
  },
  {
    project: { x: 420, y: projectY + rowDiffY },
    milestone: { x: 420, y: milestoneY + rowDiffY },
    userid: { x: 420, y: useridY + rowDiffY },
    name: { x: 420, y: nameY + rowDiffY },
    qrcode: { x: 420, y: qrcodeY + rowDiffY },
  },
  {
    project: { x: 740, y: projectY + rowDiffY },
    milestone: { x: 740, y: milestoneY + rowDiffY },
    userid: { x: 740, y: useridY + rowDiffY },
    name: { x: 740, y: nameY + rowDiffY },
    qrcode: { x: 740, y: qrcodeY + rowDiffY },
  },
];

function drawWrappedText(
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

export function StarterPage(props: {
  sheetId: string;
  setSheetId: CallableFunction;
  projectData: ProjectData | undefined;
  setProjectData: CallableFunction;
  loadings: boolean[];
  enterLoading: CallableFunction;
  exitLoading: CallableFunction;
  members: MemberData[];
  setMembers: CallableFunction;
  setCardType: CallableFunction;
  setCurPage: CallableFunction;
}) {
  const [cardInfo, setCardInfo] = useState<TaskData[]>([]);

  const [downloadLink, setDownloadLink] = useState<string | null>(null);

  const [downloadLinks, setDownloadLinks] = useState<string[]>([]);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [urls, setUrls] = useState<string[]>([]);

  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");

  const generateImageWithText = (
    tasks: TaskData[],
    qrCodeUrls: any
  ): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) return;

      const image = new Image();
      image.src = cardTemplate;

      image.onload = async () => {
        canvas.width = image.width;
        canvas.height = image.height;
        ctx.drawImage(image, 0, 0);

        for (let i = 0; i < tasks.length; i += 1) {
          const foundMember = props.members.find(
            (member) => member.englishName === tasks[i].member
          );

          ctx.font = "24px Arial";
          ctx.fillStyle = "green";

          if (props.projectData) {
            drawWrappedText(
              ctx,
              props.projectData.project,
              projectPos[i].project.x,
              projectPos[i].project.y,
              300,
              30
            );
          }

          drawWrappedText(
            ctx,
            "very long long long long milestone",
            projectPos[i].milestone.x,
            projectPos[i].milestone.y,
            300,
            30
          );

          if (foundMember) {
            drawWrappedText(
              ctx,
              foundMember.jobNumber,
              projectPos[i].userid.x,
              projectPos[i].userid.y,
              300,
              30
            );
          }

          drawWrappedText(
            ctx,
            `${tasks[i].member}`,
            projectPos[i].name.x,
            projectPos[i].name.y,
            300,
            30
          );
        }

        let loadcount = 0;
        for (let i = 0; i < tasks.length; i++) {
          const qrCodeImage = new Image();
          qrCodeImage.src = qrCodeUrls[i];
          qrCodeImage.onload = async () => {
            loadcount++;

            ctx.drawImage(
              qrCodeImage,
              projectPos[i].qrcode.x,
              projectPos[i].qrcode.y
            );

            if (loadcount == tasks.length) {
              const dataUrl = canvas.toDataURL("image/png");
              resolve(dataUrl);
            }
          };
        }
      };
    });
  };

  const uniquePairs = (list: TaskData[]): TaskData[] => {
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

  const getProjectData = (sheetId: string) => {
    const fetchData = async () => {
      props.enterLoading(1);
      try {
        const members = await getMembers(sheetId);
        props.setMembers(members);

        const projectData = await getTasks(sheetId);
        props.setProjectData(projectData);
        props.setCardType(projectData.cardType);

        setCardInfo(
          uniquePairs(projectData.tasks).sort((a, b) => {
            if (a.member < b.member) return -1;
            if (a.member > b.member) return 1;
            if (a.type < b.type) return -1;
            if (a.type > b.type) return 1;
            return 0;
          })
        );

        // props.setCurPage(PageType.GENERATOR);
      } catch (error) {
        console.error("Error:", error);
      }
      props.exitLoading(1);
    };
    fetchData();
  };

  useEffect(() => {
    setUrls(
      cardInfo.map((info) => {
        const foundMember = props.members.find(
          (member) => member.englishName === info.member
        );
        const url = "https://hansenwuwu.github.io/working-hour-system-fe";
        const queryParams = {
          id: props.sheetId,
          user: foundMember?.jobNumber || "",
          milestone: info.type,
        };
        const updatedUrl = addQueryParamsToUrl(url, queryParams);
        return updatedUrl;
      })
    );
  }, [cardInfo]);

  useEffect(() => {
    const qrUrls: string[] = [];
    for (let i = 0; i < urls.length; i++) {
      const canvas = document
        .getElementById(`qrcode-${i}`)
        ?.querySelector<HTMLCanvasElement>("canvas");
      if (canvas) {
        const qrUrl = canvas.toDataURL("image/png");
        qrUrls.push(qrUrl);
      }
    }

    const fetchData = async (qrUrls: any) => {
      const links: string[] = [];
      const zip = new JSZip();
      const chunkSize = 8;
      const chunkedLists: any[][] = [];
      const chunkedUrls: any[][] = [];
      for (let i = 0; i < cardInfo.length; i += chunkSize) {
        const chunk = cardInfo.slice(i, i + chunkSize);
        const urlChunk = qrUrls.slice(i, i + chunkSize);
        chunkedLists.push(chunk);
        chunkedUrls.push(urlChunk);
      }
      for (let i = 0; i < chunkedLists.length; i++) {
        const dataUrl = await generateImageWithText(
          chunkedLists[i],
          chunkedUrls[i]
        );
        const base64Data = dataUrl.split(",")[1];
        zip.file(`image_${i + 1}.png`, base64Data, { base64: true });
        links.push(dataUrl);
      }
      zip.generateAsync({ type: "blob" }).then((content) => {
        const downloadUrl = URL.createObjectURL(content);
        setDownloadLink(downloadUrl);
      });
      setDownloadLinks(links);
    };

    fetchData(qrUrls);
  }, [urls]);

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          width: "900px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          marginTop: "200px",
        }}
      >
        <Input
          size="large"
          placeholder="Google sheet ID"
          style={{ borderWidth: "3px", fontSize: "30px", height: "80px" }}
          disabled={props.loadings[1]}
          value={props.sheetId}
          onChange={(e) => {
            props.setSheetId(e.target.value);
          }}
        />
        <Button
          style={{
            marginTop: "20px",
            width: "200px",
            height: "60px",
            fontSize: "30px",
          }}
          type="primary"
          loading={props.loadings[1]}
          onClick={() => {
            getProjectData(props.sheetId);
          }}
        >
          Process
        </Button>
        {urls.map((url, index) => (
          <Space
            style={{ display: "none" }}
            id={`qrcode-${index}`}
            key={index}
            direction="vertical"
          >
            <QRCode value={url} size={120} />
          </Space>
        ))}
      </div>
      <div
        style={{
          width: "1200px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          marginTop: "200px",
        }}
      >
        <div style={{ width: "100%" }}>
          {downloadLink && (
            <a href={downloadLink} download="images.zip">
              Download All Image
            </a>
          )}
        </div>

        {downloadLinks.map((url, index) => (
          <div
            key={index}
            style={{ margin: "10px", textAlign: "center", width: "100%" }}
          >
            <img
              src={url}
              alt={`Image Preview ${index + 1}`}
              style={{ width: "100%" }}
            />
            <div>
              <a
                href={downloadLinks[index]}
                download={`image_with_text_${index + 1}.png`}
                style={{ width: "100%" }}
              >
                Download Image {index + 1}
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
