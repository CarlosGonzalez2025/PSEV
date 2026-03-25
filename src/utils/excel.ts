import * as XLSX from "xlsx";
import { toast } from "@/hooks/use-toast";

/**
 * Genera un archivo Excel a partir de un arreglo de objetos JSON y lanza la descarga.
 * @param data Arreglo de objetos (filas)
 * @param filename Nombre del archivo .xlsx a descargar
 */
export const exportToExcel = <T extends Record<string, any>>(data: T[], filename: string) => {
    try {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
        XLSX.writeFile(workbook, `${filename}.xlsx`);
    } catch (error) {
        console.error("Error exportando a Excel:", error);
        toast({ variant: "destructive", title: "Error al exportar plantilla" });
    }
};

/**
 * Lee un archivo Excel y retorna una promesa con el JSON resultante.
 * @param file Archivo subido (File/Blob)
 * @returns Promesa que resuelve en un arreglo de objetos
 */
export const importFromExcel = <T = any>(file: File): Promise<T[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const buffer = e.target?.result;
                const workbook = XLSX.read(buffer, { type: "binary" });

                // Asumimos que la data está en la primera hoja
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];

                // Convertir a JSON
                const jsonData = XLSX.utils.sheet_to_json<T>(worksheet, { defval: "" });
                resolve(jsonData);
            } catch (error) {
                console.error("Error parseando Excel:", error);
                reject(error);
            }
        };

        reader.onerror = (error) => {
            console.error("Error leyendo archivo:", error);
            reject(error);
        };

        reader.readAsArrayBuffer(file);
    });
};
