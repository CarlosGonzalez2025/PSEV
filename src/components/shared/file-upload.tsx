'use client';

import React, { useState } from 'react';
import { useStorage } from '@/firebase/provider';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { UploadCloud, CheckCircle2, Loader2, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onUploadComplete: (url: string, contentType: string) => void;
  path: string;
  label?: string;
  accept?: string;
  className?: string;
}

export function FileUpload({ onUploadComplete, path, label, accept, className }: FileUploadProps) {
  const storageInstance = useStorage();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setCompleted(false);
      setProgress(0);
    }
  };

  const startUpload = async () => {
    if (!file || !storageInstance) return;

    setUploading(true);
    // Limpiar nombre de archivo para evitar problemas en URLs
    const cleanName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const storageRef = ref(storageInstance, `${path}/${Date.now()}_${cleanName}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setProgress(p);
      },
      (error) => {
        console.error('Upload error:', error);
        setUploading(false);
        alert("Error al subir el archivo. Intente de nuevo.");
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        setUploading(false);
        setCompleted(true);
        onUploadComplete(downloadURL, file.type);
      }
    );
  };

  return (
    <div className={cn("space-y-3 p-4 border-2 border-dashed rounded-xl transition-colors", 
      completed ? "border-green-500/50 bg-green-500/5" : "border-muted-foreground/20 bg-muted/30",
      className)}>
      
      <div className="flex flex-col gap-1">
        {label && <span className="text-sm font-semibold text-foreground/80">{label}</span>}
        <span className="text-xs text-muted-foreground">PDF o Imagen (máx 5MB)</span>
      </div>

      <div className="flex items-center gap-3">
        <label className={cn(
          "relative flex items-center justify-center cursor-pointer transition-all",
          uploading && "opacity-50 pointer-events-none"
        )}>
          <input
            type="file"
            accept={accept || "application/pdf,image/*"}
            onChange={handleFileChange}
            className="sr-only"
            disabled={uploading}
          />
          <div className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 text-sm font-medium">
            <FileText className="w-4 h-4" />
            {file ? "Cambiar archivo" : "Seleccionar archivo"}
          </div>
        </label>

        {file && !completed && !uploading && (
          <Button size="sm" onClick={startUpload} className="bg-primary hover:bg-primary/90">
            <UploadCloud className="w-4 h-4 mr-2" /> Subir
          </Button>
        )}

        {uploading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin" />
            Subiendo... {Math.round(progress)}%
          </div>
        )}

        {completed && (
          <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
            <CheckCircle2 className="w-4 h-4" />
            ¡Cargado con éxito!
          </div>
        )}
      </div>

      {file && !completed && !uploading && (
        <div className="text-xs text-muted-foreground italic truncate">
          Archivo seleccionado: {file.name}
        </div>
      )}

      {uploading && <Progress value={progress} className="h-1.5" />}
    </div>
  );
}
