import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Upload, AlertCircle, AlertTriangle, FileText, Image as ImageIcon, Loader2, ArrowRight } from 'lucide-react';
import { apiClient, getErrorMessage } from '../api/client';

interface ImageUploadResult {
  kind: 'image';
  filename: string;
  blob_url?: string;
  caption?: string;
  tags?: string[];
  chunks_indexed?: number;
  indexing_warning?: string;
}

interface DocumentUploadResult {
  kind: 'document';
  filename: string;
  blob_url?: string;
  page_count?: number;
  chunks_indexed?: number;
  indexing_warning?: string;
}

type UploadResult = ImageUploadResult | DocumentUploadResult;

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp'];

function isImageFile(file: File): boolean {
  if (file.type && file.type.startsWith('image/')) {
    return true;
  }
  const lowerName = file.name.toLowerCase();
  return IMAGE_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
}

export default function UploadPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFile = (file: File) => {
    setError(null);
    setResult(null);

    const isImg = isImageFile(file);
    if (isImg && file.size > 4 * 1024 * 1024) {
      setError('Image file exceeds the 4MB limit.');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    const isImg = isImageFile(selectedFile);
    const endpoint = isImg ? '/api/vision/upload' : '/api/documents/upload';

    try {
      const response = await apiClient.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = response.data;
      if (isImg) {
        setResult({
          kind: 'image',
          filename: data.filename || selectedFile.name,
          blob_url: data.blob_url,
          caption: data.caption,
          tags: Array.isArray(data.tags) ? data.tags : [],
          chunks_indexed: data.chunks_indexed,
          indexing_warning: data.indexing_warning,
        });
      } else {
        setResult({
          kind: 'document',
          filename: data.filename || selectedFile.name,
          blob_url: data.blob_url,
          page_count: data.page_count,
          chunks_indexed: data.chunks_indexed,
          indexing_warning: data.indexing_warning,
        });
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-2xl mx-auto w-full px-4 sm:px-6 py-10">
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-100">Upload Media</h1>
        <p className="text-xs text-zinc-400 mt-1">
          Upload documents (PDF, DOCX) or images (JPEG, PNG, GIF, BMP, max 4MB) to index into the knowledge base.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-6 p-3.5 rounded-md bg-zinc-900 border border-red-900/60 text-red-400 text-xs flex items-start gap-2.5"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{error}</span>
        </div>
      )}

      {/* Upload Box */}
      {!result ? (
        <div className="space-y-4">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border border-dashed rounded-lg p-8 sm:p-12 text-center cursor-pointer transition-colors ${
              isDragOver
                ? 'border-zinc-500 bg-zinc-900/80'
                : 'border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 hover:bg-zinc-900/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              accept="image/jpeg,image/png,image/gif,image/bmp,.pdf,.doc,.docx"
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center">
              <Upload className="w-8 h-8 text-zinc-400 mb-3" />
              <div className="text-sm font-medium text-zinc-200">
                {selectedFile ? selectedFile.name : 'Click to select or drag and drop a file'}
              </div>
              <div className="text-xs text-zinc-400 mt-1">
                {selectedFile
                  ? `${(selectedFile.size / 1024).toFixed(1)} KB · ${
                      isImageFile(selectedFile) ? 'Image (Vision)' : 'Document'
                    }`
                  : 'PDF, DOC, DOCX, JPEG, PNG, GIF, BMP'}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            {selectedFile && (
              <button
                type="button"
                onClick={resetForm}
                disabled={isUploading}
                className="px-3.5 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors disabled:opacity-50"
              >
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="px-4 py-2 bg-zinc-100 text-zinc-900 text-xs font-medium rounded-md hover:bg-zinc-200 transition-colors disabled:opacity-40 flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Uploading & Indexing...</span>
                </>
              ) : (
                <span>Upload File</span>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* Results Section - strictly display only real fields returned */
        <div className="border border-zinc-800 rounded-lg p-6 bg-zinc-900/40 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              {result.kind === 'image' ? (
                <ImageIcon className="w-5 h-5 text-zinc-400" />
              ) : (
                <FileText className="w-5 h-5 text-zinc-400" />
              )}
              <div>
                <h2 className="text-sm font-medium text-zinc-100">{result.filename}</h2>
                <div className="text-xs text-zinc-400 mt-0.5">
                  {result.kind === 'image' ? 'Image uploaded' : 'Document uploaded'}
                </div>
              </div>
            </div>

            <button
              onClick={resetForm}
              className="text-xs text-zinc-400 hover:text-zinc-200 underline transition-colors"
            >
              Upload another
            </button>
          </div>

          {/* Indexing Warning if present */}
          {result.indexing_warning && (
            <div className="p-3 rounded bg-zinc-900 border border-amber-900/60 text-amber-300 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-medium">Indexing Warning: </span>
                {result.indexing_warning}
              </div>
            </div>
          )}

          {/* Metadata Display */}
          <div className="border-t border-zinc-800 pt-4 space-y-3 text-xs">
            {result.kind === 'image' && (
              <>
                {result.caption && (
                  <div>
                    <span className="text-zinc-400 block mb-0.5">Caption</span>
                    <p className="text-zinc-200 leading-relaxed">{result.caption}</p>
                  </div>
                )}
                {result.tags && result.tags.length > 0 && (
                  <div>
                    <span className="text-zinc-400 block mb-0.5">Tags</span>
                    <div className="text-zinc-300">
                      {result.tags.map((tag, idx) => (
                        <span key={tag}>
                          {tag}
                          {idx < (result.tags?.length ?? 0) - 1 ? ' · ' : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {result.kind === 'document' && typeof result.page_count !== 'undefined' && (
              <div>
                <span className="text-zinc-400 block mb-0.5">Pages</span>
                <span className="text-zinc-200 font-mono tabular-nums">{result.page_count}</span>
              </div>
            )}

            {typeof result.chunks_indexed !== 'undefined' && (
              <div>
                <span className="text-zinc-400 block mb-0.5">Chunks Indexed</span>
                <span className="text-zinc-200 font-mono tabular-nums">{result.chunks_indexed}</span>
              </div>
            )}
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-zinc-800 text-xs">
            <span className="text-zinc-400">Content ready for grounding</span>
            <Link
              to="/chat"
              className="inline-flex items-center gap-1.5 text-zinc-100 hover:text-white font-medium underline underline-offset-4"
            >
              <span>Query in Chat</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
