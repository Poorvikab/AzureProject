import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, AlertCircle, AlertTriangle, FileText, Image as ImageIcon, Loader2, ArrowRight } from 'lucide-react';
import { apiClient, getCurrentUserId, getErrorMessage, setHasUploadedData } from '../api/client';

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
  const navigate = useNavigate();
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
    const currentUserId = getCurrentUserId();
    if (currentUserId) {
      formData.append('user_id', currentUserId);
    }

    const isImg = isImageFile(selectedFile);
    const endpoint = isImg ? '/api/vision/upload' : '/api/documents/upload';

    try {
      const response = await apiClient.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = response.data;
      const nextResult = isImg
        ? {
            kind: 'image' as const,
            filename: data.filename || selectedFile.name,
            blob_url: data.blob_url,
            caption: data.caption,
            tags: Array.isArray(data.tags) ? data.tags : [],
            chunks_indexed: data.chunks_indexed,
            indexing_warning: data.indexing_warning,
          }
        : {
            kind: 'document' as const,
            filename: data.filename || selectedFile.name,
            blob_url: data.blob_url,
            page_count: data.page_count,
            chunks_indexed: data.chunks_indexed,
            indexing_warning: data.indexing_warning,
          };

      setResult(nextResult);
      setHasUploadedData(true);
      navigate('/chat', { replace: true });
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
    <div className="page-shell">
      <div className="page-shell-inner max-w-3xl py-8 sm:py-12">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="kicker mb-3">Data intake</div>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Upload your media</h1>
            <p className="mt-2 max-w-xl text-sm text-slate-300">
              Add documents or images to build your knowledge base before asking the digital twin any questions.
            </p>
          </div>
        </div>

        {error && (
          <div role="alert" className="status-banner error mb-6">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!result ? (
          <div className="glass-panel p-5 sm:p-7">
            <div className="space-y-5">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`cursor-pointer rounded-[1.5rem] border border-dashed p-8 text-center transition-all duration-200 sm:p-12 ${
                  isDragOver
                    ? 'border-cyan-400/70 bg-cyan-500/[0.08] shadow-[0_0_0_1px_rgba(34,211,238,0.2)]'
                    : 'border-white/10 bg-slate-950/30 hover:border-white/20 hover:bg-slate-950/45'
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
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/5 text-cyan-100 shadow-[0_0_30px_rgba(34,211,238,0.2)]">
                    <Upload className="h-6 w-6" />
                  </div>
                  <div className="text-base font-medium text-white">
                    {selectedFile ? selectedFile.name : 'Click to select or drag and drop a file'}
                  </div>
                  <div className="mt-2 text-sm text-slate-300">
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
                  <button type="button" onClick={resetForm} disabled={isUploading} className="ghost-button">
                    Clear
                  </button>
                )}
                <button type="button" onClick={handleUpload} disabled={!selectedFile || isUploading} className="primary-button max-w-[220px]">
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <span>Upload File</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="glass-panel p-6 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                {result.kind === 'image' ? (
                  <ImageIcon className="h-5 w-5 text-cyan-200" />
                ) : (
                  <FileText className="h-5 w-5 text-violet-200" />
                )}
                <div>
                  <h2 className="text-base font-semibold text-white">{result.filename}</h2>
                  <div className="mt-1 text-xs text-slate-300">
                    {result.kind === 'image' ? 'Image uploaded' : 'Document uploaded'}
                  </div>
                </div>
              </div>

              <button onClick={resetForm} className="text-xs text-slate-300 underline decoration-slate-500 underline-offset-4 transition-colors hover:text-white">
                Upload another
              </button>
            </div>

            {result.indexing_warning && (
              <div className="status-banner error mt-5">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <span className="font-semibold">Indexing Warning:</span> {result.indexing_warning}
                </div>
              </div>
            )}

            <div className="mt-6 space-y-4 border-t border-white/10 pt-4 text-sm text-slate-200">
              {result.kind === 'image' && (
                <>
                  {result.caption && (
                    <div>
                      <span className="mb-1 block text-[0.7rem] font-medium uppercase tracking-[0.18em] text-slate-300">Caption</span>
                      <p className="leading-relaxed text-slate-100">{result.caption}</p>
                    </div>
                  )}

                  {result.tags && result.tags.length > 0 && (
                    <div>
                      <span className="mb-2 block text-[0.7rem] font-medium uppercase tracking-[0.18em] text-slate-300">Tags</span>
                      <div className="flex flex-wrap gap-2">
                        {result.tags.map((tag) => (
                          <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-200">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {typeof result.chunks_indexed === 'number' && (
                    <div>
                      <span className="mb-1 block text-[0.7rem] font-medium uppercase tracking-[0.18em] text-slate-300">Indexed chunks</span>
                      <span className="text-slate-100">{result.chunks_indexed}</span>
                    </div>
                  )}
                </>
              )}

              {result.kind === 'document' && (
                <>
                  {typeof result.page_count === 'number' && (
                    <div>
                      <span className="mb-1 block text-[0.7rem] font-medium uppercase tracking-[0.18em] text-slate-300">Page count</span>
                      <span className="text-slate-100">{result.page_count}</span>
                    </div>
                  )}

                  {typeof result.chunks_indexed === 'number' && (
                    <div>
                      <span className="mb-1 block text-[0.7rem] font-medium uppercase tracking-[0.18em] text-slate-300">Indexed chunks</span>
                      <span className="text-slate-100">{result.chunks_indexed}</span>
                    </div>
                  )}
                </>
              )}

              {result.blob_url && (
                <div>
                  <span className="mb-1 block text-[0.7rem] font-medium uppercase tracking-[0.18em] text-slate-300">View file</span>
                  <a href={result.blob_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-cyan-200 hover:text-cyan-100">
                    Open uploaded asset <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
