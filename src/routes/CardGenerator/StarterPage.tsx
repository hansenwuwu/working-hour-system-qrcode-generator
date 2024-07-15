import React, { useState, useEffect } from "react";
import { Button, Input, QRCode, Space } from "antd";
import { getTasks, getMembers } from "../../lib/api";
import { MemberData, ProjectData, TaskData } from "../../lib/models";
import { addQueryParamsToUrl } from "./model";
import {
  drawWrappedText,
  projectCardInfo,
  CardTemplateInfo,
  designCardInfo,
  getBackgroundImage,
  delay,
} from "./utils";
import {
  uniquePairs,
  TIMECARD_URL,
  CARD_WIDTH,
  CARD_LINE_HEIGHT,
} from "./utils";
import jsPDF from "jspdf";

const CHUNK_SIZE = 10;

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
  const [createdPDF, setCreatedPDF] = useState<boolean>(false);

  const [preprocessLinks, setPreprocessLinks] = useState<string[]>([]);
  const [downloadLinks, setDownloadLinks] = useState<string[]>([]);

  // data url for each QRCode
  const [qrCodeUrls, setQrCodeUrls] = useState<string[]>([]);

  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);

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
  ): Promise<string[]> => {
    return new Promise(async (resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) return;

      const projectName = props.projectData?.project || "";

      // Decide which card info to use
      let cardTemplateInfo: CardTemplateInfo = projectCardInfo;
      let isDep = false;
      if (props.cardType.toLowerCase() === "department") {
        isDep = true;

        cardTemplateInfo = designCardInfo;
        cardTemplateInfo.backgroundImage = getBackgroundImage(projectName);
      }

      const bgImage: any = await loadBgImage(cardTemplateInfo.backgroundImage);
      canvas.width = bgImage.width;
      canvas.height = bgImage.height;
      ctx.drawImage(bgImage, 0, 0);

      for (let i = 0; i < tasks.length; i += 1) {
        const foundMember = props.members.find(
          (member) => member.englishName === tasks[i].member
        );

        ctx.font = "bold 50px MicrosoftJhengHeiUI";
        if (cardTemplateInfo.fontColor !== undefined) {
          ctx.fillStyle = cardTemplateInfo.fontColor;
        }

        if (cardTemplateInfo.project !== undefined && !isDep) {
          drawWrappedText(
            ctx,
            projectName,
            cardTemplateInfo.project[i].x,
            cardTemplateInfo.project[i].y,
            CARD_WIDTH,
            CARD_LINE_HEIGHT
          );
        }

        if (isDep) {
          ctx.textAlign = "center";
        }

        ctx.font = "bold 40px MicrosoftJhengHeiUI";
        if (cardTemplateInfo.milestone !== undefined && !isDep) {
          drawWrappedText(
            ctx,
            tasks[i].type,
            cardTemplateInfo.milestone[i].x,
            cardTemplateInfo.milestone[i].y,
            CARD_WIDTH,
            CARD_LINE_HEIGHT
          );
        }

        ctx.font = "40px MicrosoftJhengHeiUI";
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

        ctx.font = "bold 40px MicrosoftJhengHeiUI";
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
            const rotatedCanvas = document.createElement("canvas");
            const rotatedCtx = rotatedCanvas.getContext("2d");

            if (!rotatedCtx) return;

            rotatedCanvas.width = canvas.height;
            rotatedCanvas.height = canvas.width;

            rotatedCtx.translate(
              rotatedCanvas.width / 2,
              rotatedCanvas.height / 2
            );
            rotatedCtx.rotate((270 * Math.PI) / 180);
            rotatedCtx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);

            const originalUrl = canvas.toDataURL("image/png");
            const dataUrl = rotatedCanvas.toDataURL("image/png");
            resolve([dataUrl, originalUrl]);
          }
        };
      }
    });
  };

  const getProjectData = (sheetId: string) => {
    const fetchData = async () => {
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
    };
    fetchData();
  };

  const downloadPdf = () => {
    if (pdfBlob) {
      const link = document.createElement("a");
      link.href = URL.createObjectURL(pdfBlob);
      link.download = "timecards.pdf";
      link.click();
    }
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
    if (props.projectData === undefined || qrCodeUrls.length == 0) {
      return;
    }

    const fetchData = async () => {
      await delay(3000);

      const qrCodeDataUrls: string[] = [];

      for (let i = 0; i < qrCodeUrls.length; i++) {
        const canvas = document
          .getElementById(`qrcode-${i}`)
          ?.querySelector<HTMLCanvasElement>("canvas");
        if (canvas) {
          qrCodeDataUrls.push(canvas.toDataURL("image/png"));
        }
      }

      const preprocessLinks: string[] = [];
      const links: string[] = [];

      const chunkedCardInfos: any[][] = [];
      const chunkedQrcodeUrls: any[][] = [];

      for (let i = 0; i < cardInfo.length; i += CHUNK_SIZE) {
        chunkedCardInfos.push(cardInfo.slice(i, i + CHUNK_SIZE));
        chunkedQrcodeUrls.push(qrCodeDataUrls.slice(i, i + CHUNK_SIZE));
      }

      for (let i = 0; i < chunkedCardInfos.length; i++) {
        const dataUrls = await generateImageWithText(
          chunkedCardInfos[i],
          chunkedQrcodeUrls[i]
        );
        links.push(dataUrls[0]);
        preprocessLinks.push(dataUrls[1]);
      }

      // Convert to PDF
      const pdf = new jsPDF();
      for (let i = 0; i < links.length; i++) {
        if (i > 0) pdf.addPage();
        const imgData = links[i];
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = pdfWidth;
        const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
        const x = 0;
        const y = (pdfHeight - imgHeight) / 2;
        pdf.addImage(imgData, "PNG", x, y, imgWidth, imgHeight);
      }
      const pdfBlob = pdf.output("blob");
      setPdfBlob(pdfBlob);

      setCreatedPDF(true);
      setPreprocessLinks(preprocessLinks);
      setDownloadLinks(links);
      props.exitLoading(1);
    };

    fetchData();
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
            props.enterLoading(1);
            setCardInfo([]);
            setCreatedPDF(false);
            setDownloadLinks([]);
            setQrCodeUrls([]);
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
            <QRCode
              value={url}
              size={176}
              errorLevel={"L"}
              color={"#1a4499"}
              bgColor="#FFFFFF"
            />
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
        {createdPDF && (
          <Button
            style={{
              marginTop: "20px",
              width: "300px",
              height: "60px",
              fontSize: "30px",
              backgroundColor: "green",
            }}
            type="primary"
            onClick={() => {
              downloadPdf();
            }}
          >
            Download all cards
          </Button>
        )}

        {preprocessLinks.map((url, index) => (
          <div key={index} style={{ textAlign: "center", width: "100%" }}>
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
