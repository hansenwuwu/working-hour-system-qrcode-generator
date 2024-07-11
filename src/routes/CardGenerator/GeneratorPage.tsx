import React, { useEffect, useState, useRef } from "react";
import { Button, Select } from "antd";
import { ProjectData, MemberData } from "../../lib/models";
import { addQueryParamsToUrl } from "./model";
import { QRCodeCanvas } from "qrcode.react";

export function GeneratorPage(props: {
  sheetId: string;
  setSheetId: CallableFunction;
  projectData: ProjectData;
  setProjectData: CallableFunction;
  loadings: boolean[];
  enterLoading: CallableFunction;
  exitLoading: CallableFunction;
  members: MemberData[];
  setMembers: CallableFunction;
  setCardType: CallableFunction;
}) {
  const [user, setUser] = useState<string>("");
  const [milestone, setMilestone] = useState<string>("");

  const [userOptions, setUserOptions] = useState<any[]>([]);
  const [milestoneOptions, setMilestoneOptions] = useState<any[]>([]);

  const [url, setUrl] = useState<string>("");

  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUserOptions(
      props.members.map((member, index) => {
        return {
          value: member.jobNumber,
          label: member.englishName,
          key: index,
        };
      })
    );
  }, [props.members]);

  useEffect(() => {
    if (userOptions.length > 0) {
      setUser(userOptions[0].value);
    } else {
      setUser("");
    }
  }, [userOptions]);

  useEffect(() => {
    setMilestoneOptions([]);
    setMilestone("");
    if (user === "") {
      setMilestoneOptions([]);
    } else {
      const tasks = props.projectData.tasks.filter(
        (task) => task.member === getUserEnglishName(props.members, user)
      );
      const typeSet = new Set(tasks.map((task) => task.type));
      const results = Array.from(typeSet);

      setMilestoneOptions(
        results.map((item, index) => {
          return {
            value: item,
            label: item,
            key: index,
          };
        })
      );
    }
  }, [user]);

  const getUserEnglishName = (members: MemberData[], target: string) => {
    const found = members.find((member) => member.jobNumber === target);
    return found?.englishName;
  };

  const handleUserChange = (value: string) => {
    setUser(value);
  };

  const handleMilestoneChange = (value: string) => {
    setMilestone(value);
  };

  const handleDownload = () => {
    if (qrRef.current) {
      const canvas = qrRef.current.querySelector("canvas");
      if (canvas) {
        const link = document.createElement("a");
        link.href = canvas.toDataURL("image/png");
        link.download = "qrcode.png";
        link.click();
      }
    }
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: "900px",
          height: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
        }}
      >
        <Select
          style={{ width: "500px", height: "60px", marginBottom: "20px" }}
          value={user}
          showSearch
          optionFilterProp="label"
          onChange={handleUserChange}
          options={userOptions}
        />
        <Select
          style={{ width: "500px", height: "60px" }}
          value={milestone}
          onChange={handleMilestoneChange}
          options={milestoneOptions}
        />
        <Button
          style={{
            marginTop: "20px",
            width: "200px",
            height: "60px",
            fontSize: "30px",
          }}
          type="primary"
          onClick={() => {
            const url = "https://hansenwuwu.github.io/working-hour-system-fe";
            const queryParams = {
              id: props.sheetId,
              user: user,
              milestone: milestone,
            };
            const updatedUrl = addQueryParamsToUrl(url, queryParams);
            setUrl(updatedUrl);

            console.log("Create card for sheetId: ", props.sheetId);
            console.log("Create card for user: ", user);
            console.log("Create card for milestone: ", milestone);
            console.log("Create card for updatedUrl: ", updatedUrl);
          }}
        >
          Generate
        </Button>
        {url !== "" && (
          <div
            style={{
              marginTop: "50px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {/* See example: https://zpao.github.io/qrcode.react/ */}
            <div ref={qrRef}>
              <QRCodeCanvas
                value={url}
                includeMargin={true}
                size={300}
                fgColor="#1a4499"
              />
            </div>
            <Button
              style={{
                marginTop: "20px",
                width: "200px",
                height: "60px",
                fontSize: "30px",
              }}
              type="primary"
              onClick={handleDownload}
            >
              Download
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
