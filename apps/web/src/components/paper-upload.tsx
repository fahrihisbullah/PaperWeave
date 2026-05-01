import { useState, useRef } from 'react'
import { api, ApiError } from '../lib/api'

interface Paper {
  id: string
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
        results.push(`✗ ${file.name}: ${err instanceof ApiError ? err.message : 'Failed'}`)
      }
      setUploadProgress([...results])
    }

    setIsUploading(false)
    onUploadComplete()
    setTimeout(() => setUploadProgress([]), 5000)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) uploadFiles(files)
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) uploadFiles(files)
  }

  return (
    <div>
      <div
        className={`border border-dashed rounded-xl py-10 px-6 text-center transition-all cursor-pointer ${
          dragOver
            ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/[0.06]'
            : 'border-[var(--color-primary)]/30 bg-[var(--color-primary)]/[0.02] hover:border-[var(--color-primary)]/60 hover:bg-[var(--color-primary)]/[0.04]'
        } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => fileInputRef.current?.click()}
      >
        {isUploading ? (
          <div className="flex items-center justify-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-pulse"></div>
            <p className="text-[15px] text-[var(--color-text-muted)]">Uploading...</p>
          </div>
        ) : (
          <div>
            <svg
              className="mx-auto w-10 h-10 text-[var(--color-primary)]/50 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-[1.02rem] font-medium text-[var(--color-text)]">
              Drop PDFs here or{' '}
              <span className="text-[var(--color-primary)] underline underline-offset-2">
                browse files
              </span>
            </p>
            <p className="mt-2 text-[13px] text-[var(--color-text-faint)]">
              PDF only · Max 20MB per file · Multiple files supported
            </p>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          multiple
          className="hidden"
          onChange={handleFileInput}
        />
      </div>

      {uploadError && <p className="mt-3 text-[14px] text-red-600">{uploadError}</p>}
      {uploadProgress.length > 0 && (
        <div className="mt-4 space-y-1">
          {uploadProgress.map((msg, i) => (
            <p
              key={i}
              className={`text-[13px] ${msg.startsWith('✓') ? 'text-[var(--color-primary)]' : 'text-red-600'}`}
            >
              {msg}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
