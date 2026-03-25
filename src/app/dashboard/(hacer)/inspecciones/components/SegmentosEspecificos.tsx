import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { InspectionFormValues } from '../schema';
import { TipoVehiculo, VALORES_ESTADO, VALORES_FUNCION } from '@/types/inspeccion';
import { Info } from 'lucide-react';

interface Props {
    form: UseFormReturn<InspectionFormValues>;
    tipoVehiculo: TipoVehiculo;
}

export function SegmentosEspecificos({ form, tipoVehiculo }: Props) {
    const t = tipoVehiculo;

    const renderSelect = (name: any, label: string, options: readonly string[]) => (
        <FormField control={form.control} name={name} render={({ field }) => (
            <FormItem className="flex flex-col rounded-lg border border-white/5 bg-background-dark/30 p-3 shadow-sm">
                <FormLabel className="text-[10px] font-bold text-text-secondary uppercase">{label}</FormLabel>
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

    const renderBool = (name: any, label: string, trueLabel: string = "Sí", falseLabel: string = "No") => (
        <FormField control={form.control} name={name as any} render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border border-white/5 bg-background-dark/30 p-3 shadow-sm">
                <FormLabel className="text-[10px] font-bold text-white uppercase flex items-center gap-1">{label}</FormLabel>
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

    const renderNumber = (name: any, label: string) => (
        <FormField control={form.control} name={name as any} render={({ field }) => (
            <FormItem className="flex flex-col rounded-lg border border-white/5 bg-background-dark/30 p-3 shadow-sm">
                <FormLabel className="text-[10px] font-bold text-text-secondary uppercase">{label}</FormLabel>
                <FormControl>
                    <Input type="number" className="h-8 text-xs bg-background-dark border-border-dark" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
            </FormItem>
        )} />
    );

    const hasSpecifics = ['MOTO', 'BUS', 'MINIBUS', 'TRACTO', 'MAQUINARIA', 'MINICARGADOR', 'AUTOTANQUE', 'GOLF', 'AMBULANCIA', 'LIVIANO', 'FURGON'].includes(t);

    if (!hasSpecifics) return null;

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-cyan-500/20 text-cyan-400 border-none">7</Badge>
                <h3 className="text-sm font-black text-white uppercase italic tracking-wider">Criterios Específicos: {t}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {t === 'MOTO' && (
                    <>
                        {renderSelect('especificoMoto.estadoCadena', 'Tensión/Lubricación Cadena', VALORES_ESTADO)}
                        {renderSelect('especificoMoto.estadoManillar', 'Holgura Manillar', VALORES_ESTADO)}
                        {renderBool('especificoMoto.frenoDelanteroIndependiente', 'Freno Delantero Indep.', 'Sí', 'No')}
                        {renderSelect('especificoMoto.frenoTrasero', 'Palanca Freno Trasero', VALORES_ESTADO)}
                        {renderSelect('especificoMoto.estadoHorquilla', 'Estado Horquilla (Fugas)', VALORES_ESTADO)}
                        {renderSelect('especificoMoto.estadoAmortiguadores', 'Amortiguadores', VALORES_ESTADO)}
                        {renderSelect('especificoMoto.estadoPedalesManiguetas', 'Pedales y Maniguetas', VALORES_ESTADO)}
                        {renderSelect('especificoMoto.estadoReposapies', 'Reposapies', VALORES_ESTADO)}
                        {renderSelect('especificoMoto.estadoSillin', 'Cojinería y Sillín', VALORES_ESTADO)}
                        {renderSelect('especificoMoto.gatoCentralLateral', 'Gato Central/Lateral', VALORES_ESTADO)}
                        {renderSelect('especificoMoto.estadoMofle', 'Estado Mofle/Exosto', VALORES_ESTADO)}
                        <FormField control={form.control} name={`especificoMoto.cascoTalla` as any} render={({ field }) => (
                            <FormItem className="flex flex-col rounded-lg border border-white/5 bg-background-dark/30 p-3 shadow-sm">
                                <FormLabel className="text-[10px] font-bold text-text-secondary uppercase">Talla Casco</FormLabel>
                                <FormControl><Input className="h-8 text-xs bg-background-dark border-border-dark" placeholder="Ej: L" {...field} value={field.value || ''} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        {renderBool('especificoMoto.guantes', 'Guantes de Impacto', 'OK', 'Faltan/Malos')}
                        {renderBool('especificoMoto.botasProteccion', 'Botas Protección', 'OK', 'Faltan/Malos')}
                        {renderBool('especificoMoto.rodillerasCodera', 'Rodilleras/Coderas', 'OK', 'Faltan/Malos')}
                        {renderBool('especificoMoto.impermeable', 'Impermeable', 'OK', 'Faltan/Malos')}
                    </>
                )}

                {['LIVIANO', 'FURGON'].includes(t) && (
                    <>
                        {renderSelect('especificoLiviano.estadoSillas', 'Estado Sillas', VALORES_ESTADO)}
                        {renderSelect('especificoLiviano.tapiceriaInterior', 'Tapicería Interior', VALORES_ESTADO)}
                        {renderSelect('especificoLiviano.estadoPaneles', 'Paneles de Puertas', VALORES_ESTADO)}
                    </>
                )}

                {['BUS', 'MINIBUS'].includes(t) && (
                    <>
                        {renderBool('especificoBus.capacidadMarcada', 'Capacidad Marcada')}
                        {renderNumber('especificoBus.numeroPasajeros', 'Nro actual Pasajeros')}
                        {renderSelect('especificoBus.salidaEmergenciaPuerta', 'Puerta Emergencia', VALORES_FUNCION)}
                        {renderSelect('especificoBus.salidaEmergenciaVentana', 'Ventanas Emergencia', VALORES_ESTADO)}
                        {renderSelect('especificoBus.martillosEmergencia', 'Martillos (Completos)', VALORES_ESTADO)}
                        {renderBool('especificoBus.extintorAccesible', 'Extintor Accesible P.')}
                        {renderSelect('especificoBus.tacografo', 'Tacógrafo Digital', VALORES_FUNCION)}
                        {renderSelect('especificoBus.equiposComunicacion', 'Comunicación Interna', VALORES_FUNCION)}
                    </>
                )}

                {t === 'TRACTO' && (
                    <>
                        {renderSelect('especificoTracto.quintaRuedaEngrase', 'Engrase Quinta Rueda', VALORES_ESTADO)}
                        {renderSelect('especificoTracto.lineasAireRemolque', 'Líneas Aire Remolque', VALORES_ESTADO)}
                        {renderSelect('especificoTracto.frenoRemolque', 'Freno Remolque (Srv/Prq)', VALORES_FUNCION)}
                        {renderSelect('especificoTracto.cerradurasPuertasRemolque', 'Seguros Puertas Remolque', VALORES_FUNCION)}
                        {renderBool('especificoTracto.cargoAsegurado', 'Cargo Asegurado', 'Sí', 'No')}
                        {renderBool('especificoTracto.pesoDistribuido', 'Peso Bien Distribuido', 'Sí', 'No')}
                        {renderSelect('especificoTracto.sistemaRetarder', 'Freno Ahogo/Retardador', VALORES_FUNCION)}
                        {renderSelect('especificoTracto.pisosAntideslizantes', 'Piso Remolque', VALORES_ESTADO)}
                    </>
                )}

                {['MAQUINARIA', 'MINICARGADOR'].includes(t) && (
                    <>
                        {renderSelect('especificoMaquinaria.estadoVastagos', 'Vástagos / Cilindros', VALORES_ESTADO)}
                        {renderBool('especificoMaquinaria.puntosEngraseCompletos', 'Puntos de Engrase', 'Completos', 'Faltan')}
                        {renderSelect('especificoMaquinaria.brazosBalde', 'Brazos y Balde/Cuchilla', VALORES_ESTADO)}
                        {renderBool('especificoMaquinaria.trabaBrazo', 'Traba de Brazo Pluma')}
                        {renderSelect('especificoMaquinaria.estadoCabina', 'Estado General Cabina', VALORES_ESTADO)}
                        {renderBool('especificoMaquinaria.sistemaHidraulicoFugas', 'Fugas Sist. Hidráulico', 'Fugas', 'Sin Fugas')}
                        {renderSelect('especificoMaquinaria.alarmaReversa', 'Alarma de Reversa', VALORES_FUNCION)}
                        {renderSelect('especificoMaquinaria.balizaGiratoria', 'Baliza / Licuadora', VALORES_FUNCION)}
                        {renderSelect('especificoMaquinaria.orugas', 'Estado Orugas / Zapatas', VALORES_ESTADO)}
                    </>
                )}

                {t === 'AUTOTANQUE' && (
                    <>
                        {renderBool('especificoAutotanque.conexionTierraFunciona', 'Conexión a Tierra Oper.')}
                        {renderSelect('especificoAutotanque.valvulasPresion', 'Válvulas Alivio P.', VALORES_ESTADO)}
                        {renderSelect('especificoAutotanque.manometros', 'Manómetros', VALORES_ESTADO)}
                        {renderSelect('especificoAutotanque.dispositivosSeguridadCarga', 'Seguros de Carga', VALORES_ESTADO)}
                        {renderBool('especificoAutotanque.hojaSeguridad', 'Hoja Seguridad Producto')}
                        {renderBool('especificoAutotanque.contenedorDerrame', 'Kit Control Derrames')}
                        {renderSelect('especificoAutotanque.conexionDescarga', 'Válvula / Manguera Descarga', VALORES_ESTADO)}
                    </>
                )}

                {t === 'GOLF' && (
                    <>
                        {renderNumber('especificoGolf.nivelBateria', 'Nivel Batería (%)')}
                        {renderSelect('especificoGolf.estadoCablesElectricos', 'Cables', VALORES_ESTADO)}
                        {renderSelect('especificoGolf.frenosHidraulicosElectricos', 'Frenos (Hidr/Elect)', VALORES_ESTADO)}
                        {renderSelect('especificoGolf.pantallaCargador', 'Pantalla / Cargador', VALORES_ESTADO)}
                        {renderBool('especificoGolf.limitadorVelocidad', 'Limitador Velocidad')}
                        {renderSelect('especificoGolf.estadoMarcacion', 'Marcación Estética', VALORES_ESTADO)}
                    </>
                )}

                {t === 'AMBULANCIA' && (
                    <>
                        {renderSelect('especificoAmbulancia.camilla', 'Fijación Camilla', VALORES_ESTADO)}
                        {renderBool('especificoAmbulancia.medicamentosVigentes', 'Insumos Vigentes')}
                        {renderSelect('especificoAmbulancia.monitorDesfibrilador', 'Monitor/AED', VALORES_FUNCION)}
                        {renderSelect('especificoAmbulancia.salidaLateralEmergencia', 'Puertas Laterales', VALORES_FUNCION)}
                        {renderSelect('especificoAmbulancia.comunicacionesRadio', 'Radio Operador', VALORES_FUNCION)}
                    </>
                )}
            </div>
        </div>
    );
}
