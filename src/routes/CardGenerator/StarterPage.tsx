import React, { useState, useRef, useEffect } from "react";
import { Button, Input, QRCode, Space } from "antd";
import { getTasks, getMembers } from "../../lib/api";
import { MemberData, ProjectData, TaskData } from "../../lib/models";
import cardTemplate from "../../assets/images/card.jpg";
import projectCardTemplate from "../../assets/images/project_card.jpg";
import JSZip from "jszip";
import { addQueryParamsToUrl } from "./model";
import { drawWrappedText, projectCardInfo, CardTemplateInfo } from "./utils";
import {
  uniquePairs,
  TIMECARD_URL,
  CARD_WIDTH,
  CARD_LINE_HEIGHT,
} from "./utils";

const CHUNK_SIZE = 10;

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
  {
    project: { x: 740, y: projectY + rowDiffY },
    milestone: { x: 740, y: milestoneY + rowDiffY },
    userid: { x: 740, y: useridY + rowDiffY },
    name: { x: 740, y: nameY + rowDiffY },
    qrcode: { x: 740, y: qrcodeY + rowDiffY },
  },
  {
    project: { x: 740, y: projectY + rowDiffY },
    milestone: { x: 740, y: milestoneY + rowDiffY },
    userid: { x: 740, y: useridY + rowDiffY },
    name: { x: 740, y: nameY + rowDiffY },
    qrcode: { x: 740, y: qrcodeY + rowDiffY },
  },
];

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
  cardType: string;
  setCardType: CallableFunction;
  setCurPage: CallableFunction;
}) {
  const [cardInfo, setCardInfo] = useState<TaskData[]>([]);
  const [downloadLink, setDownloadLink] = useState<string | null>(null);
  const [downloadLinks, setDownloadLinks] = useState<string[]>([]);

  // data url for each QRCode
  const [qrCodeUrls, setQrCodeUrls] = useState<string[]>([]);

  const loadBgImage = (imgSrc: any) => {
    return new Promise((resolve, reject) => {
      const image = new Image();
      // TODO switch between project/dep card
      image.src = imgSrc;
      image.onload = async () => {
        resolve(image);
      };
    });
  };

  const generateImageWithText = (
    tasks: TaskData[],
    qrCodeUrls: any
  ): Promise<string> => {
    return new Promise(async (resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) return;

      // Decide which card info to use
      const cardTemplateInfo: CardTemplateInfo = projectCardInfo;
      if (cardTemplateInfo.project === undefined) {
        return;
      }

      const bgImage: any = await loadBgImage(cardTemplateInfo.backgroundImage);
      canvas.width = bgImage.width;
      canvas.height = bgImage.height;
      ctx.drawImage(bgImage, 0, 0);

      const projectName = props.projectData?.project || "";

      for (let i = 0; i < tasks.length; i += 1) {
        const foundMember = props.members.find(
          (member) => member.englishName === tasks[i].member
        );

        ctx.font = "55px Arial";
        ctx.fillStyle = "#FFFFFF";

        try {
          drawWrappedText(
            ctx,
            projectName,
            cardTemplateInfo.project[i].x,
            cardTemplateInfo.project[i].y,
            CARD_WIDTH,
            CARD_LINE_HEIGHT
          );
        } catch (err) {
          console.log(err);
        }

        if (cardTemplateInfo.milestone !== undefined) {
          drawWrappedText(
            ctx,
            tasks[i].type,
            cardTemplateInfo.milestone[i].x,
            cardTemplateInfo.milestone[i].y,
            CARD_WIDTH,
            CARD_LINE_HEIGHT
          );
        }

        if (cardTemplateInfo.userId !== undefined && foundMember) {
          drawWrappedText(
            ctx,
            foundMember.jobNumber,
            cardTemplateInfo.userId[i].x,
            cardTemplateInfo.userId[i].y,
            CARD_WIDTH,
            CARD_LINE_HEIGHT
          );
        }

        if (cardTemplateInfo.name !== undefined) {
          drawWrappedText(
            ctx,
            `${tasks[i].member}`,
            cardTemplateInfo.name[i].x,
            cardTemplateInfo.name[i].y,
            CARD_WIDTH,
            CARD_LINE_HEIGHT
          );
        }
      }

      let loadcount = 0;
      for (let i = 0; i < tasks.length; i++) {
        const qrCodeImage = new Image();
        qrCodeImage.src = qrCodeUrls[i];
        qrCodeImage.onload = async () => {
          loadcount++;

          if (cardTemplateInfo.qrCode !== undefined) {
            ctx.drawImage(
              qrCodeImage,
              cardTemplateInfo.qrCode[i].x,
              cardTemplateInfo.qrCode[i].y
            );
          }

          if (loadcount == tasks.length) {
            const dataUrl = canvas.toDataURL("image/png");
            resolve(dataUrl);
          }
        };
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

        // Get unique user and milestone pair
        setCardInfo(
          uniquePairs(projectData.tasks).sort((a, b) => {
            if (a.member < b.member) return -1;
            if (a.member > b.member) return 1;
            if (a.type < b.type) return -1;
            if (a.type > b.type) return 1;
            return 0;
          })
        );
      } catch (error) {
        console.error("Error:", error);
      }
      props.exitLoading(1);
    };
    fetchData();
  };

  // Get from generate button
  useEffect(() => {
    if (
      props.projectData === undefined ||
      cardInfo.length === 0 ||
      props.cardType === ""
    ) {
      return;
    }
    setQrCodeUrls(
      cardInfo.map((info) => {
        const foundMember = props.members.find(
          (member) => member.englishName === info.member
        );
        return addQueryParamsToUrl(TIMECARD_URL, {
          id: props.sheetId,
          user: foundMember?.jobNumber || "",
          milestone: info.type,
        });
      })
    );
  }, [cardInfo, props.projectData]);

  useEffect(() => {
    if (props.projectData === undefined) {
      return;
    }

    const qrCodeDataUrls: string[] = [];

    for (let i = 0; i < qrCodeUrls.length; i++) {
      const canvas = document
        .getElementById(`qrcode-${i}`)
        ?.querySelector<HTMLCanvasElement>("canvas");
      if (canvas) {
        qrCodeDataUrls.push(canvas.toDataURL("image/png"));
      }
    }

    const fetchData = async (qrCodeDataUrls: string[]) => {
      const links: string[] = [];
      const zip = new JSZip();

      const chunkedCardInfos: any[][] = [];
      const chunkedQrcodeUrls: any[][] = [];

      for (let i = 0; i < cardInfo.length; i += CHUNK_SIZE) {
        chunkedCardInfos.push(cardInfo.slice(i, i + CHUNK_SIZE));
        chunkedQrcodeUrls.push(qrCodeDataUrls.slice(i, i + CHUNK_SIZE));
      }

      for (let i = 0; i < chunkedCardInfos.length; i++) {
        const dataUrl = await generateImageWithText(
          chunkedCardInfos[i],
          chunkedQrcodeUrls[i]
        );
        const base64Data = dataUrl.split(",")[1];
        zip.file(
          `${props.projectData?.project}_timecard_${i + 1}.png`,
          base64Data,
          { base64: true }
        );
        links.push(dataUrl);
      }
      zip.generateAsync({ type: "blob" }).then((content) => {
        const downloadUrl = URL.createObjectURL(content);
        setDownloadLink(downloadUrl);
      });
      setDownloadLinks(links);
    };

    fetchData(qrCodeDataUrls);
  }, [qrCodeUrls, props.projectData]);

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
          Generate
        </Button>
        {qrCodeUrls.map((url, index) => (
          <Space
            style={{ display: "none" }}
            id={`qrcode-${index}`}
            key={index}
            direction="vertical"
          >
            <QRCode value={url} size={200} color={"#1a4499"} />
          </Space>
        ))}
      </div>
      <div
        style={{
          // width: "1200px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          marginTop: "200px",
        }}
      >
        {downloadLink && (
          <a
            href={downloadLink}
            download={`timecards.zip`}
            target="_blank"
            style={{ marginBottom: "50px" }}
          >
            <Button
              style={{
                marginTop: "20px",
                width: "300px",
                height: "60px",
                fontSize: "30px",
                backgroundColor: "green",
              }}
              type="primary"
            >
              Download all cards
            </Button>
          </a>
        )}

        {downloadLinks.map((url, index) => (
          <div key={index} style={{ textAlign: "center", width: "100%" }}>
            <div>
              <a
                href={downloadLinks[index]}
                download={`timecard_${index + 1}.png`}
                style={{ width: "100%" }}
                target="_blank"
              >
                <Button
                  style={{
                    marginTop: "20px",
                    width: "300px",
                    height: "60px",
                    fontSize: "30px",
                  }}
                  type="primary"
                >
                  Download card {index + 1}
                </Button>
              </a>
            </div>
            <img
              src={url}
              alt={`Image Preview ${index + 1}`}
              style={{ width: "100%" }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
