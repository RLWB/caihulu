import React, { useContext } from "react";
import * as _ from "underscore";
import Tool from "./Tool";
import { modelInputProps } from "./helpers/Interfaces";
import AppContext from "./hooks/createContext";

const Stage = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("Stage must be used within an AppContextProvider");
  }

  const {
    clicks: [, setClicks],
    image: [image],
    imageWithMask: imageWithMaskState,
  } = context;

  if (!imageWithMaskState) {
    throw new Error("imageWithMask is undefined");
  }

  const [imageWithMask, setImageWithMask] = imageWithMaskState;

  const getClick = (x: number, y: number): modelInputProps => {
    const clickType = 1;
    return { x, y, clickType };
  };

  // Get mouse position and scale the (x, y) coordinates back to the natural
  // scale of the image. Update the state of clicks with setClicks to trigger
  // the ONNX model to run and generate a new mask via a useEffect in App.tsx
  const handleMouseMove = _.throttle((e: any) => {
    let el = e.nativeEvent.target;
    const rect = el.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;
    const imageScale = image ? image.width / el.offsetWidth : 1;
    x *= imageScale;
    y *= imageScale;
    const click = getClick(x, y);
    if (click) setClicks([click]);
  }, 15);

  const flexCenterClasses = "flex items-center justify-center";
  return (
    <div className={`${flexCenterClasses} w-full h-full`}>
      <div className="absolute left-[16px] top-[5%] w-[200px] h-[90%] border overflow-auto z-10 p-[8px]">
        <ul>
          {/* example */}
          <li className="p-[8px]">
            <img src="../assets/data/bear.png" alt="" />
          </li>
          {/* 如果 imageWithMask 存在，则加载图片 */}
          {imageWithMask && (
            <li className="p-[8px]">
              <img src={imageWithMask.src} alt="" />
            </li>
          )}
        </ul>
      </div>
      <button className="border pl-[16px] pr-[16px] pt-[4px] pb-[4px] absolute top-[8px] left-[78px] z-20 bg-[#38f] text-[white] rounded-[4px]">
        组合
      </button>
      <div className={`${flexCenterClasses} relative w-[90%] h-[90%]`}>
        <Tool handleMouseMove={handleMouseMove} />
      </div>
    </div>
  );
};

export default Stage;
