import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { InspectionFormValues } from '../schema';
import { TipoVehiculo, VALORES_ESTADO, VALORES_FLUIDO, VALORES_FUNCION } from '@/types/inspeccion';
import { AlertTriangle } from 'lucide-react';

interface Props {
    form: UseFormReturn<InspectionFormValues>;
    tipoVehiculo: TipoVehiculo;
}

export function SegmentoSeguridadActiva({ form, tipoVehiculo }: Props) {
    const t = tipoVehiculo;

    // Renderers genericos para evitar boilerplates
    const renderSelect = (name: any, label: string, options: readonly string[], critico: boolean = false) => (
        <FormField control={form.control} name={`seguridadActiva.${name}` as any} render={({ field }) => (
            <FormItem className="flex flex-col rounded-lg border border-white/5 bg-background-dark/30 p-3 shadow-sm relative">
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

    const renderBool = (name: any, label: string, trueLabel: string = "Sí", falseLabel: string = "No", critico: boolean = false) => (
        <FormField control={form.control} name={`seguridadActiva.${name}` as any} render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border border-white/5 bg-background-dark/30 p-3 shadow-sm">
                <FormLabel className="text-[10px] font-bold text-white uppercase flex items-center gap-1">
                    {label} {critico && <AlertTriangle className="size-3 text-red-500" />}
                </FormLabel>
                <FormControl>
                    <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold text-text-secondary">{falseLabel}</span>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                        <span className="text-[9px] font-bold text-text-secondary">{trueLabel}</span>
                    </div>
                </FormControl>
            </FormItem>
        )} />
    );

    const renderNumber = (name: any, label: string, suffix: string = "") => (
        <FormField control={form.control} name={`seguridadActiva.${name}` as any} render={({ field }) => (
            <FormItem className="flex flex-col rounded-lg border border-white/5 bg-background-dark/30 p-3 shadow-sm">
                <FormLabel className="text-[10px] font-bold text-text-secondary uppercase">{label}</FormLabel>
                <FormControl>
                    <div className="relative">
                        <Input type="number" className="h-8 text-xs bg-background-dark border-border-dark pr-8" {...field} value={field.value || ''} />
                        {suffix && <span className="absolute right-3 top-2 text-[10px] text-text-secondary">{suffix}</span>}
                    </div>
                </FormControl>
                <FormMessage />
            </FormItem>
        )} />
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-emerald-500/20 text-emerald-400 border-none">2</Badge>
                <h3 className="text-sm font-black text-white uppercase italic tracking-wider">Seguridad Activa (Prevención)</h3>
            </div>

            {/* FRENOS */}
            <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                <h4 className="text-xs font-black text-white uppercase tracking-widest mb-3">Sistema de Frenos</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {renderSelect('frenos.servicio', 'Servicio/Pie', VALORES_ESTADO, true)}
                    {renderSelect('frenos.parqueo', 'Parqueo', VALORES_ESTADO, true)}
                    {renderSelect('frenos.nivelLiquido', 'Niv. Líquido', VALORES_FLUIDO)}
                    {renderSelect('frenos.pastillas', 'Pastillas/Bandas', VALORES_ESTADO)}
                    {renderBool('frenos.fugas', 'Fugas Visibles', 'Sin fugas', 'Con fugas', true)}
                    {['CAMION', 'TRACTO', 'BUS'].includes(t) && renderSelect('frenos.motor', 'Freno de Motor', VALORES_ESTADO)}
                    {['CAMION', 'TRACTO', 'BUS'].includes(t) && renderNumber('frenos.presionAirePSI', 'Presión Aire', 'PSI')}
                </div>
            </div>

            {/* DIRECCION */}
            <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                <h4 className="text-xs font-black text-white uppercase tracking-widest mb-3">Sistema de Dirección</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {renderSelect('direccion.juegoVolante', 'Juego Volante', VALORES_ESTADO, true)}
                    {renderSelect('direccion.nivelAceite', 'Nivel Hidráulico', VALORES_FLUIDO)}
                    {renderSelect('direccion.terminales', 'Terminales', VALORES_ESTADO)}
                    {renderSelect('direccion.columna', 'Columna', VALORES_ESTADO)}
                    {renderBool('direccion.fugas', 'Fugas', 'Sin fugas', 'Con fugas')}
                </div>
            </div>

            {/* SUSPENSIÓN */}
            <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                <h4 className="text-xs font-black text-white uppercase tracking-widest mb-3">Sistema de Suspensión</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 md:grid-cols-4 gap-3">
                    {renderSelect('suspension.amortDelantero', 'Amort. Delantero', VALORES_ESTADO)}
                    {renderSelect('suspension.amortTrasero', 'Amort. Trasero', VALORES_ESTADO)}
                    {renderSelect('suspension.muelles', 'Muelles/Resortes', VALORES_ESTADO)}
                    {renderSelect('suspension.bujes', 'Bujes/Pivotes', VALORES_ESTADO)}
                </div>
            </div>

            {/* LLANTAS */}
            <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                <h4 className="text-xs font-black text-white uppercase tracking-widest mb-3">Llantas y Rines</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                    {renderNumber('llantas.presionDI', 'Presión DI', 'PSI')}
                    {renderNumber('llantas.presionDD', 'Presión DD', 'PSI')}
                    {renderNumber('llantas.presionTI', 'Presión TI', 'PSI')}
                    {renderNumber('llantas.presionTD', 'Presión TD', 'PSI')}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {renderSelect('llantas.labrado', 'Prof. Labrado', ['Bueno', 'Desgastado', 'Liso'], true)}
                    {renderBool('llantas.sinDanios', 'Estado General', 'Sin daños', 'Con cortes/grietas', true)}
                    {renderSelect('llantas.tuercas', 'Tuercas', ['Bueno', 'Faltan', 'Sueltas'], true)}
                    {renderSelect('llantas.rines', 'Rines', VALORES_ESTADO)}
                    {renderSelect('llantas.repuesto', 'Refracción', ['OK', 'Desinflada', 'Sin repuesto'])}
                </div>
            </div>

            {/* MOTOR Y FLUIDOS */}
            <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                <h4 className="text-xs font-black text-white uppercase tracking-widest mb-3">Motor y Fluidos</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {renderSelect('motor.nivelAceite', 'Aceite Motor', VALORES_FLUIDO, true)}
                    {renderSelect('motor.nivelRefrigerante', 'Refrigerante', VALORES_FLUIDO, true)}
                    {renderSelect('motor.nivelTransmision', 'Aceite Transm.', VALORES_FLUIDO)}
                    {renderBool('motor.sinFugas', 'Fugas Generales', 'Seco', 'Fugas', true)}
                    {renderSelect('motor.correas', 'Correas', VALORES_ESTADO)}
                    {renderBool('motor.sinRuidos', 'Ruidos', 'Normal', 'Anormales')}
                    {renderSelect('motor.humoEscape', 'Humo Escape', ['Normal', 'Blanco', 'Negro', 'Azul'])}
                    {renderSelect('motor.filtroAire', 'Filtro Aire', VALORES_ESTADO)}
                    {['MAQUINARIA', 'MINICARGADOR', 'GRUA'].includes(t) && renderSelect('motor.nivelAceiteHidraulico', 'Ac. Hidráulico', VALORES_FLUIDO)}
                </div>
            </div>

            {/* ELÉCTRICO */}
            <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                <h4 className="text-xs font-black text-white uppercase tracking-widest mb-3">Sistema Eléctrico / Tablero</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {renderSelect('electrico.bateria', 'Batería/Bornes', VALORES_ESTADO)}
                    {renderSelect('electrico.testigos', 'Testigos', ['Normal', 'Con alertas activas'], true)}
                    {renderSelect('electrico.velocimetro', 'Velocímetro', VALORES_FUNCION)}
                    {renderSelect('electrico.manometroAceite', 'Reloj Aceite', VALORES_FUNCION)}
                    {renderSelect('electrico.indicadorTemp', 'Indicador Temp.', ['Normal', 'Alta'])}
                </div>
            </div>

        </div>
    );
}
