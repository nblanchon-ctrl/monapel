/** Compression locale des photos avant leur transfert vers Supabase. */
const MAX_DIMENSION = 1600;
const TARGET_BYTES = 350 * 1024;
const MAX_BYTES = 1024 * 1024;
function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Compression WebP indisponible.')), 'image/webp', quality));
}
export async function compressNewsImage(file: File): Promise<File> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Utilisez une image JPG, PNG ou WebP.');
  if (file.size > 20 * 1024 * 1024) throw new Error('Image trop volumineuse (20 Mo maximum).');
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = objectUrl;
    await img.decode();
    if (!img.naturalWidth || !img.naturalHeight) throw new Error('Image invalide.');
    if (img.naturalWidth * img.naturalHeight > 70_000_000) throw new Error('Dimensions trop importantes.');
    const canvas = document.createElement('canvas');
    const ratio = Math.min(1, MAX_DIMENSION / Math.max(img.naturalWidth, img.naturalHeight));
    canvas.width = Math.max(1, Math.round(img.naturalWidth * ratio));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * ratio));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Compression indisponible sur cet appareil.');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    let blob = await toBlob(canvas, 0.82);
    for (const q of [0.7, 0.58, 0.46]) { if (blob.size <= TARGET_BYTES) break; blob = await toBlob(canvas, q); }
    if (blob.type !== 'image/webp') throw new Error('Ce navigateur ne prend pas en charge WebP.');
    if (blob.size > MAX_BYTES) throw new Error('Photo encore trop lourde après compression (1 Mo maximum).');
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.webp', {type:'image/webp', lastModified:Date.now()});
  } finally { URL.revokeObjectURL(objectUrl); }
}
