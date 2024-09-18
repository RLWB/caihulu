import React, { useContext, useEffect, useRef, useState } from "react";
import AppContext from "./hooks/createContext";
import { ToolProps } from "./helpers/Interfaces";
import * as _ from "underscore";

const Tool = ({ handleMouseMove, handleMaskedArea }: ToolProps) => {
  const {
    image: [image],
    maskImg: [maskImg, setMaskImg],
  } = useContext(AppContext)!;

  const [shouldFitToWidth, setShouldFitToWidth] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bodyEl = document.body;

  const fitToPage = () => {
    if (!image) return;
    const imageAspectRatio = image.width / image.height;
    const screenAspectRatio = window.innerWidth / window.innerHeight;
    setShouldFitToWidth(imageAspectRatio > screenAspectRatio);
  };

  const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      if (entry.target === bodyEl) {
        fitToPage();
      }
    }
  });

  useEffect(() => {
    fitToPage();
    resizeObserver.observe(bodyEl);
    return () => {
      resizeObserver.unobserve(bodyEl);
    };
  }, [image]);

  const updateMaskedArea = _.throttle((e: React.MouseEvent<HTMLImageElement>) => {
    if (!image || !maskImg || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 添加检查确保 e.currentTarget 存在
    if (!e.currentTarget) {
      console.error('Event target is null');
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    if (!rect) {
      console.error('Unable to get bounding rectangle');
      return;
    }

    const scaleX = image.width / rect.width;
    const scaleY = image.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const cropSize = 150; // 调整裁剪区域大小
    const halfSize = cropSize / 2;

    canvas.width = cropSize;
    canvas.height = cropSize;

    ctx.drawImage(
      image,
      Math.max(0, x - halfSize),
      Math.max(0, y - halfSize),
      cropSize,
      cropSize,
       0,
      0,
      cropSize,
      cropSize
    );

    ctx.globalCompositeOperation = 'destination-in';
    ctx.drawImage(
      maskImg,
      Math.max(0, x - halfSize),
      Math.max(0, y - halfSize),
      cropSize,
      cropSize,
      0,
      0,
      cropSize,
      cropSize
    );

    handleMaskedArea(canvas.toDataURL());
  }, 50);

  const imageClasses = "";
  const maskImageClasses = `absolute opacity-40 pointer-events-none`;

  return (
    <>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      {image && (
        <img
          onMouseMove={(e) => {
            handleMouseMove(e);
            updateMaskedArea(e);
          }}
          onMouseOut={() => {
            _.defer(() => setMaskImg(null));
            handleMaskedArea(null);
          }}
          onTouchStart={handleMouseMove}
          src={image.src}
          className={`${shouldFitToWidth ? "w-full" : "h-full"} ${imageClasses}`}
        />
      )}
      {maskImg && (
        <img
          src={maskImg.src}
          className={`${shouldFitToWidth ? "w-full" : "h-full"} ${maskImageClasses}`}
        />
      )}
    </>
  );
};

export default Tool;
