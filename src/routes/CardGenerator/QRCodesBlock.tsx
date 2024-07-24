import React from "react";
import { QRCode, Space } from "antd";
import { CardData } from "../../lib/models";
import adatIcon from "../../assets/images/adat_qrcode_icon.png";

function QRCodesBlock(props: { cardDatas: CardData[] }) {
  return (
    <div>
      {props.cardDatas.map((data, index) => (
        <Space
          style={{ display: "none" }}
          id={`qrcode-${index}`}
          key={index}
          direction="vertical"
        >
          <QRCode
            value={data.qrcode_url}
            errorLevel="H"
            color={"#1a4499"}
            bgColor="#FFFFFF"
            icon={adatIcon}
            iconSize={60}
          />
        </Space>
      ))}
    </div>
  );
}

export default QRCodesBlock;
