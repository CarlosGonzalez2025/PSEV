import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InspectionFormValues } from '../schema';
import { TipoVehiculo, VALORES_ESTADO, VALORES_FUNCION } from '@/types/inspeccion';
import { Lightbulb } from 'lucide-react';

interface Props {
    form: UseFormReturn<InspectionFormValues>;
    tipoVehiculo: TipoVehiculo;
}

export function SegmentoIluminacion({ form, tipoVehiculo }: Props) {
    const t = tipoVehiculo;

    const renderSelect = (name: any, label: string, options: readonly string[]) => (
        <FormField control={form.control} name={`iluminacion.${name}` as any} render={({ field }) => (
            <FormItem className="flex flex-col rounded-lg border border-white/5 bg-background-dark/30 p-3 shadow-sm">
                <FormLabel className="text-[10px] font-bold text-text-secondary uppercase">{label}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl>
                        <SelectTrigger className="h-8 text-xs bg-background-dark border-border-dark">
                            <SelectValue placeholder="Evaluar..." />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-surface-dark border-border-dark text-foreground">
                        {options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                </Select>
                <FormMessage />
            </FormItem>
        )} />
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-amber-500/20 text-amber-400 border-none">4</Badge>
                <h3 className="text-sm font-black text-foreground uppercase italic tracking-wider">Iluminación y Señalización</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Exterior Delantero */}
                {renderSelect('lucesLow', 'Luces Bajas', VALORES_FUNCION)}
                {renderSelect('lucesHigh', 'Luces Altas', VALORES_FUNCION)}
                {t !== 'MOTO' && renderSelect('posDelantero', 'Cocuyos/Posición', VALORES_FUNCION)}
                {renderSelect('direccionales', 'Direccionales', VALORES_FUNCION)}
                {t !== 'MOTO' && renderSelect('emergencia4V', 'Luces Emergencia 4V', VALORES_FUNCION)}

                {/* Trasero */}
                {renderSelect('stop', 'Luces Stop (Freno)', VALORES_FUNCION)}
                {t !== 'MOTO' && renderSelect('reversa', 'Luz de Reversa', VALORES_FUNCION)}
                {t !== 'MAQUINARIA' && renderSelect('placa', 'Luz de Placa', VALORES_FUNCION)}

                {/* Acústico */}
                {renderSelect('bocina', 'Bocina / Pito', VALORES_FUNCION)}
                {['CAMION', 'TRACTO', 'MAQUINARIA', 'MINICARGADOR'].includes(t) && renderSelect('pitoReversa', 'Alarma de Reversa', VALORES_FUNCION)}

                {/* Adicionales Pesados */}
                {['CAMION', 'TRACTO', 'BUS'].includes(t) && renderSelect('galibo', 'Luces de Gálibo', VALORES_FUNCION)}
                {['CAMION', 'TRACTO', 'AMBULANCIA'].includes(t) && renderSelect('reflectivos', 'Cintas Reflectivas', ['Completos', 'Incompletos', 'N/A'])}

                {/* Cabina y Vision */}
                {t !== 'MOTO' && renderSelect('limpiaparabrisas', 'Limpiaparabrisas', VALORES_ESTADO)}
                {['BUS', 'MINIBUS', 'AMBULANCIA', 'CAMION', 'TRACTO', 'MAQUINARIA'].includes(t) && renderSelect('lucesInterna', 'Luces Internas / Salón', VALORES_FUNCION)}
            </div>
        </div>
    );
}
