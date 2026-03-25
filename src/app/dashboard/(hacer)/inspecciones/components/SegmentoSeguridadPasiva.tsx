import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InspectionFormValues } from '../schema';
import { TipoVehiculo, VALORES_ESTADO, VALORES_FUNCION } from '@/types/inspeccion';
import { ShieldCheck } from 'lucide-react';

interface Props {
    form: UseFormReturn<InspectionFormValues>;
    tipoVehiculo: TipoVehiculo;
}

export function SegmentoSeguridadPasiva({ form, tipoVehiculo }: Props) {
    const t = tipoVehiculo;

    const renderSelect = (name: any, label: string, options: readonly string[]) => (
        <FormField control={form.control} name={`seguridadPasiva.${name}` as any} render={({ field }) => (
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
                <Badge className="bg-blue-500/20 text-blue-400 border-none">3</Badge>
                <h3 className="text-sm font-black text-foreground uppercase italic tracking-wider">Seguridad Pasiva (Protección)</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Cabina y Conductor */}
                {t !== 'MOTO' && renderSelect('cinturonConductor', 'Cinturón Conductor', VALORES_ESTADO)}
                {['LIVIANO', 'MINIBUS', 'BUS', 'AMBULANCIA'].includes(t) && renderSelect('cinturonPasajeros', 'Cinturones Pasajeros', ['Completos', 'Incompletos', 'N/A'])}
                {['LIVIANO', 'AMBULANCIA'].includes(t) && renderSelect('airbags', 'Airbags', ['OK', 'Con testigo activo', 'N/A'])}
                {['LIVIANO', 'FURGON'].includes(t) && renderSelect('apoyaCabezas', 'Apoya Cabezas', VALORES_ESTADO)}

                {/* Maquinaria */}
                {['MAQUINARIA', 'MINICARGADOR', 'GOLF'].includes(t) && renderSelect('rops', 'Estructura ROPS', VALORES_ESTADO)}
                {['MAQUINARIA', 'MINICARGADOR'].includes(t) && renderSelect('fops', 'Cabina FOPS', VALORES_ESTADO)}
                {['MAQUINARIA', 'MINICARGADOR', 'GOLF'].includes(t) && renderSelect('cinturonOperador', 'Cinturón Operador', VALORES_ESTADO)}

                {/* Visibilidad Exterior (Todos con cabina) */}
                {t !== 'MOTO' && renderSelect('parabrisas', 'Parabrisas', VALORES_ESTADO)}
                {t !== 'MOTO' && renderSelect('vidrios', 'Vidrios Laterales/Traseros', VALORES_ESTADO)}
                {renderSelect('espejos', 'Espejos Retrovisores', ['Completos y ajustados', 'Faltante', 'Roto'])}
                {['BUS', 'TRACTO', 'CAMION'].includes(t) && renderSelect('camaraReversa', 'Cámara Reversa', VALORES_FUNCION)}

                {/* Emergencias Especiales */}
                {['BUS', 'MINIBUS', 'AMBULANCIA'].includes(t) && renderSelect('puertasEmergencia', 'Puertas Emergencias', ['Operativas', 'Bloqueadas', 'N/A'])}
                {['BUS', 'MINIBUS'].includes(t) && renderSelect('martillos', 'Martillos Emergencia', ['Completos', 'Faltante', 'N/A'])}

                {/* Pesados */}
                {t === 'TRACTO' && renderSelect('quintaRueda', 'Seguro Quinta Rueda', VALORES_ESTADO)}
                {['TRACTO', 'CAMION', 'AUTOTANQUE'].includes(t) && renderSelect('patines', 'Patines / Cuñas', ['Presentes', 'Ausentes', 'N/A'])}
            </div>
        </div>
    );
}
