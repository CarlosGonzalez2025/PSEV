import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { InspectionFormValues } from '../schema';
import { TipoVehiculo, VALORES_ESTADO } from '@/types/inspeccion';
import { AlertTriangle, Hammer, Truck } from 'lucide-react';

interface Props {
    form: UseFormReturn<InspectionFormValues>;
    tipoVehiculo: TipoVehiculo;
}

export function SegmentoCarroceria({ form, tipoVehiculo }: Props) {
    const t = tipoVehiculo;

    const renderSelect = (name: any, label: string, options: readonly string[], critico: boolean = false) => (
        <FormField control={form.control} name={`carroceria.${name}` as any} render={({ field }) => (
            <FormItem className="flex flex-col rounded-lg border border-white/5 bg-background-dark/30 p-3 shadow-sm">
                <FormLabel className="text-[10px] font-bold text-text-secondary uppercase flex items-center gap-1">
                    {label} {critico && <AlertTriangle className="size-3 text-red-500" />}
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl>
                        <SelectTrigger className="h-8 text-xs bg-background-dark border-border-dark">
                            <SelectValue placeholder="Evaluar..." />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-surface-dark border-border-dark text-white">
                        {options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                </Select>
                <FormMessage />
            </FormItem>
        )} />
    );

    const renderBool = (name: any, label: string) => (
        <FormField control={form.control} name={`carroceria.${name}` as any} render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border border-white/5 bg-background-dark/30 p-3 shadow-sm">
                <FormLabel className="text-[10px] font-bold text-white uppercase flex items-center gap-1">{label}</FormLabel>
                <FormControl>
                    <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold text-text-secondary">No</span>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                        <span className="text-[9px] font-bold text-text-secondary">Sí</span>
                    </div>
                </FormControl>
            </FormItem>
        )} />
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-purple-500/20 text-purple-400 border-none">6</Badge>
                <h3 className="text-sm font-black text-white uppercase italic tracking-wider flex items-center gap-2">Carrocería y Chasis <Hammer className="size-4" /></h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {t !== 'MOTO' && renderSelect('puertas', 'Puertas (Bisagras/Seguros)', VALORES_ESTADO)}
                {renderSelect('chasis', 'Chasis Visible / Estructura', VALORES_ESTADO, true)}
                {renderSelect('guardafangos', 'Guardafangos / Loderas', VALORES_ESTADO)}

                {renderSelect('tanqueCombustible', 'Tanque Combustible', VALORES_ESTADO, true)}
                <FormField control={form.control} name={`carroceria.nivelCombustible`} render={({ field }) => (
                    <FormItem className="flex flex-col rounded-lg border border-white/5 bg-background-dark/30 p-3 shadow-sm">
                        <FormLabel className="text-[10px] font-bold text-text-secondary uppercase">Nivel Combustible (%)</FormLabel>
                        <FormControl>
                            <div className="relative">
                                <Input type="number" className="h-8 text-xs bg-background-dark border-border-dark pr-8" {...field} value={field.value || ''} />
                                <span className="absolute right-3 top-2 text-[10px] text-text-secondary">%</span>
                            </div>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                {renderSelect('escape', 'Escape / Mofle', VALORES_ESTADO)}
            </div>

            {['CAMION', 'TRACTO', 'FURGON'].includes(t) && (
                <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                    <h4 className="text-xs font-black text-white uppercase tracking-widest mb-3 flex items-center gap-2"><Truck className="size-4" /> Carga y Remolque</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {renderSelect('compuertas', 'Compuertas/Estacas', VALORES_ESTADO)}
                        {t === 'FURGON' && renderSelect('furgon', 'Pisos y Paredes Furgón', VALORES_ESTADO)}
                        {t === 'TRACTO' && renderSelect('enganche', 'Quinta Rueda / Enganche', VALORES_ESTADO, true)}
                        {t === 'TRACTO' && renderSelect('lineasElectricasRemolque', 'Líneas Eléctricas', VALORES_ESTADO)}
                        {t === 'TRACTO' && renderSelect('frenosRemolque', 'Frenos Remolque', VALORES_ESTADO, true)}
                    </div>
                </div>
            )}

            {t === 'AUTOTANQUE' && (
                <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                    <h4 className="text-xs font-black text-white uppercase tracking-widest mb-3 flex items-center gap-2"><Truck className="size-4" /> Autotanque Específico</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {renderSelect('cuerpoTanque', 'Cuerpo del Tanque', VALORES_ESTADO, true)}
                        {renderSelect('valvulasTanque', 'Válvulas / Desfogue', VALORES_ESTADO)}
                        {renderSelect('domo', 'Domo / Pasa Hombre', VALORES_ESTADO)}
                        {renderBool('conexionTierra', 'Polo a Tierra OK')}
                    </div>
                </div>
            )}

            {['BUS', 'MINIBUS'].includes(t) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {renderSelect('pasamanos', 'Pasamanos y Peldaños', VALORES_ESTADO)}
                    {renderSelect('asientosSalon', 'Asientos (Sujeción)', VALORES_ESTADO)}
                </div>
            )}
        </div>
    );
}
