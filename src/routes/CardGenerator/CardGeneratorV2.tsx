import React, { useState } from "react";
import { Button, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import ImportSheetModal from "./ImportSheetModal";
import { getProjectDetail } from "../../lib/api";
import { uniquePairs, TIMECARD_URL } from "./utils";
import { addQueryParamsToUrl } from "./model";
import { CardData } from "../../lib/models";
import SelectCardTable from "./SelectCardTable";
import QRCodesBlock from "./QRCodesBlock";
import { DataType, delay, generateImageWithText } from "./utils";
import jsPDF from "jspdf";
import "../TimeCard.css";

const CHUNK_SIZE = 10;

function CardGeneratorV2() {
  const [isImportSheetModalOpen, setIsImportSheetModalOpen] = useState(false);

  const [cardDatas, setCardDatas] = useState<CardData[]>([]);

  const [selectedCardDataKey, setSelectedCardDataKey] = useState<React.Key[]>(
    []
  );
  const [selectedCardData, setSelectedCardData] = useState<DataType[]>([]);

  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [preprocessLinks, setPreprocessLinks] = useState<string[]>([]);
  const [downloadLinks, setDownloadLinks] = useState<string[]>([]);

  const [messageApi, contextHolder] = message.useMessage();

  const importSheet = async (sheetId: string) => {
    try {
      const pd = await getProjectDetail(sheetId);

      if (cardDatas.length > 0) {
        if (cardDatas[0].cardType != pd.cardType) {
          messageApi.open({
            type: "error",
            content: `Cannot import sheet with different type (${cardDatas[0].cardType} and ${pd.cardType})`,
          });
          return;
        } else if (cardDatas[0].cardType.toLowerCase() == "department") {
          if (cardDatas[0].project != pd.project) {
            messageApi.open({
              type: "error",
              content: `Cannot import department sheet with different department (${cardDatas[0].project} and ${pd.project})`,
            });
            return;
          }
        }
      }

      const item = uniquePairs(pd.tasks).sort((a, b) => {
        if (a.member < b.member) return -1;
        if (a.member > b.member) return 1;
        if (a.type < b.type) return -1;
        if (a.type > b.type) return 1;
        return 0;
      });

      const qrcodeUrls = item.map((info) => {
        const foundMember = pd.members.find((member) => {
          return member.englishName === info.member;
        });
        return addQueryParamsToUrl(TIMECARD_URL, {
          id: sheetId,
          user: foundMember?.jobNumber || "",
          milestone: info.type,
        });
      });

      const newCardDatas: CardData[] = [];
      for (let i = 0; i < item.length; i++) {
        const foundMember = pd.members.find((member) => {
          return member.englishName === item[i].member;
        });

        const newCardData = new CardData({
          type: item[i].type,
          item: item[i].item,
          hash: item[i].hash,
          task: item[i].task,
          member: item[i].member,
          member_type: item[i].member_type,
          status: item[i].status,
          start_date: item[i].start_date.toString(),
          end_date: item[i].end_date.toString(),
          qrcode_url: qrcodeUrls[i],
          department: foundMember ? foundMember.department : "",
          jobNumber: foundMember ? foundMember.jobNumber : "",
          chineseName: foundMember ? foundMember.chineseName : "",
          englishName: foundMember ? foundMember.englishName : "",
          project: pd.project,
          cardType: pd.cardType,
        });
        newCardDatas.push(newCardData);
      }
      setCardDatas((prev: CardData[]) => [...prev, ...newCardDatas]);

      setSelectedCardData([]);
      setSelectedCardDataKey([]);
    } catch (err) {
      messageApi.open({
        type: "error",
        content: "Import sheet error",
      });
    }
  };

  const createTimecard = async () => {
    await delay(3000);

    // Create qrcode image for all the cardData
    const allCardDatas = cardDatas;
    for (let i = 0; i < allCardDatas.length; i++) {
      const canvas = document
        .getElementById(`qrcode-${i}`)
        ?.querySelector<HTMLCanvasElement>("canvas");
      if (canvas) {
        allCardDatas[i].qrcode_img = canvas.toDataURL("image/png");
      }
    }
    console.log("allCardData: ", allCardDatas);

    // Filter final cardData by selectedCardDataKey
    console.log("selectedCardDataKey: ", selectedCardDataKey);
    const finalCardDatas = allCardDatas.filter((_, index) => {
      return selectedCardDataKey.includes(index);
    });
    console.log("finalCardData: ", finalCardDatas);

    // Chunk cardData
    const chunkedCardDatas: CardData[][] = [];
    for (let i = 0; i < finalCardDatas.length; i += CHUNK_SIZE) {
      chunkedCardDatas.push(finalCardDatas.slice(i, i + CHUNK_SIZE));
    }
    console.log("chunkedCardData: ", chunkedCardDatas);

    const preprocessLinks: string[] = [];
    const links: string[] = [];
    for (let i = 0; i < chunkedCardDatas.length; i++) {
      const dataUrls = await generateImageWithText(chunkedCardDatas[i]);
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

    setPreprocessLinks(preprocessLinks);
    setDownloadLinks(links);
  };

  const downloadPdf = () => {
    if (pdfBlob) {
      const link = document.createElement("a");
      link.href = URL.createObjectURL(pdfBlob);
      link.download = "timecards.pdf";
      link.click();
    }
  };

  return (
    <div className="tc_container">
      {contextHolder}
      <div className="tc_header">
        <h1>ADAT</h1>
        <Button
          style={{ position: "absolute", right: "30px" }}
          icon={<PlusOutlined />}
          onClick={() => {
            setIsImportSheetModalOpen(true);
          }}
        >
          Import sheet
        </Button>
      </div>

      <SelectCardTable
        cardDatas={cardDatas}
        selectedCardDatas={selectedCardData}
        setSelectedCardData={setSelectedCardData}
        selectedRowKeys={selectedCardDataKey}
        setSelectedRowKeys={setSelectedCardDataKey}
        createTimecard={createTimecard}
      />

      <QRCodesBlock cardDatas={cardDatas} />

      <ImportSheetModal
        isModalOpen={isImportSheetModalOpen}
        setIsModalOpen={setIsImportSheetModalOpen}
        importSheet={importSheet}
      />

      {pdfBlob && (
        <div style={{ margin: "50px", marginBottom: "0px" }}>
          <Button
            style={{
              marginTop: "20px",
              backgroundColor: "green",
            }}
            type="primary"
            onClick={() => {
              downloadPdf();
            }}
          >
            Download all cards
          </Button>
        </div>
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
  );
}

export default CardGeneratorV2;
