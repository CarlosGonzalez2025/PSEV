
'use client';

import { useState, useRef } from 'react';
import { ExcelService } from '@/lib/excel';
import { Button } from '@/components/ui/button';
import {
    Download,
    Upload,
    FileSpreadsheet,
    Loader2,
    FileDown
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ExcelBulkActionsProps {
    data: any[];
    templateColumns: string[];
    onImport: (importedData: any[]) => Promise<void>;
    fileName: string;
}

export function ExcelBulkActions({ data, templateColumns, onImport, fileName }: ExcelBulkActionsProps) {
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExport = () => {
        try {
            ExcelService.exportToExcel(data, fileName);
            toast({ title: "Exportación exitosa", description: "El archivo Excel ha sido generado." });
        } catch (error) {
            toast({ variant: "destructive", title: "Error al exportar", description: "No se pudo generar el archivo." });
        }
    };

    const handleDownloadTemplate = () => {
        ExcelService.downloadTemplate(templateColumns, fileName);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        try {
            const importedData = await ExcelService.importFromExcel(file);
            await onImport(importedData);
            toast({ title: "Importación exitosa", description: `${importedData.length} registros procesados.` });
        } catch (error) {
            toast({ variant: "destructive", title: "Error al importar", description: "Verifique el formato del archivo." });
        } finally {
            setIsImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="flex gap-2">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".xlsx, .xls"
                className="hidden"
            />

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="border-border-dark text-white font-bold gap-2">
                        <FileSpreadsheet className="w-4 h-4" />
                        Acciones Excel
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-surface-dark border-border-dark text-white">
                    <DropdownMenuItem onClick={handleExport} className="cursor-pointer hover:bg-white/10 gap-2">
                        <Download className="w-4 h-4" /> Exportar Actuales
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => fileInputRef.current?.click()} disabled={isImporting} className="cursor-pointer hover:bg-white/10 gap-2">
                        {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        Carga Masiva
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDownloadTemplate} className="cursor-pointer hover:bg-white/10 gap-2">
                        <FileDown className="w-4 h-4" /> Descargar Plantilla
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
