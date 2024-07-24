import React, { useState } from "react";
import { Table, Flex, Button } from "antd";
import type { TableColumnsType } from "antd";
import { CardData } from "../../lib/models";
import { DataType } from "./utils";

const columns: TableColumnsType<DataType> = [
  {
    title: "Project",
    dataIndex: "project",
  },
  {
    title: "Milestone",
    dataIndex: "milestone",
  },
  // {
  //   title: "Task",
  //   dataIndex: "task",
  // },
  // {
  //   title: "Item",
  //   dataIndex: "item",
  // },
  {
    title: "Task member",
    dataIndex: "englishName",
  },
];

function SelectCardTable(props: {
  cardDatas: CardData[];
  selectedCardDatas: DataType[];
  setSelectedCardData: CallableFunction;
  selectedRowKeys: React.Key[];
  setSelectedRowKeys: CallableFunction;
  createTimecard: CallableFunction;
}) {
  const [loading, setLoading] = useState(false);

  const rowSelection = {
    onChange: (selectedRowKeys: React.Key[], selectedRows: DataType[]) => {
      props.setSelectedRowKeys(selectedRowKeys);
      props.setSelectedCardData(selectedRows);
    },
  };

  const hasSelected = props.selectedRowKeys.length > 0;

  return (
    <div style={{ margin: "50px" }}>
      <div style={{ marginBottom: "20px" }}>
        <Button
          type="primary"
          disabled={!hasSelected}
          style={{ marginRight: "20px" }}
          loading={loading}
          onClick={async () => {
            setLoading(true);
            await props.createTimecard();
            setLoading(false);
          }}
        >
          Create timecard
        </Button>
        {hasSelected ? `Selected ${props.selectedRowKeys.length} items` : null}
      </div>
      <Table
        rowSelection={{
          type: "checkbox",
          ...rowSelection,
          selectedRowKeys: props.selectedRowKeys,
          selections: [Table.SELECTION_ALL, Table.SELECTION_NONE],
        }}
        columns={columns}
        dataSource={props.cardDatas.map((data, index) => {
          const dt: DataType = {
            key: index,
            project: data.project,
            milestone: data.type,
            task: data.task,
            item: data.item,
            englishName: data.englishName,
            cardData: data,
          };
          return dt;
        })}
      />
    </div>
  );
}

export default SelectCardTable;
