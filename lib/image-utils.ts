export async function imageToBlob(src: string): Promise<Blob> {
  const res = await fetch(src);
  return res.blob();
}
