// Convert the onnx model mask prediction to ImageData
function arrayToImageData(input: any, width: number, height: number) {
  const [r, g, b, a] = [0, 114, 189, 255]; // the masks's blue color
  const arr = new Uint8ClampedArray(4 * width * height).fill(0);
  // for (let i = 0; i < input.length; i++) {
  //   // Threshold the onnx model mask prediction at 0.0
  //   // This is equivalent to thresholding the mask using predictor.model.mask_threshold
  //   // in python
  //   if (input[i] > 0.0) {
  //     arr[4 * i + 0] = r;
  //     arr[4 * i + 1] = g;
  //     arr[4 * i + 2] = b;
  //     arr[4 * i + 3] = a;
  //   }
  // }
  for (let i = 0, j = 0; i < input.length; i++, j += 4) {
    if (input[i] > 0.0) {
      arr[j] = r;
      arr[j + 1] = g;
      arr[j + 2] = b;
      arr[j + 3] = a;
    }
  }
  return new ImageData(arr, height, width);
}
// 获取mask部分的原图
export function combineImageDataWithImage(
  img: HTMLImageElement,
  input: any,
  width: number,
  height: number
) {
  const mask = arrayToImageData(input, width, height);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  canvas.width = mask.width;
  canvas.height = mask.height;
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, mask.width, mask.height);
  const len = imageData.data.length;
  const merageData = new Uint8ClampedArray(len);

  for (let i = 0; i < len; i += 4) {
    if (mask.data[i + 3] > 0.0) {
      merageData[i + 0] = imageData.data[i + 0];
      merageData[i + 1] = imageData.data[i + 1];
      merageData[i + 2] = imageData.data[i + 2];
      merageData[i + 3] = imageData.data[i + 3];
    }
  }

  const _imageData = new ImageData(merageData, mask.width, mask.height);
  return imageDataToImage(_imageData);
}

// Use a Canvas element to produce an image from ImageData
function imageDataToImage(imageData: ImageData) {
  const canvas = imageDataToCanvas(imageData);
  const image = new Image();
  image.src = canvas.toDataURL();
  return image;
}

// Canvas elements can be created from ImageData
function imageDataToCanvas(imageData: ImageData) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  ctx?.putImageData(imageData, 0, 0);
  return canvas;
}

// Convert the onnx model mask output to an HTMLImageElement
export function onnxMaskToImage(input: any, width: number, height: number) {
  return imageDataToImage(arrayToImageData(input, width, height));
}
