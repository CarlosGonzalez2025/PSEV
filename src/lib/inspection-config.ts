import { TipoVehiculo } from '@/types/inspeccion';

export type InspectionUiSegment =
  | 'documental'
  | 'seguridad_activa'
  | 'seguridad_pasiva'
  | 'iluminacion'
  | 'kit_carretera'
  | 'carroceria'
  | 'especifico';

export interface InspectionCriterion {
  nombre: string;
  critico: boolean;
  requiere_foto: boolean;
}

export interface InspectionSubcomponent {
  nombre: string;
  bloqueante_si_falla: boolean;
  criterios: InspectionCriterion[];
}

export interface InspectionCategory {
  nombre: string;
  ui_segmento?: InspectionUiSegment;
  subcomponentes: InspectionSubcomponent[];
}

export interface InspectionTemplate {
  tipo_vehiculo: string;
  aplica_inspeccion: Array<'preoperacional' | 'periodica'>;
  referencia_normativa?: string[];
  base_template?: string;
  categorias: InspectionCategory[];
}

export interface InspectionModuleConfig {
  modulo: string;
  version: string;
  pais: string;
  enfoque: string;
  estructura_general: {
    niveles: string[];
    tipos_inspeccion: Array<'preoperacional' | 'periodica'>;
    resultado_criterio: Array<'cumple' | 'no_cumple' | 'no_aplica'>;
    resultado_final: Array<'apto' | 'apto_con_observaciones' | 'no_apto'>;
    soporta_herencia_plantillas: boolean;
  };
  reglas_globales: {
    observacion_obligatoria_si_no_cumple: boolean;
    foto_obligatoria_si_no_cumple_y_es_critico: boolean;
    crear_hallazgo_si_no_cumple: boolean;
    crear_accion_correctiva_si_hallazgo: boolean;
    bloquear_operacion_si_falla_subcomponente_bloqueante: boolean;
    revalidacion_obligatoria_para_desbloqueo: boolean;
    criterio_no_aplica_no_penaliza_resultado: boolean;
  };
  reglas_resultado_final: {
    no_apto_si_existe_criterio_critico_no_cumple: boolean;
    no_apto_si_existe_subcomponente_bloqueante_con_falla: boolean;
    apto_con_observaciones_si_hay_hallazgos_no_bloqueantes: boolean;
    apto_si_todo_cumple_o_no_aplica: boolean;
  };
  normalizacion_tipos_vehiculo: Record<string, TipoVehiculo>;
  campos_cabecera_inspeccion: string[];
  campos_calculados_inspeccion: string[];
  campos_respuesta_criterio: string[];
}

export const INSPECTION_MODULE_CONFIG: InspectionModuleConfig = {
  modulo: 'inspecciones_vehiculares',
  version: '1.1',
  pais: 'Colombia',
  enfoque: 'PESV',
  estructura_general: {
    niveles: ['tipo_vehiculo', 'tipo_inspeccion', 'categoria', 'subcomponente', 'criterio'],
    tipos_inspeccion: ['preoperacional', 'periodica'],
    resultado_criterio: ['cumple', 'no_cumple', 'no_aplica'],
    resultado_final: ['apto', 'apto_con_observaciones', 'no_apto'],
    soporta_herencia_plantillas: true,
  },
  reglas_globales: {
    observacion_obligatoria_si_no_cumple: true,
    foto_obligatoria_si_no_cumple_y_es_critico: true,
    crear_hallazgo_si_no_cumple: true,
    crear_accion_correctiva_si_hallazgo: true,
    bloquear_operacion_si_falla_subcomponente_bloqueante: true,
    revalidacion_obligatoria_para_desbloqueo: true,
    criterio_no_aplica_no_penaliza_resultado: true,
  },
  reglas_resultado_final: {
    no_apto_si_existe_criterio_critico_no_cumple: true,
    no_apto_si_existe_subcomponente_bloqueante_con_falla: true,
    apto_con_observaciones_si_hay_hallazgos_no_bloqueantes: true,
    apto_si_todo_cumple_o_no_aplica: true,
  },
  normalizacion_tipos_vehiculo: {
    motocicleta: 'MOTO',
    vehiculo_liviano: 'LIVIANO',
    camion_rigido: 'CAMION',
    volqueta: 'CAMION',
    tractocamion: 'TRACTO',
    bus_buseta: 'BUS',
    microbus: 'MINIBUS',
    ambulancia: 'AMBULANCIA',
    autotanque: 'AUTOTANQUE',
    maquinaria_amarilla: 'MAQUINARIA',
    minimacargador: 'MINICARGADOR',
    grua: 'GRUA',
    golf: 'GOLF',
  },
  campos_cabecera_inspeccion: [
    'empresa_id',
    'id_inspeccion',
    'consecutivo',
    'tipo_inspeccion',
    'fecha',
    'hora',
    'vehiculo_id',
    'placa',
    'tipo_vehiculo',
    'subtipo_vehiculo',
    'conductor_id',
    'nombre_conductor',
    'documento_conductor',
    'inspector_id',
    'nombre_inspector',
    'sede',
    'operacion',
    'proyecto',
    'kilometraje',
    'horometro',
    'ubicacion',
    'observaciones_generales',
    'firma_conductor',
    'firma_inspector',
  ],
  campos_calculados_inspeccion: [
    'aprobado_para_circular',
    'resultado_final',
    'bloqueantes',
    'criticos',
    'hallazgos',
    'traceability',
  ],
  campos_respuesta_criterio: [
    'resultado',
    'observacion',
    'foto',
    'criticidad_resultante',
    'bloquea_operacion',
    'accion_inmediata',
    'responsable',
    'fecha_compromiso',
  ],
};

const NORMATIVA_BASE = ['Resolucion 40595 de 2022', 'PESV Colombia'];

export const INSPECTION_CATALOG: Record<string, InspectionTemplate> = {
  motocicleta: {
    tipo_vehiculo: 'motocicleta',
    aplica_inspeccion: ['preoperacional', 'periodica'],
    referencia_normativa: NORMATIVA_BASE,
    categorias: [
      {
        nombre: 'documentacion',
        ui_segmento: 'documental',
        subcomponentes: [
          {
            nombre: 'soat',
            bloqueante_si_falla: true,
            criterios: [{ nombre: 'vigencia_soat', critico: true, requiere_foto: false }],
          },
          {
            nombre: 'revision_tecnico_mecanica',
            bloqueante_si_falla: true,
            criterios: [{ nombre: 'vigencia_rtm', critico: true, requiere_foto: false }],
          },
          {
            nombre: 'licencia_conduccion',
            bloqueante_si_falla: true,
            criterios: [
              { nombre: 'vigencia_licencia', critico: true, requiere_foto: false },
              { nombre: 'categoria_licencia_compatible', critico: true, requiere_foto: false },
            ],
          },
          {
            nombre: 'licencia_transito',
            bloqueante_si_falla: true,
            criterios: [{ nombre: 'disponible_y_legible', critico: true, requiere_foto: false }],
          },
        ],
      },
      {
        nombre: 'elementos_del_conductor',
        ui_segmento: 'kit_carretera',
        subcomponentes: [
          {
            nombre: 'casco',
            bloqueante_si_falla: true,
            criterios: [
              { nombre: 'casco_presente', critico: true, requiere_foto: true },
              { nombre: 'estado_general_casco', critico: true, requiere_foto: true },
              { nombre: 'correa_funcional', critico: true, requiere_foto: true },
            ],
          },
          {
            nombre: 'chaleco_reflectivo',
            bloqueante_si_falla: false,
            criterios: [{ nombre: 'chaleco_presente', critico: false, requiere_foto: false }],
          },
        ],
      },
      {
        nombre: 'llantas_y_rodamiento',
        ui_segmento: 'seguridad_activa',
        subcomponentes: [
          {
            nombre: 'llanta_delantera',
            bloqueante_si_falla: true,
            criterios: [
              { nombre: 'estado_general', critico: true, requiere_foto: true },
              { nombre: 'presion_adecuada', critico: true, requiere_foto: false },
              { nombre: 'labrado_adecuado', critico: true, requiere_foto: true },
              { nombre: 'sin_cortes_o_deformaciones', critico: true, requiere_foto: true },
            ],
          },
          {
            nombre: 'llanta_trasera',
            bloqueante_si_falla: true,
            criterios: [
              { nombre: 'estado_general', critico: true, requiere_foto: true },
              { nombre: 'presion_adecuada', critico: true, requiere_foto: false },
              { nombre: 'labrado_adecuado', critico: true, requiere_foto: true },
              { nombre: 'sin_cortes_o_deformaciones', critico: true, requiere_foto: true },
            ],
          },
        ],
      },
      {
        nombre: 'luces_y_senalizacion',
        ui_segmento: 'iluminacion',
        subcomponentes: [
          {
            nombre: 'luz_delantera',
            bloqueante_si_falla: true,
            criterios: [
              { nombre: 'funcionamiento_luz_baja', critico: true, requiere_foto: false },
              { nombre: 'funcionamiento_luz_alta', critico: true, requiere_foto: false },
            ],
          },
          {
            nombre: 'luz_trasera',
            bloqueante_si_falla: true,
            criterios: [{ nombre: 'funcionamiento_luz_trasera', critico: true, requiere_foto: false }],
          },
          {
            nombre: 'stop_trasero',
            bloqueante_si_falla: true,
            criterios: [{ nombre: 'funcionamiento_stop', critico: true, requiere_foto: false }],
          },
          {
            nombre: 'claxon',
            bloqueante_si_falla: false,
            criterios: [{ nombre: 'funcionamiento_claxon', critico: false, requiere_foto: false }],
          },
        ],
      },
      {
        nombre: 'espejos',
        ui_segmento: 'seguridad_pasiva',
        subcomponentes: [
          {
            nombre: 'espejo_izquierdo',
            bloqueante_si_falla: true,
            criterios: [
              { nombre: 'presente', critico: true, requiere_foto: true },
              { nombre: 'fijacion_correcta', critico: true, requiere_foto: true },
              { nombre: 'visibilidad_adecuada', critico: true, requiere_foto: true },
            ],
          },
          {
            nombre: 'espejo_derecho',
            bloqueante_si_falla: true,
            criterios: [
              { nombre: 'presente', critico: true, requiere_foto: true },
              { nombre: 'fijacion_correcta', critico: true, requiere_foto: true },
              { nombre: 'visibilidad_adecuada', critico: true, requiere_foto: true },
            ],
          },
        ],
      },
      {
        nombre: 'frenos_y_control',
        ui_segmento: 'seguridad_activa',
        subcomponentes: [
          {
            nombre: 'freno_delantero',
            bloqueante_si_falla: true,
            criterios: [{ nombre: 'respuesta_adecuada', critico: true, requiere_foto: false }],
          },
          {
            nombre: 'freno_trasero',
            bloqueante_si_falla: true,
            criterios: [{ nombre: 'respuesta_adecuada', critico: true, requiere_foto: false }],
          },
          {
            nombre: 'acelerador',
            bloqueante_si_falla: true,
            criterios: [{ nombre: 'retorno_correcto', critico: true, requiere_foto: false }],
          },
          {
            nombre: 'manubrio',
            bloqueante_si_falla: true,
            criterios: [
              { nombre: 'fijacion_correcta', critico: true, requiere_foto: true },
              { nombre: 'movimiento_sin_holgura', critico: true, requiere_foto: false },
            ],
          },
        ],
      },
      {
        nombre: 'motor_y_transmision',
        ui_segmento: 'seguridad_activa',
        subcomponentes: [
          {
            nombre: 'nivel_aceite',
            bloqueante_si_falla: true,
            criterios: [{ nombre: 'nivel_adecuado', critico: true, requiere_foto: false }],
          },
          {
            nombre: 'fugas',
            bloqueante_si_falla: true,
            criterios: [{ nombre: 'sin_fugas_visibles', critico: true, requiere_foto: true }],
          },
          {
            nombre: 'cadena_o_transmision',
            bloqueante_si_falla: true,
            criterios: [
              { nombre: 'tension_correcta', critico: true, requiere_foto: true },
              { nombre: 'lubricacion_adecuada', critico: false, requiere_foto: true },
              { nombre: 'sin_desgaste_excesivo', critico: true, requiere_foto: true },
            ],
          },
        ],
      },
    ],
  },
  vehiculo_liviano: {
    tipo_vehiculo: 'vehiculo_liviano',
    aplica_inspeccion: ['preoperacional', 'periodica'],
    referencia_normativa: NORMATIVA_BASE,
    categorias: [
      {
        nombre: 'documentacion',
        ui_segmento: 'documental',
        subcomponentes: [
          {
            nombre: 'soat',
            bloqueante_si_falla: true,
            criterios: [{ nombre: 'vigencia_soat', critico: true, requiere_foto: false }],
          },
          {
            nombre: 'revision_tecnico_mecanica',
            bloqueante_si_falla: true,
            criterios: [{ nombre: 'vigencia_rtm', critico: true, requiere_foto: false }],
          },
          {
            nombre: 'licencia_conduccion',
            bloqueante_si_falla: true,
            criterios: [
              { nombre: 'vigencia_licencia', critico: true, requiere_foto: false },
              { nombre: 'categoria_compatible', critico: true, requiere_foto: false },
            ],
          },
          {
            nombre: 'licencia_transito',
            bloqueante_si_falla: true,
            criterios: [{ nombre: 'disponible_y_legible', critico: true, requiere_foto: false }],
          },
        ],
      },
      {
        nombre: 'llantas_y_rodamiento',
        ui_segmento: 'seguridad_activa',
        subcomponentes: [
          {
            nombre: 'llanta_delantera_izquierda',
            bloqueante_si_falla: true,
            criterios: [
              { nombre: 'estado_general', critico: true, requiere_foto: true },
              { nombre: 'presion_adecuada', critico: true, requiere_foto: false },
              { nombre: 'labrado_adecuado', critico: true, requiere_foto: true },
              { nombre: 'sin_cortes_o_deformaciones', critico: true, requiere_foto: true },
              { nombre: 'tuercas_y_pernos_en_buen_estado', critico: true, requiere_foto: true },
            ],
          },
          {
            nombre: 'llanta_delantera_derecha',
            bloqueante_si_falla: true,
            criterios: [
              { nombre: 'estado_general', critico: true, requiere_foto: true },
              { nombre: 'presion_adecuada', critico: true, requiere_foto: false },
              { nombre: 'labrado_adecuado', critico: true, requiere_foto: true },
              { nombre: 'sin_cortes_o_deformaciones', critico: true, requiere_foto: true },
              { nombre: 'tuercas_y_pernos_en_buen_estado', critico: true, requiere_foto: true },
            ],
          },
          {
            nombre: 'llanta_trasera_izquierda',
            bloqueante_si_falla: true,
            criterios: [
              { nombre: 'estado_general', critico: true, requiere_foto: true },
              { nombre: 'presion_adecuada', critico: true, requiere_foto: false },
              { nombre: 'labrado_adecuado', critico: true, requiere_foto: true },
              { nombre: 'sin_cortes_o_deformaciones', critico: true, requiere_foto: true },
              { nombre: 'tuercas_y_pernos_en_buen_estado', critico: true, requiere_foto: true },
            ],
          },
          {
            nombre: 'llanta_trasera_derecha',
            bloqueante_si_falla: true,
            criterios: [
              { nombre: 'estado_general', critico: true, requiere_foto: true },
              { nombre: 'presion_adecuada', critico: true, requiere_foto: false },
              { nombre: 'labrado_adecuado', critico: true, requiere_foto: true },
              { nombre: 'sin_cortes_o_deformaciones', critico: true, requiere_foto: true },
              { nombre: 'tuercas_y_pernos_en_buen_estado', critico: true, requiere_foto: true },
            ],
          },
          {
            nombre: 'llanta_repuesto',
            bloqueante_si_falla: false,
            criterios: [
              { nombre: 'presente', critico: false, requiere_foto: false },
              { nombre: 'estado_general', critico: false, requiere_foto: true },
            ],
          },
        ],
      },
      {
        nombre: 'cabina_y_seguridad',
        ui_segmento: 'seguridad_pasiva',
        subcomponentes: [
          {
            nombre: 'cinturon_conductor',
            bloqueante_si_falla: true,
            criterios: [
              { nombre: 'anclaje_correcto', critico: true, requiere_foto: true },
              { nombre: 'enganche_funcional', critico: true, requiere_foto: true },
              { nombre: 'cinta_en_buen_estado', critico: true, requiere_foto: true },
            ],
          },
          {
            nombre: 'extintor',
            bloqueante_si_falla: false,
            criterios: [
              { nombre: 'presente', critico: false, requiere_foto: true },
              { nombre: 'vigente', critico: false, requiere_foto: true },
              { nombre: 'manometro_en_rango', critico: false, requiere_foto: true },
            ],
          },
        ],
      },
    ],
  },
  camion_rigido: {
    tipo_vehiculo: 'camion_rigido',
    aplica_inspeccion: ['preoperacional', 'periodica'],
    referencia_normativa: NORMATIVA_BASE,
    categorias: [
      {
        nombre: 'documentacion',
        ui_segmento: 'documental',
        subcomponentes: [
          {
            nombre: 'soat',
            bloqueante_si_falla: true,
            criterios: [{ nombre: 'vigencia_soat', critico: true, requiere_foto: false }],
          },
          {
            nombre: 'revision_tecnico_mecanica',
            bloqueante_si_falla: true,
            criterios: [{ nombre: 'vigencia_rtm', critico: true, requiere_foto: false }],
          },
          {
            nombre: 'licencia_conduccion',
            bloqueante_si_falla: true,
            criterios: [
              { nombre: 'vigencia_licencia', critico: true, requiere_foto: false },
              { nombre: 'categoria_compatible', critico: true, requiere_foto: false },
            ],
          },
        ],
      },
      {
        nombre: 'frenos_y_sistema_neumatico',
        ui_segmento: 'seguridad_activa',
        subcomponentes: [
          {
            nombre: 'freno_servicio',
            bloqueante_si_falla: true,
            criterios: [{ nombre: 'respuesta_adecuada', critico: true, requiere_foto: false }],
          },
          {
            nombre: 'freno_parqueo',
            bloqueante_si_falla: true,
            criterios: [{ nombre: 'retencion_adecuada', critico: true, requiere_foto: false }],
          },
          {
            nombre: 'presion_aire',
            bloqueante_si_falla: true,
            criterios: [{ nombre: 'presion_operativa_adecuada', critico: true, requiere_foto: false }],
          },
        ],
      },
      {
        nombre: 'carroceria_y_carga',
        ui_segmento: 'carroceria',
        subcomponentes: [
          {
            nombre: 'carroceria_carga',
            bloqueante_si_falla: true,
            criterios: [{ nombre: 'estructura_en_buen_estado', critico: true, requiere_foto: true }],
          },
          {
            nombre: 'puntos_amarre',
            bloqueante_si_falla: true,
            criterios: [{ nombre: 'integridad_adecuada', critico: true, requiere_foto: true }],
          },
        ],
      },
    ],
  },
  volqueta: {
    tipo_vehiculo: 'volqueta',
    base_template: 'camion_rigido',
    aplica_inspeccion: ['preoperacional', 'periodica'],
    referencia_normativa: NORMATIVA_BASE,
    categorias: [
      {
        nombre: 'sistema_hidraulico_y_platon',
        ui_segmento: 'carroceria',
        subcomponentes: [
          {
            nombre: 'cilindro_hidraulico',
            bloqueante_si_falla: true,
            criterios: [
              { nombre: 'sin_fugas', critico: true, requiere_foto: true },
              { nombre: 'sin_deformaciones', critico: true, requiere_foto: true },
            ],
          },
          {
            nombre: 'mangueras_hidraulicas',
            bloqueante_si_falla: true,
            criterios: [
              { nombre: 'sin_fugas', critico: true, requiere_foto: true },
              { nombre: 'sin_rupturas', critico: true, requiere_foto: true },
            ],
          },
          {
            nombre: 'platon',
            bloqueante_si_falla: true,
            criterios: [
              { nombre: 'estructura_en_buen_estado', critico: true, requiere_foto: true },
              { nombre: 'sin_fisuras_criticas', critico: true, requiere_foto: true },
            ],
          },
        ],
      },
    ],
  },
  tractocamion: {
    tipo_vehiculo: 'tractocamion',
    aplica_inspeccion: ['preoperacional', 'periodica'],
    referencia_normativa: NORMATIVA_BASE,
    categorias: [
      {
        nombre: 'quinta_rueda_y_acople',
        ui_segmento: 'especifico',
        subcomponentes: [
          {
            nombre: 'quinta_rueda',
            bloqueante_si_falla: true,
            criterios: [
              { nombre: 'buen_estado_mordaza', critico: true, requiere_foto: true },
              { nombre: 'lubricacion_adecuada', critico: false, requiere_foto: false },
            ],
          },
        ],
      },
    ],
  },
  bus_buseta: {
    tipo_vehiculo: 'bus_buseta',
    aplica_inspeccion: ['preoperacional', 'periodica'],
    referencia_normativa: NORMATIVA_BASE,
    categorias: [
      {
        nombre: 'seguridad_pasajeros',
        ui_segmento: 'seguridad_pasiva',
        subcomponentes: [
          {
            nombre: 'salidas_emergencia',
            bloqueante_si_falla: true,
            criterios: [{ nombre: 'senalizacion_y_apertura', critico: true, requiere_foto: false }],
          },
        ],
      },
    ],
  },
  microbus: {
    tipo_vehiculo: 'microbus',
    aplica_inspeccion: ['preoperacional', 'periodica'],
    referencia_normativa: NORMATIVA_BASE,
    categorias: [
      {
        nombre: 'seguridad_pasajeros',
        ui_segmento: 'seguridad_pasiva',
        subcomponentes: [
          {
            nombre: 'cinturones_seguridad',
            bloqueante_si_falla: true,
            criterios: [{ nombre: 'estado_y_anclaje', critico: true, requiere_foto: false }],
          },
        ],
      },
    ],
  },
  maquinaria_amarilla: {
    tipo_vehiculo: 'maquinaria_amarilla',
    aplica_inspeccion: ['preoperacional', 'periodica'],
    referencia_normativa: NORMATIVA_BASE,
    categorias: [
      {
        nombre: 'sistemas_operativos',
        ui_segmento: 'especifico',
        subcomponentes: [
          {
            nombre: 'alarma_reversa',
            bloqueante_si_falla: true,
            criterios: [{ nombre: 'funcionamiento_sonoro', critico: true, requiere_foto: false }],
          },
        ],
      },
    ],
  },
  ambulancia: {
    tipo_vehiculo: 'ambulancia',
    aplica_inspeccion: ['preoperacional', 'periodica'],
    referencia_normativa: NORMATIVA_BASE,
    categorias: [
      {
        nombre: 'equipamiento_medico',
        ui_segmento: 'especifico',
        subcomponentes: [
          {
            nombre: 'senales_luminosas_y_acusticas',
            bloqueante_si_falla: true,
            criterios: [{ nombre: 'funcionamiento_pato_y_sirena', critico: true, requiere_foto: false }],
          },
        ],
      },
    ],
  },
  autotanque: {
    tipo_vehiculo: 'autotanque',
    aplica_inspeccion: ['preoperacional', 'periodica'],
    referencia_normativa: NORMATIVA_BASE,
    categorias: [
      {
        nombre: 'seguridad_de_producto',
        ui_segmento: 'especifico',
        subcomponentes: [
          {
            nombre: 'conexion_tierra',
            bloqueante_si_falla: true,
            criterios: [{ nombre: 'conexion_tierra_funciona', critico: true, requiere_foto: false }],
          },
        ],
      },
    ],
  },
  golf: {
    tipo_vehiculo: 'golf',
    aplica_inspeccion: ['preoperacional', 'periodica'],
    referencia_normativa: NORMATIVA_BASE,
    categorias: [
      {
        nombre: 'sistema_electrico',
        ui_segmento: 'especifico',
        subcomponentes: [
          {
            nombre: 'baterias_y_carga',
            bloqueante_si_falla: true,
            criterios: [{ nombre: 'nivel_bateria_adecuado', critico: true, requiere_foto: false }],
          },
        ],
      },
    ],
  },
};

export const DEFAULT_INSPECTION_TEMPLATE_KEY = 'vehiculo_liviano';

const DEFAULT_TEMPLATE_BY_INTERNAL_TYPE: Record<TipoVehiculo, string> = {
  MOTO: 'motocicleta',
  LIVIANO: 'vehiculo_liviano',
  FURGON: 'vehiculo_liviano',
  MINIBUS: 'microbus',
  BUS: 'bus_buseta',
  CAMION: 'camion_rigido',
  TRACTO: 'tractocamion',
  AUTOTANQUE: 'autotanque',
  MAQUINARIA: 'maquinaria_amarilla',
  MINICARGADOR: 'maquinaria_amarilla',
  GOLF: 'golf',
  GRUA: 'camion_rigido',
  AMBULANCIA: 'ambulancia',
};

const VEHICLE_SELECTION_RULES: Array<{
  keywords: string[];
  internalType: TipoVehiculo;
  templateKey: string;
}> = [
  { keywords: ['autotanque', 'cisterna', 'tanque'], internalType: 'AUTOTANQUE', templateKey: 'autotanque' },
  { keywords: ['volqueta'], internalType: 'CAMION', templateKey: 'volqueta' },
  { keywords: ['tracto', 'tractocamion'], internalType: 'TRACTO', templateKey: 'tractocamion' },
  { keywords: ['buseta', 'bus'], internalType: 'BUS', templateKey: 'bus_buseta' },
  { keywords: ['micro'], internalType: 'MINIBUS', templateKey: 'microbus' },
  { keywords: ['furgon', 'van'], internalType: 'FURGON', templateKey: 'vehiculo_liviano' },
  { keywords: ['moto'], internalType: 'MOTO', templateKey: 'motocicleta' },
  { keywords: ['maquinaria', 'amarilla'], internalType: 'MAQUINARIA', templateKey: 'maquinaria_amarilla' },
  { keywords: ['mini'], internalType: 'MINICARGADOR', templateKey: 'maquinaria_amarilla' },
  { keywords: ['ambulancia'], internalType: 'AMBULANCIA', templateKey: 'ambulancia' },
  { keywords: ['grua', 'izaje'], internalType: 'GRUA', templateKey: 'camion_rigido' },
  { keywords: ['golf', 'electro'], internalType: 'GOLF', templateKey: 'golf' },
  { keywords: ['rigido', 'camion'], internalType: 'CAMION', templateKey: 'camion_rigido' },
];

function normalizeVehicleSearchValue(rawValue?: string) {
  return (rawValue ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function resolveInspectionVehicle(rawVehicleType?: string, fallbackType: TipoVehiculo = 'LIVIANO') {
  const normalized = normalizeVehicleSearchValue(rawVehicleType);
  const matchedRule = VEHICLE_SELECTION_RULES.find((rule) =>
    rule.keywords.some((keyword) => normalized.includes(keyword))
  );

  if (matchedRule) {
    return {
      internalType: matchedRule.internalType,
      templateKey: matchedRule.templateKey,
    };
  }

  return {
    internalType: fallbackType,
    templateKey: DEFAULT_TEMPLATE_BY_INTERNAL_TYPE[fallbackType] ?? DEFAULT_INSPECTION_TEMPLATE_KEY,
  };
}

export function resolveInspectionTemplate(templateKey: string): InspectionTemplate | undefined {
  const template = INSPECTION_CATALOG[templateKey];

  if (!template) {
    return undefined;
  }

  if (!template.base_template) {
    return template;
  }

  const baseTemplate = resolveInspectionTemplate(template.base_template);

  if (!baseTemplate) {
    return template;
  }

  return {
    ...baseTemplate,
    ...template,
    categorias: [...baseTemplate.categorias, ...template.categorias],
  };
}

export function getInspectionTemplateForVehicle(rawVehicleType?: string, fallbackType: TipoVehiculo = 'LIVIANO') {
  const resolved = resolveInspectionVehicle(rawVehicleType, fallbackType);
  return {
    ...resolved,
    template: resolveInspectionTemplate(resolved.templateKey),
  };
}

export function supportsInspectionType(template: InspectionTemplate | undefined, inspectionType: string) {
  if (!template) {
    return true;
  }

  return template.aplica_inspeccion.includes(inspectionType as 'preoperacional' | 'periodica');
}

export function isInspectionApproved(inspection: { resultado_final?: string; aprobadoParaCircular?: boolean } | null | undefined) {
  if (!inspection) {
    return false;
  }

  if (inspection.resultado_final) {
    return inspection.resultado_final === 'apto' || inspection.resultado_final === 'apto_con_observaciones';
  }

  return inspection.aprobadoParaCircular === true;
}

export function isInspectionForSameDay(
  inspection: { fechaHora?: string } | null | undefined,
  baseDate: Date = new Date()
) {
  if (!inspection?.fechaHora) {
    return false;
  }

  const inspectionDate = new Date(inspection.fechaHora);

  return (
    inspectionDate.getFullYear() === baseDate.getFullYear() &&
    inspectionDate.getMonth() === baseDate.getMonth() &&
    inspectionDate.getDate() === baseDate.getDate()
  );
}
