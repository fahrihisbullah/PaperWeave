import { useState, useRef } from 'react'
import { api, ApiError } from '../lib/api'

interface Paper {
  id: string
  title: string | null
  original_filename: string
  status: string
}

interface PaperUploadProps {
  projectId: string
  onUploadComplete: () => void
}

export function PaperUpload({ projectId, onUploadComplete }: PaperUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string[]>([])
  const [uploadError, setUploadError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadFiles = async (files: File[]) => {
    const pdfFiles = files.filter((f) => f.type === 'application/pdf')

    if (pdfFiles.length === 0) {
      setUploadError('Only PDF files are allowed')
      return
    }

    const oversized = pdfFiles.filter((f) => f.size > 20 * 1024 * 1024)
    if (oversized.length > 0) {
      setUploadError(`${oversized.length} file(s) exceed 20MB limit`)
      return
    }

    setIsUploading(true)
    setUploadError('')
    setUploadProgress([])

    const results: string[] = []

    for (const file of pdfFiles) {
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('projectId', projectId)

        await api.upload<Paper>('/api/papers/upload', formData)
        results.push(`✓ ${file.name}`)
      } catch (err) {
        const msg = err instanceof ApiError ? err.message : 'Upload failed'
        results.push(`✗ ${file.name}: ${msg}`)
      }
      setUploadProgress([...results])
    }

    setIsUploading(false)
    onUploadComplete()

    // Clear progress after 5s
    setTimeout(() => setUploadProgress([]), 5000)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      uploadFiles(files)
    }
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      uploadFiles(files)
    }
  }

  return (
    <div>
      {/* Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
      >
        {isUploading ? (
          <div>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
            <p className="text-gray-600">Uploading {uploadProgress.length} file(s)...</p>
          </div>
        ) : (
          <div>
            <svg
              className="mx-auto h-12 w-12 text-gray-400 mb-3"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="text-gray-600 mb-2">
              Drag and drop PDFs here, or{' '}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                browse
              </button>
            </p>
            <p className="text-xs text-gray-400">
              PDF only, max 20MB each. Multiple files supported.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              multiple
              className="hidden"
              onChange={handleFileInput}
            />
          </div>
        )}
      </div>

      {/* Upload feedback */}
      {uploadError && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">{uploadError}</p>
        </div>
      )}
      {uploadProgress.length > 0 && (
        <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-md">
          <p className="text-xs font-medium text-gray-600 mb-1">Upload results:</p>
          {uploadProgress.map((msg, i) => (
            <p
              key={i}
              className={`text-xs ${msg.startsWith('✓') ? 'text-green-700' : 'text-red-700'}`}
            >
              {msg}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
