import React, { useContext, useState } from "react";
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
  const [imageList, setImageList] = useState<HTMLImageElement[]>([]);
  const [hoverImage, setHoverImage] = useState<HTMLImageElement | null>(null);
  const [maskedArea, setMaskedArea] = useState<string | null>(null);

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

  const handleHover = (image: HTMLImageElement | null) => {
    setHoverImage(image);
  };

  const flexCenterClasses = "flex items-center justify-center";
  const handleMaskedArea = (imageData: string | null) => {
    setMaskedArea(imageData);
  };

  return (
    <div className={`${flexCenterClasses} w-full h-full`}>
      <div className="absolute left-[16px] top-[5%] w-[150px] h-[150px] border overflow-hidden z-10">
        {maskedArea ? (
          <img 
            src={maskedArea} 
            alt="Masked area" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            移动鼠标查看遮罩区域
          </div>
        )}
      </div>
      <button className="border pl-[16px] pr-[16px] pt-[4px] pb-[4px] absolute top-[8px] left-[78px] z-20 bg-[#38f] text-[white] rounded-[4px]">
        组合
      </button>
      <div className={`${flexCenterClasses} relative w-[90%] h-[90%]`}>
        <Tool handleMouseMove={handleMouseMove} handleMaskedArea={handleMaskedArea} />
      </div>
    </div>
  );
};

export default Stage;