import * as z from 'zod';
import { VALORES_ESTADO, VALORES_FLUIDO, VALORES_FUNCION } from '@/types/inspeccion';

const zValorEstado = z.enum(VALORES_ESTADO as any);
const zValorFluido = z.enum(VALORES_FLUIDO as any);
const zValorFunc = z.enum(VALORES_FUNCION as any);

export const inspectionFormSchema = z.object({
    vehiculoId: z.string().min(1, 'Requerido'),
    conductorId: z.string().min(1, 'Requerido'),
    tipoInspeccion: z.enum(['preoperacional', 'periodica']),
    kilometraje: z.coerce.number().min(0, 'Kilometraje inválido'),
    sede: z.string().min(1, 'Requerido'),
    operacion: z.string().optional(),

    documental: z.object({
        tarjetaPropiedad: z.boolean(),
        soat: z.boolean(), soatVencimiento: z.string().min(1, "Fecha SOAT requerida"),
        rtm: z.boolean(), rtmVencimiento: z.string().optional(),
        polizaRC: z.boolean(), polizaRCVencimiento: z.string().min(1, "Fecha Póliza RC requerida"),
        licencia: z.boolean(), licenciaCategoria: z.string().min(1, "Categoría requerida"),
        tarjetaOperacion: z.boolean().optional(),
        permisoOperacion: z.boolean().optional(),
        manifiestoCarga: z.boolean().optional(),
        docHazmat: z.boolean().optional(),
        docHojaSeguridad: z.boolean().optional(),
        certOperador: z.boolean().optional(),
    }),

    seguridadActiva: z.object({
        frenos: z.object({
            servicio: zValorEstado,
            parqueo: zValorEstado,
            nivelLiquido: zValorFluido,
            fugas: z.boolean(),
            pastillas: zValorEstado,
            motor: zValorEstado.optional(),
            abs: z.boolean().optional(),
            presionAirePSI: z.coerce.number().optional()
        }),
        direccion: z.object({
            juegoVolante: zValorEstado,
            nivelAceite: zValorFluido,
            fugas: z.boolean(),
            terminales: zValorEstado,
            columna: zValorEstado,
        }),
        suspension: z.object({
            amortDelantero: zValorEstado,
            amortTrasero: zValorEstado,
            muelles: zValorEstado,
            bujes: zValorEstado,
        }),
        llantas: z.object({
            presionDI: z.coerce.number().min(1), presionDD: z.coerce.number().min(1),
            presionTI: z.coerce.number().min(1), presionTD: z.coerce.number().min(1),
            presionEjesAdicionales: z.array(z.coerce.number()).optional(),
            repuesto: z.enum(['OK', 'Desinflada', 'Sin repuesto']),
            labrado: z.enum(['Bueno', 'Desgastado', 'Liso']),
            sinDanios: z.boolean(),
            tuercas: z.enum(['Bueno', 'Faltan', 'Sueltas']),
            rines: zValorEstado,
            cadenasNieve: z.boolean().optional()
        }),
        motor: z.object({
            nivelAceite: zValorFluido,
            nivelRefrigerante: zValorFluido,
            nivelTransmision: zValorFluido,
            sinFugas: z.boolean(),
            correas: zValorEstado,
            sinRuidos: z.boolean(),
            humoEscape: z.enum(['Normal', 'Blanco', 'Negro', 'Azul']),
            filtroAire: zValorEstado,
            trampaFuelDrenada: z.boolean().optional(),
            turbo: zValorEstado.optional(),
            nivelAceiteHidraulico: zValorFluido.optional()
        }),
        electrico: z.object({
            bateria: zValorEstado,
            testigos: z.enum(['Normal', 'Con alertas activas']),
            velocimetro: zValorFunc,
            manometroAceite: zValorFunc,
            indicadorTemp: z.enum(['Normal', 'Alta']),
        })
    }),

    seguridadPasiva: z.object({
        cinturonConductor: zValorEstado,
        cinturonPasajeros: z.enum(['Completos', 'Incompletos', 'N/A']).optional(),
        airbags: z.enum(['OK', 'Con testigo activo', 'N/A']).optional(),
        apoyaCabezas: zValorEstado.optional(),
        rops: zValorEstado.optional(),
        fops: zValorEstado.optional(),
        cinturonOperador: zValorEstado.optional(),
        parabrisas: zValorEstado,
        vidrios: zValorEstado,
        espejos: z.enum(['Completos y ajustados', 'Faltante', 'Roto']),
        camaraReversa: zValorFunc.optional(),
        puertasEmergencia: z.enum(['Operativas', 'Bloqueadas', 'N/A']).optional(),
        martillos: z.enum(['Completos', 'Faltante', 'N/A']).optional(),
        quintaRueda: zValorEstado.optional(),
        patines: z.enum(['Presentes', 'Ausentes', 'N/A']).optional(),
    }),

    iluminacion: z.object({
        lucesLow: zValorFunc,
        lucesHigh: zValorFunc,
        posDelantero: zValorFunc,
        stop: zValorFunc,
        reversa: zValorFunc,
        direccionales: zValorFunc,
        emergencia4V: zValorFunc,
        placa: zValorFunc,
        galibo: zValorFunc.optional(),
        pitoReversa: zValorFunc.optional(),
        bocina: zValorFunc,
        limpiaparabrisas: zValorEstado,
        reflectivos: z.enum(['Completos', 'Incompletos', 'N/A']).optional(),
        lucesInterna: zValorFunc.optional()
    }),

    kitCarretera: z.object({
        extintor: z.boolean(), extintorVencimiento: z.string().min(1, 'Fecha extintor requerida'),
        botiquin: z.boolean(), botiquinVencimiento: z.string().min(1, 'Fecha botiquín requerida'),
        conos: z.coerce.number().min(0),
        chaleco: z.boolean(),
        linterna: z.boolean(),
        herramientas: z.boolean(),
        gato: z.boolean().optional(),
        cruceta: z.boolean().optional(),
        tacos: z.boolean().optional(),
        cadenasArrastre: z.boolean().optional(),
        casco: z.boolean().optional(),
        cascoCertificacion: z.string().optional(),
        epp: z.boolean().optional(),
        antiderrame: z.boolean().optional(),
        absorbentes: z.boolean().optional(),
        radio: z.boolean().optional(),
        gps: z.boolean().optional(),
        camilla: z.boolean().optional(),
        aed: z.boolean().optional(),
        oxigeno: z.boolean().optional(), oxigenoNivel: z.coerce.number().optional()
    }),

    carroceria: z.object({
        puertas: zValorEstado,
        chasis: zValorEstado,
        guardafangos: zValorEstado,
        tanqueCombustible: zValorEstado,
        nivelCombustible: z.coerce.number().min(0).max(100),
        escape: zValorEstado,
        compuertas: zValorEstado.optional(),
        furgon: zValorEstado.optional(),
        cuerpoTanque: zValorEstado.optional(),
        enganche: zValorEstado.optional(),
        lineasElectricasRemolque: zValorEstado.optional(),
        frenosRemolque: zValorEstado.optional(),
        conexionTierra: z.boolean().optional(),
        valvulasTanque: zValorEstado.optional(),
        domo: zValorEstado.optional(),
        pasamanos: zValorEstado.optional(),
        asientosSalon: zValorEstado.optional()
    }),

    especificoMoto: z.object({
        estadoCadena: zValorEstado,
        estadoManillar: zValorEstado,
        frenoDelanteroIndependiente: z.boolean(),
        frenoTrasero: zValorEstado,
        estadoHorquilla: zValorEstado,
        estadoAmortiguadores: zValorEstado,
        estadoPedalesManiguetas: zValorEstado.optional(),
        estadoReposapies: zValorEstado.optional(),
        estadoSillin: zValorEstado.optional(),
        gatoCentralLateral: zValorEstado.optional(),
        estadoMofle: zValorEstado.optional(),
        impermeable: z.boolean().optional(),
        cascoTalla: z.string(),
        guantes: z.boolean(),
        botasProteccion: z.boolean(),
        rodillerasCodera: z.boolean()
    }).optional(),

    especificoLiviano: z.object({
        estadoSillas: zValorEstado.optional(),
        tapiceriaInterior: zValorEstado.optional(),
        estadoPaneles: zValorEstado.optional()
    }).optional(),

    especificoBus: z.object({
        capacidadMarcada: z.boolean(),
        numeroPasajeros: z.coerce.number(),
        salidaEmergenciaPuerta: zValorFunc,
        salidaEmergenciaVentana: zValorEstado.optional(),
        martillosEmergencia: zValorEstado,
        extintorAccesible: z.boolean(),
        tacografo: zValorFunc,
        equiposComunicacion: zValorFunc
    }).optional(),

    especificoTracto: z.object({
        quintaRuedaEngrase: zValorEstado,
        lineasAireRemolque: zValorEstado,
        frenoRemolque: zValorFunc,
        cerradurasPuertasRemolque: zValorFunc,
        cargoAsegurado: z.boolean(),
        pesoDistribuido: z.boolean(),
        sistemaRetarder: zValorFunc,
        pisosAntideslizantes: zValorEstado
    }).optional(),

    especificoMaquinaria: z.object({
        estadoVastagos: zValorEstado,
        puntosEngraseCompletos: z.boolean(),
        brazosBalde: zValorEstado,
        trabaBrazo: z.boolean(),
        estadoCabina: zValorEstado,
        sistemaHidraulicoFugas: z.boolean(),
        alarmaReversa: zValorFunc,
        balizaGiratoria: zValorFunc,
        orugas: zValorEstado.optional()
    }).optional(),

    especificoAutotanque: z.object({
        conexionTierraFunciona: z.boolean(),
        valvulasPresion: zValorEstado,
        manometros: zValorEstado,
        dispositivosSeguridadCarga: zValorEstado,
        hojaSeguridad: z.boolean(),
        contenedorDerrame: z.boolean(),
        conexionDescarga: zValorEstado
    }).optional(),

    especificoGolf: z.object({
        nivelBateria: z.coerce.number().min(0).max(100),
        estadoCablesElectricos: zValorEstado,
        frenosHidraulicosElectricos: zValorEstado,
        pantallaCargador: zValorEstado,
        limitadorVelocidad: z.boolean(),
        estadoMarcacion: zValorEstado
    }).optional(),

    especificoAmbulancia: z.object({
        camilla: zValorEstado,
        medicamentosVigentes: z.boolean(),
        monitorDesfibrilador: zValorFunc,
        salidaLateralEmergencia: zValorFunc,
        comunicacionesRadio: zValorFunc
    }).optional(),

    observacionGeneral: z.string().optional(),
    declaracionJurada: z.boolean().refine(val => val === true, {
        message: "Debe aceptar la declaración jurada"
    })
});

export type InspectionFormValues = z.infer<typeof inspectionFormSchema>;
