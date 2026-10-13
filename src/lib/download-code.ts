/** 模块与测试平台共用同一种下载方式，保留源码里的原始换行。 */
export function downloadCode(code: string, filename: string) {
  const url = URL.createObjectURL(
    new Blob([code], { type: "text/plain;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
