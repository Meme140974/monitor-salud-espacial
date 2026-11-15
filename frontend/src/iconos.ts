/**
 * Iconos compartidos (Phosphor, estilo duotono). Sustituyen a cualquier emoji que traiga el
 * backend: estado, sistema corporal y tipo de tarea de la rutina.
 */
import { Pulse, Carrot, Barbell, Bone, BookOpenText, Brain, CheckCircle, Drop, Eye, Footprints, Heartbeat, Moon, WarningOctagon, Phone, Pill, Scales, Smiley, Stethoscope, Sun, Thermometer, Warning, Wind, type Icon } from "@phosphor-icons/react";
import type { Estado } from "./api";

export const ICONO_ESTADO: Record<Estado, Icon> = {
  verde: CheckCircle,
  amarillo: Warning,
  rojo: WarningOctagon,
};

export const ICONO_SISTEMA: Record<string, Icon> = {
  mente: Brain,
  cerebro_ojos: Eye,
  sangre_inmune: Drop,
  corazon_vasos: Heartbeat,
  musculos: Barbell,
  huesos: Bone,
};

export function iconoSistema(clave: string): Icon {
  return ICONO_SISTEMA[clave] ?? Pulse;
}

const REGLAS_TAREA: [RegExp, Icon][] = [
  [/agua|hidrat|beb/i, Drop],
  [/dorm|sueñ|descans|siesta/i, Moon],
  [/respir|medit|relaj|calma/i, Wind],
  [/fuerza|pesas|resisten|muscul|sentadill/i, Barbell],
  [/camin|cinta|correr|carrera|bici|ejercicio|cardio/i, Footprints],
  [/comid|aliment|fruta|verdura|calcio|vitamina d|dieta|nutri/i, Carrot],
  [/pastill|medic|suplement|vitamina/i, Pill],
  [/pes(o|ar)|báscula|masa/i, Scales],
  [/temperatura|fiebre/i, Thermometer],
  [/presión|pulso|frecuencia|tensión|corazón/i, Heartbeat],
  [/ojo|vista|visión|visual/i, Eye],
  [/hueso|densidad/i, Bone],
  [/luz|sol|ritmo circad/i, Sun],
  [/famil|llamad|tierra|contacto/i, Phone],
  [/diario|leer|lectura|escrib/i, BookOpenText],
  [/ánimo|emoci|estrés|mente|ansied/i, Brain],
];

export function iconoTarea(titulo: string, descripcion = ""): Icon {
  const texto = `${titulo} ${descripcion}`;
  for (const [patron, Icono] of REGLAS_TAREA) if (patron.test(texto)) return Icono;
  return Stethoscope;
}
