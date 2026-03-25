export const VALORES_ESTADO = ["Bueno", "Regular", "Malo", "N/A"] as const;
export const VALORES_FLUIDO = ["OK", "Bajo", "Crítico", "N/A"] as const;
export const VALORES_FUNCION = ["Funciona", "No funciona", "N/A"] as const;

export type TipoVehiculo =
    | "MOTO"
    | "LIVIANO"
    | "FURGON"
    | "MINIBUS"
    | "BUS"
    | "CAMION"
    | "TRACTO"
    | "AUTOTANQUE"
    | "MAQUINARIA"
    | "MINICARGADOR"
    | "GOLF"
    | "GRUA"
    | "AMBULANCIA";

export interface HallazgoInspeccion {
    segmento: string;
    item: string;
    descripcion: string;
    critico: boolean;
    bloqueante: boolean;
    accionInmediata?: string;
    responsable?: string;
}

export interface InspeccionPreoperacional {
    // ── METADATOS ──────────────────────────────────
    id?: string;
    empresaId: string;
    tipoInspeccion: "preoperacional" | "periodica";
    tipoVehiculo: TipoVehiculo;
    vehiculoId: string;       // placa
    conductorId: string;
    kilometraje: number;
    horometro?: number;
    fechaHora: string;        // ISO string
    fecha?: string;
    hora?: string;
    sede: string;
    operacion?: string;
    proyecto?: string;
    ubicacion?: string;
    creadoPor: string;        // uid
    creadoPorEmail: string;
    nombre_conductor?: string;
    documento_conductor?: string;
    inspector_id?: string;
    nombre_inspector?: string;
    moduloOrigen?: string;
    plantillaClave?: string;
    plantillaVersion?: string;

    // ── SEGMENTO 1: DOCUMENTAL ─────────────────────
    documental: {
        tarjetaPropiedad: boolean;
        soat: boolean; soatVencimiento: string;
        rtm: boolean; rtmVencimiento: string;
        polizaRC: boolean; polizaRCVencimiento: string;
        licencia: boolean; licenciaCategoria: string;
        tarjetaOperacion?: boolean;
        permisoOperacion?: boolean;
        manifiestoCarga?: boolean;
        docHazmat?: boolean;
        docHojaSeguridad?: boolean;
        certOperador?: boolean; // maquinaria
    };

    // ── SEGMENTO 2: SEGURIDAD ACTIVA ───────────────
    seguridadActiva: {
        frenos: {
            servicio: typeof VALORES_ESTADO[number];
            parqueo: typeof VALORES_ESTADO[number];
            nivelLiquido: typeof VALORES_FLUIDO[number];
            fugas: boolean; // false = con fugas
            pastillas: typeof VALORES_ESTADO[number];
            motor?: typeof VALORES_ESTADO[number];
            abs?: boolean;
            presionAirePSI?: number;
        };
        direccion: {
            juegoVolante: typeof VALORES_ESTADO[number];
            nivelAceite: typeof VALORES_FLUIDO[number];
            fugas: boolean; // false = con fugas
            terminales: typeof VALORES_ESTADO[number];
            columna: typeof VALORES_ESTADO[number];
        };
        suspension: {
            amortDelantero: typeof VALORES_ESTADO[number];
            amortTrasero: typeof VALORES_ESTADO[number];
            muelles: typeof VALORES_ESTADO[number];
            bujes: typeof VALORES_ESTADO[number];
        };
        llantas: {
            presionDI: number; presionDD: number;
            presionTI: number; presionTD: number;
            presionEjesAdicionales?: number[];
            repuesto: "OK" | "Desinflada" | "Sin repuesto";
            labrado: "Bueno" | "Desgastado" | "Liso";
            sinDanios: boolean; // false = con daños
            tuercas: "Bueno" | "Faltan" | "Sueltas";
            rines: typeof VALORES_ESTADO[number];
            cadenasNieve?: boolean;
        };
        motor: {
            nivelAceite: typeof VALORES_FLUIDO[number];
            nivelRefrigerante: typeof VALORES_FLUIDO[number];
            nivelTransmision: typeof VALORES_FLUIDO[number];
            sinFugas: boolean; // false = con fugas
            correas: typeof VALORES_ESTADO[number];
            sinRuidos: boolean; // false = con ruidos
            humoEscape: "Normal" | "Blanco" | "Negro" | "Azul";
            filtroAire: typeof VALORES_ESTADO[number];
            trampaFuelDrenada?: boolean; // Diesel
            turbo?: typeof VALORES_ESTADO[number];
            nivelAceiteHidraulico?: typeof VALORES_FLUIDO[number]; // maquinaria
        };
        electrico: {
            bateria: typeof VALORES_ESTADO[number];
            testigos: "Normal" | "Con alertas activas";
            velocimetro: typeof VALORES_FUNCION[number];
            manometroAceite: typeof VALORES_FUNCION[number];
            indicadorTemp: "Normal" | "Alta";
        };
    };

    // ── SEGMENTO 3: SEGURIDAD PASIVA ───────────────
    seguridadPasiva: {
        cinturonConductor: typeof VALORES_ESTADO[number];
        cinturonPasajeros?: "Completos" | "Incompletos" | "N/A";
        airbags?: "OK" | "Con testigo activo" | "N/A";
        apoyaCabezas?: typeof VALORES_ESTADO[number];
        rops?: typeof VALORES_ESTADO[number];
        fops?: typeof VALORES_ESTADO[number];
        cinturonOperador?: typeof VALORES_ESTADO[number];
        parabrisas: typeof VALORES_ESTADO[number];
        vidrios: typeof VALORES_ESTADO[number];
        espejos: "Completos y ajustados" | "Faltante" | "Roto";
        camaraReversa?: typeof VALORES_FUNCION[number];
        puertasEmergencia?: "Operativas" | "Bloqueadas" | "N/A";
        martillos?: "Completos" | "Faltante" | "N/A";
        quintaRueda?: typeof VALORES_ESTADO[number];
        patines?: "Presentes" | "Ausentes" | "N/A";
    };

    // ── SEGMENTO 4: ILUMINACIÓN ────────────────────
    iluminacion: {
        lucesLow: typeof VALORES_FUNCION[number];
        lucesHigh: typeof VALORES_FUNCION[number];
        posDelantero: typeof VALORES_FUNCION[number];
        stop: typeof VALORES_FUNCION[number];
        reversa: typeof VALORES_FUNCION[number];
        direccionales: typeof VALORES_FUNCION[number];
        emergencia4V: typeof VALORES_FUNCION[number];
        placa: typeof VALORES_FUNCION[number];
        galibo?: typeof VALORES_FUNCION[number];
        pitoReversa?: typeof VALORES_FUNCION[number];
        bocina: typeof VALORES_FUNCION[number];
        limpiaparabrisas: typeof VALORES_ESTADO[number];
        reflectivos?: "Completos" | "Incompletos" | "N/A";
        lucesInterna?: typeof VALORES_FUNCION[number];
    };

    // ── SEGMENTO 5: KIT DE CARRETERA ───────────────
    kitCarretera: {
        extintor: boolean; extintorVencimiento: string;
        botiquin: boolean; botiquinVencimiento: string;
        conos: number; // cantidad
        chaleco: boolean;
        linterna: boolean;
        herramientas: boolean;
        gato?: boolean;
        cruceta?: boolean;
        tacos?: boolean;
        cadenasArrastre?: boolean;
        casco?: boolean; // MOTO
        cascoCertificacion?: string;
        epp?: boolean; // sector industrial
        antiderrame?: boolean;
        absorbentes?: boolean;
        radio?: boolean;
        gps?: boolean;
        camilla?: boolean; // AMBULANCIA
        aed?: boolean;
        oxigeno?: boolean; oxigenoNivel?: number;
    };

    // ── SEGMENTO 6: CARROCERÍA ─────────────────────
    carroceria: {
        puertas: typeof VALORES_ESTADO[number];
        chasis: typeof VALORES_ESTADO[number];
        guardafangos: typeof VALORES_ESTADO[number];
        tanqueCombustible: typeof VALORES_ESTADO[number];
        nivelCombustible: number; // porcentaje
        escape: typeof VALORES_ESTADO[number];
        compuertas?: typeof VALORES_ESTADO[number];
        furgon?: typeof VALORES_ESTADO[number];
        cuerpoTanque?: typeof VALORES_ESTADO[number];
        enganche?: typeof VALORES_ESTADO[number];
        lineasElectricasRemolque?: typeof VALORES_ESTADO[number];
        frenosRemolque?: typeof VALORES_ESTADO[number];
        conexionTierra?: boolean;
        valvulasTanque?: typeof VALORES_ESTADO[number];
        domo?: typeof VALORES_ESTADO[number];
        pasamanos?: typeof VALORES_ESTADO[number];
        asientosSalon?: typeof VALORES_ESTADO[number];
    };

    // ── CAMPOS ESPECÍFICOS POR TIPO ────────────────
    especificoMoto?: {
        estadoCadena: typeof VALORES_ESTADO[number];
        estadoManillar: typeof VALORES_ESTADO[number];
        frenoDelanteroIndependiente: boolean;
        frenoTrasero: typeof VALORES_ESTADO[number];
        estadoHorquilla: typeof VALORES_ESTADO[number];
        estadoAmortiguadores: typeof VALORES_ESTADO[number];
        cascoTalla: string;
        guantes: boolean;
        botasProteccion: boolean;
        rodillerasCodera: boolean;
    };
    especificoBus?: {
        capacidadMarcada: boolean;
        numeroPasajeros: number;
        salidaEmergenciaPuerta: typeof VALORES_FUNCION[number];
        salidaEmergenciaVentana: typeof VALORES_ESTADO[number];
        martillosEmergencia: typeof VALORES_ESTADO[number];
        extintorAccesible: boolean;
        tacografo: typeof VALORES_FUNCION[number];
        equiposComunicacion: typeof VALORES_FUNCION[number];
    };
    especificoTracto?: {
        quintaRuedaEngrase: typeof VALORES_ESTADO[number];
        lineasAireRemolque: typeof VALORES_ESTADO[number];
        frenoRemolque: typeof VALORES_FUNCION[number];
        cerradurasPuertasRemolque: typeof VALORES_FUNCION[number];
        cargoAsegurado: boolean;
        pesoDistribuido: boolean;
        sistemaRetarder: typeof VALORES_FUNCION[number];
        pisosAntideslizantes: typeof VALORES_ESTADO[number];
    };
    especificoMaquinaria?: {
        estadoVastagos: typeof VALORES_ESTADO[number];
        puntosEngraseCompletos: boolean;
        brazosBalde: typeof VALORES_ESTADO[number];
        trabaBrazo: boolean;
        estadoCabina: typeof VALORES_ESTADO[number];
        sistemaHidraulicoFugas: boolean; // false = con fugas
        alarmaReversa: typeof VALORES_FUNCION[number];
        balizaGiratoria: typeof VALORES_FUNCION[number];
        orugas?: typeof VALORES_ESTADO[number];
    };
    especificoAutotanque?: {
        conexionTierraFunciona: boolean;
        valvulasPresion: typeof VALORES_ESTADO[number];
        manometros: typeof VALORES_ESTADO[number];
        dispositivosSeguridadCarga: typeof VALORES_ESTADO[number];
        hojaSeguridad: boolean;
        contenedorDerrame: boolean;
        conexionDescarga: typeof VALORES_ESTADO[number];
    };
    especificoGolf?: {
        nivelBateria: number;
        estadoCablesElectricos: typeof VALORES_ESTADO[number];
        frenosHidraulicosElectricos: typeof VALORES_ESTADO[number];
        pantallaCargador: typeof VALORES_ESTADO[number];
        limitadorVelocidad: boolean;
        estadoMarcacion: typeof VALORES_ESTADO[number];
    };
    especificoAmbulancia?: {
        camilla: typeof VALORES_ESTADO[number];
        medicamentosVigentes: boolean;
        monitorDesfibrilador: typeof VALORES_FUNCION[number];
        salidaLateralEmergencia: typeof VALORES_FUNCION[number];
        comunicacionesRadio: typeof VALORES_FUNCION[number];
    };

    // ── RESULTADO ──────────────────────────────────
    aprobadoParaCircular: boolean;
    motivoRechazo?: string; // requerido si aprobadoParaCircular = false
    observacionesGenerales?: string;
    alertaBloqueoGenerada: boolean;
    firmaInspector?: string; // URL imagen firma
    resultado_final?: "apto" | "apto_con_observaciones" | "no_apto";
    bloqueantes?: number;
    criticos?: number;
    hallazgos?: HallazgoInspeccion[];
    traceability?: {
        creadoPor?: string;
        timestamp?: unknown;
    };
}
