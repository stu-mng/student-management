import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function toTraditionalChinese(num: number) {
  if (typeof num !== 'number' || !Number.isInteger(num) || num < 0) {
      return "錯誤：請輸入非負整數";
  }

  const units = ["", "十", "百", "千"];
  const bigUnits = ["", "萬", "億"];
  const digits = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"];

  let result = "";
  let bigUnitIndex = 0;
  let isPreviousZero = false;

  while (num > 0) {
      let chunk = num % 10000; // Get the last 4 digits
      num = Math.floor(num / 10000);

      let chunkResult = "";
      let unitIndexForChunk = 0;
      let hasNonZero = false; // Track if the chunk has any non-zero digit

      while (chunk > 0) {
          const digit = chunk % 10;
          chunk = Math.floor(chunk / 10);

          if (digit !== 0) {
              if (isPreviousZero) {
                  chunkResult = "零" + chunkResult;
              }
              chunkResult = digits[digit] + units[unitIndexForChunk] + chunkResult;
              isPreviousZero = false;
              hasNonZero = true;
          } else {
              isPreviousZero = true;
          }
          unitIndexForChunk++;
      }

      if (hasNonZero) {
          result = chunkResult + bigUnits[bigUnitIndex] + result;
      }
      else if (bigUnitIndex > 0 && result.length>0 && !result.startsWith("零"))
      {
           result = "零" + result;
      }

      bigUnitIndex++;
      isPreviousZero = false;
  }
  //處理 10, 100, 1000, 10000， 一十，一百，一千，一萬
  if (result.startsWith("一十")) {
      result = result.slice(1);
  }
  if (result === "") {
      result = "零";
  }

  return result;
}
