import React, { useEffect, useState } from "react";
import { Button, Modal, Input } from "antd";

function ImportSheetModal(props: {
  isModalOpen: boolean;
  setIsModalOpen: CallableFunction;
  importSheet: CallableFunction;
}) {
  const [loading, setLoading] = useState(false);
  const [sheetId, setSheetId] = useState<string>("");

  useEffect(() => {
    setSheetId("");
    setLoading(false);
  }, [props.isModalOpen]);

  const handleOk = async () => {
    setLoading(true);
    await props.importSheet(sheetId);
    setLoading(false);
    props.setIsModalOpen(false);
  };

  const handleCancel = () => {
    props.setIsModalOpen(false);
  };

  return (
    <Modal
      centered
      title="Import sheet"
      open={props.isModalOpen}
      onOk={() => {
        props.setIsModalOpen(false);
      }}
      onCancel={handleCancel}
      maskClosable={false}
      okText="Import"
      closable={false}
      keyboard={false}
      footer={[
        <Button key="back" onClick={handleCancel} disabled={loading}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={handleOk}
        >
          Submit
        </Button>,
      ]}
    >
      <Input
        size="middle"
        placeholder="Google sheet ID"
        style={{
          borderWidth: "3px",
          fontSize: "16px",
          height: "40px",
          marginTop: "20px",
          marginBottom: "10px",
        }}
        disabled={loading}
        value={sheetId}
        onChange={(e) => {
          setSheetId(e.target.value);
        }}
      />
    </Modal>
  );
}

export default ImportSheetModal;
