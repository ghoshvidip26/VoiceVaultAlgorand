import { Button } from "@/components/ui/button";
import { Upload, Mic, File, X, CheckCircle } from "lucide-react";
import { useState, useCallback } from "react";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  progress: number;
  status: "uploading" | "complete" | "error";
}

export function VoiceUploader() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      (file) => file.type.startsWith("audio/")
    );

    const newFiles: UploadedFile[] = droppedFiles.map((file) => ({
      id: Math.random().toString(36).substring(7),
      name: file.name,
      size: file.size,
      progress: 0,
      status: "uploading" as const,
    }));

    setFiles((prev) => [...prev, ...newFiles]);

    // Simulate upload progress
    newFiles.forEach((file) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          setFiles((prev) =>
            prev.map((f) =>
              f.id === file.id ? { ...f, progress: 100, status: "complete" } : f
            )
          );
        } else {
          setFiles((prev) =>
            prev.map((f) => (f.id === file.id ? { ...f, progress } : f))
          );
        }
      }, 500);
    });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="space-y-6">
      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-card/50"
        }`}
      >
        <div className="flex flex-col items-center">
          <div className="p-4 rounded-2xl bg-primary/10 mb-4">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          <h3 className="font-display text-xl font-semibold mb-2">
            Drop audio files here
          </h3>
          <p className="text-muted-foreground mb-4">
            or click to browse your files
          </p>
          <p className="text-sm text-muted-foreground">
            Supports WAV, MP3, M4A, FLAC • Max 100MB per file
          </p>
          <input
            type="file"
            accept="audio/*"
            multiple
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={(e) => {
              if (e.target.files) {
                const event = {
                  preventDefault: () => {},
                  dataTransfer: { files: e.target.files },
                } as unknown as React.DragEvent;
                handleDrop(event);
              }
            }}
          />
        </div>
      </div>

      {/* Recording Option */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-border" />
        <span className="text-sm text-muted-foreground">or</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <Button variant="outline" className="w-full h-14">
        <Mic className="h-5 w-5 mr-2" />
        Record Directly
      </Button>

      {/* Uploaded Files */}
      {files.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-display font-semibold">Uploaded Files</h4>
          {files.map((file) => (
            <div
              key={file.id}
              className="glass-card p-4 flex items-center gap-4"
            >
              <div className="p-2 rounded-lg bg-muted">
                <File className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatSize(file.size)}
                </p>
                {file.status === "uploading" && (
                  <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-300"
                      style={{ width: `${file.progress}%` }}
                    />
                  </div>
                )}
              </div>
              {file.status === "complete" ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <button
                  onClick={() => removeFile(file.id)}
                  className="p-1 rounded hover:bg-muted transition-colors"
                >
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
