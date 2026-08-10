import { useState, useRef } from 'react'
import { Upload, X, CircleCheck as CheckCircle, Image as ImageIcon, CircleAlert as AlertCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../contexts/ToastContext'
import { useAuth } from '../../contexts/AuthContext'
import AdminBackLink from '../../components/AdminBackLink'

type UploadedImage = {
  file: File
  url: string
  name: string
  uploaded: boolean
  uploading: boolean
  error: boolean
}

type DraftProduct = {
  id: string
  name: string
  slug: string
  imageUrls: string[]
  status: 'pending' | 'created' | 'error'
}

export default function AdminBulkUpload() {
  const { showToast } = useToast()
  const { session } = useAuth()
  const [images, setImages] = useState<UploadedImage[]>([])
  const [drafts, setDrafts] = useState<DraftProduct[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = (files: FileList | null) => {
    if (!files) return
    const newImages: UploadedImage[] = Array.from(files).map((file) => ({
      file,
      url: URL.createObjectURL(file),
      name: file.name,
      uploaded: false,
      uploading: false,
      error: false,
    }))
    setImages((prev) => [...prev, ...newImages])
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const slugify = (s: string) =>
    s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

  const handleUpload = async () => {
    if (images.length === 0) {
      showToast('Please select images first', 'error')
      return
    }

    setUploading(true)
    const uploadedUrls: string[] = []
    const updatedImages = [...images]

    for (let i = 0; i < updatedImages.length; i++) {
      updatedImages[i].uploading = true
      setImages([...updatedImages])

      const ext = updatedImages[i].file.name.split('.').pop() ?? 'jpg'
      const fileName = `${Date.now()}-${i}.${ext}`
      const { error } = await supabase.storage
        .from('product-images')
        .upload(fileName, updatedImages[i].file)

      if (error) {
        updatedImages[i].uploading = false
        updatedImages[i].error = true
      } else {
        const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(fileName)
        uploadedUrls.push(urlData.publicUrl)
        updatedImages[i].uploading = false
        updatedImages[i].uploaded = true
      }
      setImages([...updatedImages])
    }

    if (uploadedUrls.length === 0) {
      showToast('Failed to upload images', 'error')
      setUploading(false)
      return
    }

    // Group images into draft products — one product per image for now
    const newDrafts: DraftProduct[] = uploadedUrls.map((url, i) => {
      const baseName = images[i].file.name.replace(/\.[^/.]+$/, '')
      const slug = slugify(baseName) || `product-${Date.now()}-${i}`
      return {
        id: crypto.randomUUID(),
        name: baseName,
        slug,
        imageUrls: [url],
        status: 'pending',
      }
    })

    // Insert all as draft products (inactive)
    const inserts = newDrafts.map((d) => ({
      name: d.name,
      slug: d.slug,
      images: d.imageUrls,
      is_active: false,
      is_featured: false,
      category_id: null,
      description: null,
    }))

    const { data: inserted, error } = await supabase
      .from('products')
      .insert(inserts)
      .select('id, slug, name')

    if (error) {
      showToast('Failed to create draft products', 'error')
      setUploading(false)
      return
    }

    const updatedDrafts = (inserted ?? []).map((p: { id: string; slug: string; name: string }) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      imageUrls: newDrafts.find((d) => d.slug === p.slug)?.imageUrls ?? [],
      status: 'created' as const,
    }))

    setDrafts(updatedDrafts)
    showToast(`${updatedDrafts.length} draft products created! Edit them to add details.`, 'success')
    setImages([])
    setUploading(false)
  }

  return (
    <div className="section-padding py-8 animate-fade-in">
      <AdminBackLink />
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif text-wine-800">Bulk Upload</h1>
          <p className="text-wine-400 text-sm mt-1">Upload multiple product images at once. Draft products are created — edit them later to add details.</p>
        </div>
      </div>

      {/* Upload Zone */}
      <div
        className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${
          dragOver ? 'border-blush-400 bg-blush-50' : 'border-cream-400 hover:border-blush-300 bg-white'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <Upload size={40} className="text-wine-300 mx-auto mb-4" />
        <p className="text-wine-600 font-medium mb-1">Drop images here or click to browse</p>
        <p className="text-sm text-wine-400">PNG, JPG, WebP — each image becomes a separate draft product</p>
      </div>

      {/* Preview Grid */}
      {images.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-serif text-wine-800">{images.length} images selected</h2>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="btn-primary flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="w-5 h-5 border-2 border-cream-50 border-t-transparent rounded-full animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={18} /> Create Draft Products
                </>
              )}
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {images.map((img, i) => (
              <div key={i} className="relative group">
                <div className="aspect-square rounded-xl overflow-hidden bg-cream-100 relative">
                  <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                  {img.uploading && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-cream-50 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  {img.uploaded && (
                    <div className="absolute inset-0 bg-green-500/30 flex items-center justify-center">
                      <CheckCircle size={24} className="text-white" />
                    </div>
                  )}
                  {img.error && (
                    <div className="absolute inset-0 bg-red-500/30 flex items-center justify-center">
                      <AlertCircle size={24} className="text-white" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-wine-500 mt-1 truncate">{img.name}</p>
                <button
                  onClick={(e) => { e.stopPropagation(); removeImage(i) }}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Created Drafts */}
      {drafts.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-serif text-wine-800 mb-4">Draft Products Created</h2>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-cream-100">
                <tr>
                  <th className="text-left py-3 px-4 text-wine-700">Image</th>
                  <th className="text-left py-3 px-4 text-wine-700">Product Name</th>
                  <th className="text-left py-3 px-4 text-wine-700">Slug</th>
                  <th className="text-left py-3 px-4 text-wine-700">Status</th>
                  <th className="text-right py-3 px-4 text-wine-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {drafts.map((draft) => (
                  <tr key={draft.id} className="border-t border-cream-200">
                    <td className="py-3 px-4">
                      {draft.imageUrls[0] ? (
                        <img src={draft.imageUrls[0]} alt={draft.name} className="w-12 h-12 rounded-lg object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-cream-100 flex items-center justify-center">
                          <ImageIcon size={18} className="text-wine-300" />
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-medium text-wine-800">{draft.name}</td>
                    <td className="py-3 px-4 text-wine-500">{draft.slug}</td>
                    <td className="py-3 px-4">
                      <span className="badge bg-amber-100 text-amber-700">Draft</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <a
                        href={`/admin/products?edit=${draft.id}`}
                        className="text-blush-500 hover:text-blush-600 text-sm font-medium"
                      >
                        Edit Details
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-wine-400 mt-3">
            Drafts are inactive (not visible to customers). Edit each product to add category, description, variants, and pricing — then set it to Active.
          </p>
        </div>
      )}

      {/* How it works */}
      <div className="mt-12 bg-blush-50 rounded-2xl p-6">
        <h3 className="font-serif text-wine-800 mb-3">How Bulk Upload Works</h3>
        <ol className="space-y-2 text-sm text-wine-600 list-decimal list-inside">
          <li>Select or drag multiple product images.</li>
          <li>Click "Create Draft Products" — each image becomes a separate draft product.</li>
          <li>Product name is auto-generated from the image filename.</li>
          <li>Go to Products page and edit each draft to add category, description, variants, and pricing.</li>
          <li>Set the product to Active when ready — it will appear in your store.</li>
        </ol>
      </div>
    </div>
  )
}
