import React, { useState, useEffect } from "react";
import { Button, Input, QRCode, Space, Select, Checkbox } from "antd";
import { getProjectDetail } from "../../lib/api";
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
import type { SelectProps } from "antd";
import { loadBgImage, importAll } from "./utils";

import adatIcon from "../../assets/images/adat_qrcode_icon.png";

const avatarImages = importAll(
  require.context("../../assets/avatars", false, /\.(png|jpg|svg)$/)
);

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
  const [isSelectAll, setIsSelectAll] = useState<boolean>(true);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const [cardInfo, setCardInfo] = useState<TaskData[]>([]);

  const [createdPDF, setCreatedPDF] = useState<boolean>(false);
  const [preprocessLinks, setPreprocessLinks] = useState<string[]>([]);
  const [downloadLinks, setDownloadLinks] = useState<string[]>([]);

  // data url for each QRCode
  const [qrCodeUrls, setQrCodeUrls] = useState<string[]>([]);

  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);

  const [images, setImages] = useState<{ [key: string]: string }>({});

  const getAvatar = (id: string) => {
    if (id in avatarImages) {
      return avatarImages[id];
    }
    return avatarImages["T9999"];
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

        ctx.font = "40px MicrosoftJhengHeiUI";
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

        // Generate avatar
        const image: any = await loadBgImage(
          getAvatar(foundMember ? foundMember.jobNumber : "")
        );
        const avatarCanvas = document.createElement("canvas");
        const avatarCtx = avatarCanvas.getContext("2d");
        avatarCanvas.width = image.width;
        avatarCanvas.height = image.height;
        if (image && avatarCtx && cardTemplateInfo.name !== undefined) {
          const centerX = avatarCanvas.width / 2;
          const centerY = avatarCanvas.height / 2;
          const radius = Math.min(image.width, image.height) / 2;

          avatarCtx.save();
          avatarCtx.beginPath();
          avatarCtx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
          avatarCtx.closePath();
          avatarCtx.clip();

          avatarCtx.drawImage(
            image,
            centerX - radius,
            centerY - radius,
            radius * 2,
            radius * 2
          );

          avatarCtx.restore();

          ctx.drawImage(
            avatarCanvas,
            cardTemplateInfo.avatar[i].x,
            cardTemplateInfo.avatar[i].y,
            150,
            150
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
              cardTemplateInfo.qrCode[i].y,
              330,
              330
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
    getProjectDetail(sheetId)
      .then((value: ProjectData) => {
        props.setMembers(value.members);

        props.setProjectData(value);
        props.setCardType(value.cardType);

        // Get unique user and milestone pair
        const item = uniquePairs(value.tasks).sort((a, b) => {
          if (a.member < b.member) return -1;
          if (a.member > b.member) return 1;
          if (a.type < b.type) return -1;
          if (a.type > b.type) return 1;
          return 0;
        });
        setQrCodeUrls(
          item.map((info) => {
            const foundMember = value.members.find((member) => {
              return member.englishName === info.member;
            });
            return addQueryParamsToUrl(TIMECARD_URL, {
              id: props.sheetId,
              user: foundMember?.jobNumber || "",
              milestone: info.type,
            });
          })
        );

        // delay assignment
        setCardInfo(item);
      })
      .catch((error: any) => {
        console.error("Failed to fetch data:", error);
      })
      .finally(() => {
        props.exitLoading(1);
      });
  };

  const downloadPdf = () => {
    if (pdfBlob) {
      const link = document.createElement("a");
      link.href = URL.createObjectURL(pdfBlob);
      link.download = "timecards.pdf";
      link.click();
    }
  };

  const createOptions = (infos: TaskData[]) => {
    const options: SelectProps["options"] = [];
    for (let i = 0; i < infos.length; i++) {
      const foundMember = props.members.find(
        (member) => member.englishName === infos[i].member
      );
      options.push({
        label:
          (foundMember ? foundMember.englishName : infos[i].member) +
          " - " +
          infos[i].type,
        value: i,
      });
    }
    return options;
  };

  const fetchPDFData = async () => {
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

    let filteredCardInfo = cardInfo;
    let filteredQrCodeDataUrls = qrCodeDataUrls;

    if (!isSelectAll) {
      filteredCardInfo = filteredCardInfo.filter((info, index) =>
        selectedItems.some((item) => index.toString() == item)
      );
      filteredQrCodeDataUrls = filteredQrCodeDataUrls.filter((info, index) =>
        selectedItems.some((item) => index.toString() == item)
      );
    }

    for (let i = 0; i < filteredCardInfo.length; i += CHUNK_SIZE) {
      chunkedCardInfos.push(filteredCardInfo.slice(i, i + CHUNK_SIZE));
      chunkedQrcodeUrls.push(filteredQrCodeDataUrls.slice(i, i + CHUNK_SIZE));
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
  };

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
            fontFamily: "MicrosoftJhengHeiUI",
          }}
          type="primary"
          loading={props.loadings[1]}
          onClick={() => {
            props.enterLoading(1);
            setCardInfo([]);
            setCreatedPDF(false);
            setDownloadLinks([]);
            setPreprocessLinks([]);
            setQrCodeUrls([]);
            setSelectedItems([]);
            setIsSelectAll(true);
            getProjectData(props.sheetId);
          }}
          disabled={props.loadings[2]}
        >
          Generate
        </Button>

        {cardInfo.length > 0 && (
          <>
            <Checkbox
              defaultChecked
              checked={isSelectAll}
              onChange={(e) => {
                setIsSelectAll(e.target.checked);
                setSelectedItems([]);
              }}
              style={{ marginTop: "50px", marginBottom: "20px" }}
            >
              Select all
            </Checkbox>
            <Select
              mode="multiple"
              showSearch
              optionFilterProp="label"
              allowClear
              style={{ width: "100%" }}
              size="middle"
              onChange={(value) => {
                setSelectedItems(value);
              }}
              value={selectedItems}
              options={createOptions(cardInfo)}
              disabled={isSelectAll}
            />
            <Button
              style={{
                marginTop: "20px",
                width: "300px",
                height: "60px",
                fontSize: "30px",
                fontFamily: "MicrosoftJhengHeiUI",
              }}
              type="primary"
              loading={props.loadings[2]}
              onClick={async () => {
                setCreatedPDF(false);
                setDownloadLinks([]);
                setPreprocessLinks([]);
                props.enterLoading(2);
                await fetchPDFData();
                props.exitLoading(2);
              }}
            >
              Create timecards
            </Button>
          </>
        )}
        {qrCodeUrls.map((url, index) => (
          <Space
            style={{ display: "none" }}
            id={`qrcode-${index}`}
            key={index}
            direction="vertical"
          >
            <QRCode
              value={url}
              errorLevel="H"
              color={"#1a4499"}
              bgColor="#FFFFFF"
              icon={adatIcon}
              iconSize={60}
            />
          </Space>
        ))}
      </div>
      <div
        style={{
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
