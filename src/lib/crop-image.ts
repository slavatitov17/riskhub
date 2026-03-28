import type { Area } from 'react-easy-crop'

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (e) => reject(e))
    if (url.startsWith('http://') || url.startsWith('https://')) {
      image.setAttribute('crossOrigin', 'anonymous')
    }
    image.src = url
  })
}

/**
 * Renders the cropped region of the image to a JPEG data URL.
 */
export async function getCroppedImageDataUrl(
  imageSrc: string,
  pixelCrop: Area
): Promise<string> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas не поддерживается')
  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  )
  return canvas.toDataURL('image/jpeg', 0.92)
}
