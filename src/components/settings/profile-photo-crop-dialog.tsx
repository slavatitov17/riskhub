'use client'

import { useCallback, useEffect, useState } from 'react'
import Cropper, { type Area } from 'react-easy-crop'
import { toast } from '@/lib/app-toast'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { getCroppedImageDataUrl } from '@/lib/crop-image'

interface ProfilePhotoCropDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (dataUrl: string) => void
}

export function ProfilePhotoCropDialog({
  open,
  onOpenChange,
  onSave
}: ProfilePhotoCropDialogProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

  const onCropComplete = useCallback((_area: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels)
  }, [])

  useEffect(() => {
    if (open) return
    setImageSrc((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setCroppedAreaPixels(null)
  }, [open])

  const handlePickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Выберите файл изображения')
      e.target.value = ''
      return
    }
    const url = URL.createObjectURL(file)
    setImageSrc((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return url
    })
    setZoom(1)
    setCrop({ x: 0, y: 0 })
    e.target.value = ''
  }

  const handleSaveCrop = async () => {
    if (!imageSrc || !croppedAreaPixels) {
      toast.message('Сначала выберите фото и дождитесь загрузки области')
      return
    }
    try {
      const dataUrl = await getCroppedImageDataUrl(imageSrc, croppedAreaPixels)
      onSave(dataUrl)
      onOpenChange(false)
      toast.success('Фото обновлено')
    } catch {
      toast.error('Не удалось обработать изображение')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Фото профиля</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <input
              type="file"
              accept="image/*"
              className="text-sm file:mr-3 file:rounded-md file:border file:border-border file:bg-background file:px-3 file:py-1.5"
              aria-label="Выбрать изображение"
              onChange={handlePickFile}
            />
          </div>
          {imageSrc ? (
            <>
              <div className="relative h-[280px] w-full overflow-hidden rounded-lg bg-muted">
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                  cropShape="round"
                  showGrid={false}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Масштаб</Label>
                <Slider
                  min={1}
                  max={3}
                  step={0.01}
                  value={[zoom]}
                  onValueChange={(v) => setZoom(v[0] ?? 1)}
                />
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Выберите файл, затем настройте область и нажмите «Сохранить».
            </p>
          )}
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button type="button" onClick={handleSaveCrop} disabled={!imageSrc}>
            Сохранить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
