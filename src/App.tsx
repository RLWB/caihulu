import { InferenceSession, Tensor } from "onnxruntime-web";
import React, { useContext, useEffect, useState } from "react";
import "./assets/scss/App.scss";
import { handleImageScale } from "./components/helpers/scaleHelper";
import { modelScaleProps } from "./components/helpers/Interfaces";
import { onnxMaskToImage } from "./components/helpers/maskUtils";
import { modelData } from "./components/helpers/onnxModelAPI";
import Stage from "./components/Stage";
import AppContext from "./components/hooks/createContext";
const ort = require("onnxruntime-web");
/* @ts-ignore */
import npyjs from "npyjs";

const IMAGE_PATH = "/assets/data/bear.png";
const IMAGE_EMBEDDING = "/assets/data/bear_embedding.npy";
const MODEL_DIR = "/model/sam_onnx_quantized_example.onnx";

const App = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("App must be used within an AppContextProvider");
  }

  const {
    clicks: [clicks],
    image: [, setImage],
    maskImg: [, setMaskImg],
    imageWithMask: imageWithMaskState,
  } = context;

  if (!imageWithMaskState) {
    throw new Error("imageWithMask is undefined");
  }

  const [imageWithMask, setImageWithMask] = imageWithMaskState;
  const [model, setModel] = useState<InferenceSession | null>(null);
  const [tensor, setTensor] = useState<Tensor | null>(null);
  const [modelScale, setModelScale] = useState<modelScaleProps | null>(null);
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null); // 添加状态变量

  useEffect(() => {
    const initModel = async () => {
      try {
        if (MODEL_DIR === undefined) return;
        const URL: string = MODEL_DIR;
        const model = await InferenceSession.create(URL);
        setModel(model);
      } catch (e) {
        console.log(e);
      }
    };
    initModel();

    const url = new URL(IMAGE_PATH, location.origin);
    loadImage(url).then((img) => setLoadedImage(img)); // 将加载的图片存储在状态变量中

    Promise.resolve(loadNpyTensor(IMAGE_EMBEDDING, "float32")).then(
      (embedding) => setTensor(embedding)
    );
  }, []);

  const loadImage = async (url: URL): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      try {
        const img = new Image();
        img.src = url.href;
        img.onload = () => {
          const { height, width, samScale } = handleImageScale(img);
          setModelScale({
            height: height, // original image height
            width: width, // original image width
            samScale: samScale, // scaling factor for image which has been resized to longest side 1024
          });
          img.width = width;
          img.height = height;
          setImage(img);
          resolve(img); // 返回加载的图片对象
        };
        img.onerror = (error) => {
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  };

  const loadNpyTensor = async (tensorFile: string, dType: string) => {
    const npLoader = new npyjs();
    const npArray = await npLoader.load(tensorFile);

    if (dType === "float32") {
      let float32Array = new Float32Array(npArray.data.length);
      for (let i = 0; i < npArray.data.length; i++) {
        float32Array[i] = npArray.data[i];
      }
      npArray.data = float32Array;
    }
    // 将里面的数全部除以10000
    for (let i = 0; i < npArray.data.length; i++) {
      npArray.data[i] = npArray.data[i] / 10000;
    }

    const tensor = new ort.Tensor(dType, npArray.data, npArray.shape);
    return tensor;
  };

  useEffect(() => {
    runONNX();
  }, [clicks]);

  const runONNX = async () => {
    try {
      if (
        model === null ||
        clicks === null ||
        tensor === null ||
        modelScale === null ||
        loadedImage === null // 确保图片已加载
      )
        return;
      else {
        const feeds = modelData({
          clicks,
          tensor,
          modelScale,
        });
        if (feeds === undefined) return;

        const results = await model.run(feeds);
        const output = results[model.outputNames[0]];

        const mask = onnxMaskToImage(output.data, output.dims[2], output.dims[3]);
        const resizedMask = resizeMask(mask, loadedImage.width, loadedImage.height);
        setMaskImg(resizedMask);

        // 组合原始图像和mask
        if (loadedImage) {
          const canvas = document.createElement('canvas');
          canvas.width = loadedImage.width;
          canvas.height = loadedImage.height;
          const ctx = canvas.getContext('2d');
          
          if (ctx) {
            ctx.drawImage(loadedImage, 0, 0);
            ctx.globalAlpha = 0.5; // 设置透明度
            ctx.drawImage(mask, 0, 0, loadedImage.width, loadedImage.height);
            
            const combinedImage = new Image();
            combinedImage.src = canvas.toDataURL();
            combinedImage.onload = () => {
              setImageWithMask(combinedImage);
            };
          }
        }
      }
    } catch (e) {
      console.log(e);
    }
  };

  // 添加这个辅助函数
  function resizeMask(mask: HTMLImageElement, width: number, height: number): HTMLImageElement {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(mask, 0, 0, width, height);
    }
    const resizedMask = new Image();
    resizedMask.src = canvas.toDataURL();
    return resizedMask;
  }

  return <Stage />;
};

export default App;