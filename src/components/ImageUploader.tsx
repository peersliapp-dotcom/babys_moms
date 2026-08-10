import { useRef, useState } from 'react'
import { Upload, X, Image as ImageIcon, Loader as Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useToast } from '../contexts/ToastContext'

type ImageUploaderProps = {
  images: string[]
  onImagesChange: (images: string[]) => void
}

export default function ImageUploader({ images, onImagesChange }: ImageUploaderProps) {
  const { showToast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const handleFiles = async (files: FileList) => {
    const validFiles = Array.from(files).filter((f) => {
      if (!f.type.startsWith('image/')) {
        showToast(`${f.name} is not an image`, 'error')
        return false
      }
      if (f.size > 5 * 1024 * 1024) {
        showToast(`${f.name} is too large (max 5MB)`, 'error')
        return false
      }
      return true
    })

    if (validFiles.length === 0) return

    setUploading(true)
    const uploaded: string[] = []

    for (const file of validFiles) {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
      const filePath = `products/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, { cacheControl: '3600', upsert: false })

      if (uploadError) {
        showToast(`Failed to upload ${file.name}`, 'error')
        continue
      }

      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath)

      uploaded.push(urlData.publicUrl)
    }

    if (uploaded.length > 0) {
      onImagesChange([...images, ...uploaded])
      showToast(
        `${uploaded.length} image${uploaded.length !== 1 ? 's' : ''} uploaded`,
        'success'
      )
    }

    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index))
  }

  const moveImage = (index: number, dir: -1 | 1) => {
    const newIndex = index + dir
    if (newIndex < 0 || newIndex >= images.length) return
    const newImages = [...images]
    ;[newImages[index], newImages[newIndex]] = [newImages[newIndex], newImages[index]]
    onImagesChange(newImages)
  }

  return (
    <div className="space-y-3">
      {/* Upload drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files)
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
          dragOver
            ? 'border-blush-400 bg-blush-50'
            : 'border-cream-400 hover:border-blush-300 hover:bg-cream-50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 size={28} className="text-blush-500 animate-spin" />
            <p className="text-sm text-wine-500">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-cream-200 flex items-center justify-center">
              <Upload size={22} className="text-wine-500" />
            </div>
            <p className="text-sm text-wine-600 font-medium">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-wine-400">PNG, JPG, WebP up to 5MB each</p>
          </div>
        )}
      </div>

      {/* Image previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {images.map((url, i) => (
            <div
              key={i}
              className="relative group aspect-square rounded-lg overflow-hidden bg-cream-100 border border-cream-300"
            >
              <img
                src={url}
                alt={`Product image ${i + 1}`}
                className="w-full h-full object-cover"
              />
              {i === 0 && (
                <span className="absolute top-1 left-1 bg-wine-700 text-cream-50 text-[10px] font-medium px-1.5 py-0.5 rounded">
                  Cover
                </span>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    moveImage(i, -1)
                  }}
                  disabled={i === 0}
                  className="w-7 h-7 rounded-full bg-white/90 text-wine-700 flex items-center justify-center text-xs disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white"
                  aria-label="Move left"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    moveImage(i, 1)
                  }}
                  disabled={i === images.length - 1}
                  className="w-7 h-7 rounded-full bg-white/90 text-wine-700 flex items-center justify-center text-xs disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white"
                  aria-label="Move right"
                >
                  →
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeImage(i)
                  }}
                  className="w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600"
                  aria-label="Remove image"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {images.length === 0 && !uploading && (
        <div className="flex items-center gap-2 text-xs text-wine-400">
          <ImageIcon size={14} /> No images yet — upload or paste URLs below
        </div>
      )}
    </div>
  )
}
