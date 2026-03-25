
import * as XLSX from 'xlsx';

export const ExcelService = {
    /**
     * Exporta un array de objetos a un archivo Excel
     */
    exportToExcel: (data: any[], fileName: string) => {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Datos");
        XLSX.writeFile(workbook, `${fileName}.xlsx`);
    },

    /**
     * Procesa un archivo Excel y retorna un array de objetos
     */
    importFromExcel: async (file: File): Promise<any[]> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = e.target?.result;
                    const workbook = XLSX.read(data, { type: 'binary' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const json = XLSX.utils.sheet_to_json(worksheet);
                    resolve(json);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = (error) => reject(error);
            reader.readAsBinaryString(file);
        });
    },

    /**
     * Genera una plantilla básica según las columnas requeridas
     */
    downloadTemplate: (columns: string[], fileName: string) => {
        const templateData = [columns.reduce((acc, col) => ({ ...acc, [col]: "" }), {})];
        const worksheet = XLSX.utils.json_to_sheet(templateData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Plantilla");
        XLSX.writeFile(workbook, `${fileName}_plantilla.xlsx`);
    }
};
