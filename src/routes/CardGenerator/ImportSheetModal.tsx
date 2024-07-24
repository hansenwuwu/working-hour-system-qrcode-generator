import React, { useState } from "react";
import { Button, Modal, Input } from "antd";

function ImportSheetModal(props: {
  isModalOpen: boolean;
  setIsModalOpen: CallableFunction;
}) {
  const [loading, setLoading] = useState(false);
  const [disable, setDisabled] = useState(false);

  const handleOk = () => {
    setLoading(true);
    // setTimeout(() => {
    //   setLoading(false);
    //   setOpen(false);
    // }, 3000);
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
      destroyOnClose={true}
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
        // disabled={props.loadings[1]}
        // value={props.sheetId}
        // onChange={(e) => {
        //   props.setSheetId(e.target.value);
        // }}
      />
    </Modal>
  );
}

export default ImportSheetModal;
