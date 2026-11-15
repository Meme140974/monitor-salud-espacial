/**
 * Cuerpo humano anatómico en 3D (three.js). Una silueta translúcida tipo
 * rayos X deja ver, por capas, el esqueleto, los órganos y la circulación.
 * Toda la anatomía se ancla a los huesos del esqueleto animado: la persona
 * respira (los pulmones se expanden), el corazón late a un ritmo que depende
 * de su estado, y al elegir un sistema se ilumina su parte del cuerpo.
 *
 * Silueta: public/models/silueta.glb (X Bot de Mixamo, ejemplos de three.js)
 * con sus clips "idle" y "agree". La anatomía es geometría procedural,
 * ilustrativa: no es un modelo médico. Todo es local: funciona sin internet.
 */
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Html, Lightformer, OrbitControls, useAnimations, useGLTF } from "@react-three/drei";
import { Bone, Drop, Heart, Person } from "@phosphor-icons/react";
import { Component, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { COLOR_ESTADO, Sistema, TEXTO_ESTADO } from "../api";
import { ICONO_ESTADO } from "../iconos";

const MODELO = "/models/silueta.glb";

export type Capa = "piel" | "esqueleto" | "organos" | "circulacion";
const CAPAS: { id: Capa; nombre: string; Icono: typeof Bone }[] = [
  { id: "piel", nombre: "Piel", Icono: Person },
  { id: "esqueleto", nombre: "Esqueleto", Icono: Bone },
  { id: "organos", nombre: "Órganos", Icono: Heart },
  { id: "circulacion", nombre: "Circulación", Icono: Drop },
];

/** Grupos de material que se iluminan al elegir cada sistema. */
const GRUPOS_SISTEMA: Record<string, string[]> = {
  mente: ["cerebro"],
  cerebro_ojos: ["cerebro", "ojos"],
  sangre_inmune: ["arterias", "venas"],
  corazon_vasos: ["corazon", "arterias"],
  musculos: ["musculo"],
  huesos: ["hueso"],
};

/** Capa que debe estar visible para ver cada sistema. */
const CAPA_SISTEMA: Record<string, Capa> = {
  mente: "organos",
  cerebro_ojos: "organos",
  sangre_inmune: "circulacion",
  corazon_vasos: "organos",
  musculos: "piel",
  huesos: "esqueleto",
};

const CORTO: Record<string, string> = {
  mente: "Mente",
  cerebro_ojos: "Cerebro y ojos",
  sangre_inmune: "Sangre",
  corazon_vasos: "Corazón",
  musculos: "Músculos",
  huesos: "Huesos",
};

const reducido = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------------------------------------------------------------------------
// Construcción de la anatomía
// ---------------------------------------------------------------------------

interface Anatomia {
  capas: Record<Capa, THREE.Object3D[]>;
  materiales: Record<string, THREE.MeshPhysicalMaterial>;
  piel: THREE.MeshStandardMaterial;
  anclas: Record<string, THREE.Object3D>;
  corazon: THREE.Object3D;
  pulmones: THREE.Object3D[];
}

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const ESFERA = new THREE.SphereGeometry(1, 32, 24);

function material(color: string, extra: THREE.MeshPhysicalMaterialParameters = {}) {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.5,
    clearcoat: 0.35,
    clearcoatRoughness: 0.4,
    transparent: true,
    opacity: 1,
    ...extra,
  });
}

/** Silueta de rayos X: translúcida en el centro, luminosa en los bordes. */
function materialPiel() {
  const m = new THREE.MeshStandardMaterial({
    color: "#8FA6C4",
    roughness: 0.6,
    metalness: 0,
    transparent: true,
    opacity: 0.05,
    depthWrite: false,
  });
  m.userData.uniforms = { uBorde: { value: new THREE.Color("#B9CBE4") }, uAlfaBorde: { value: 0.55 } };
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, m.userData.uniforms);
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform vec3 uBorde;\nuniform float uAlfaBorde;")
      .replace(
        "#include <opaque_fragment>",
        `float fres = pow(1.0 - clamp(abs(dot(normalize(normal), normalize(vViewPosition))), 0.0, 1.0), 2.4);
         outgoingLight = mix(outgoingLight, uBorde, fres);
         diffuseColor.a = clamp(diffuseColor.a + fres * uAlfaBorde, 0.0, 1.0);
         #include <opaque_fragment>`
      );
  };
  return m;
}

function capsula(a: THREE.Vector3, b: THREE.Vector3, r: number, mat: THREE.Material) {
  const largo = Math.max(0.001, a.distanceTo(b) - 2 * r);
  const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, largo, 6, 14), mat);
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize());
  return m;
}

function elipsoide(c: THREE.Vector3, s: [number, number, number], mat: THREE.Material, rot: [number, number, number] = [0, 0, 0]) {
  const m = new THREE.Mesh(ESFERA, mat);
  m.position.copy(c);
  m.scale.set(...s);
  m.rotation.set(...rot);
  return m;
}

function tubo(puntos: THREE.Vector3[], r: number, mat: THREE.Material, segmentos = 64) {
  const curva = new THREE.CatmullRomCurve3(puntos, false, "centripetal");
  return new THREE.Mesh(new THREE.TubeGeometry(curva, segmentos, r, 10, false), mat);
}

function construirAnatomia(escena: THREE.Object3D): Anatomia {
  const h = (n: string) => (escena.getObjectByName(`mixamorig${n}`) ?? escena.getObjectByName(n)) as THREE.Object3D;
  escena.updateMatrixWorld(true);
  const P = (n: string) => h(n).getWorldPosition(new THREE.Vector3());

  const mat = {
    hueso: material("#E4DCCB", { roughness: 0.62, clearcoat: 0.15 }),
    craneo: material("#E4DCCB", { roughness: 0.55, clearcoat: 0.3, opacity: 0.42, depthWrite: false }),
    cerebro: material("#C7A3A0", { roughness: 0.7, clearcoat: 0.2 }),
    ojos: material("#E9E6E0", { roughness: 0.2, clearcoat: 1 }),
    corazon: material("#B4554C", { roughness: 0.42 }),
    pulmones: material("#C99490", { roughness: 0.75, opacity: 0.82 }),
    higado: material("#8C4A40"),
    estomago: material("#C98C74"),
    intestino: material("#D7A58F", { roughness: 0.55 }),
    colon: material("#C38C78", { roughness: 0.6 }),
    rinones: material("#9E5A4E"),
    arterias: material("#B8564D", { roughness: 0.35 }),
    venas: material("#4F6F9C", { roughness: 0.35 }),
  };
  const piel = materialPiel();
  const capas: Record<Capa, THREE.Object3D[]> = { piel: [], esqueleto: [], organos: [], circulacion: [] };
  const anclas: Record<string, THREE.Object3D> = {};

  // --- piel: la silueta del modelo con material de rayos X ---
  escena.traverse((o) => {
    const m = o as THREE.SkinnedMesh;
    if (!m.isMesh) return;
    m.material = piel;
    m.renderOrder = 10;
    m.frustumCulled = false;
    capas.piel.push(m);
  });

  const fijar = (obj: THREE.Object3D, hueso: string, capa: Capa) => {
    obj.updateMatrixWorld(true);
    h(hueso).attach(obj);
    obj.traverse((o) => {
      o.frustumCulled = false;
      o.renderOrder = 1;
    });
    capas[capa].push(obj);
    return obj;
  };
  const ancla = (clave: string, pos: THREE.Vector3, hueso: string) => {
    const o = new THREE.Object3D();
    o.position.copy(pos);
    o.updateMatrixWorld(true);
    h(hueso).attach(o);
    anclas[clave] = o;
  };

  // --- esqueleto ---
  const cabeza = P("Head");
  // cráneo translúcido (deja ver el cerebro) con maxilar y mandíbula
  const craneo = new THREE.Group();
  craneo.add(elipsoide(V(0, cabeza.y + 0.105, 0.005), [0.072, 0.082, 0.09], mat.craneo));
  craneo.add(elipsoide(V(0, cabeza.y + 0.05, 0.055), [0.05, 0.04, 0.045], mat.craneo));
  const mandibula = new THREE.Mesh(new THREE.TorusGeometry(0.038, 0.009, 10, 32, Math.PI), mat.hueso);
  mandibula.position.set(0, cabeza.y + 0.022, 0.05);
  mandibula.rotation.set(Math.PI / 2 + 0.35, 0, Math.PI);
  craneo.add(mandibula);
  fijar(craneo, "Head", "esqueleto");

  // columna: vértebras siguiendo la curva de los huesos, por detrás
  const eje = ["Hips", "Spine", "Spine1", "Spine2", "Neck", "Head"].map((n) => ({ n, p: P(n) }));
  const curvaColumna = new THREE.CatmullRomCurve3(eje.map(({ p }) => V(0, p.y, p.z - 0.055)));
  for (let i = 0; i <= 22; i++) {
    const pt = curvaColumna.getPoint(i / 22);
    if (pt.y > cabeza.y - 0.01) break;
    const v = new THREE.Group();
    const cuerpoV = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.017, 0.016, 14), mat.hueso);
    cuerpoV.position.copy(pt);
    v.add(cuerpoV);
    v.add(elipsoide(V(0, pt.y - 0.004, pt.z - 0.022), [0.005, 0.008, 0.014], mat.hueso, [0.5, 0, 0]));
    const hueso = [...eje].reverse().find(({ p }) => p.y <= pt.y + 0.001)?.n ?? "Hips";
    fijar(v, hueso, "esqueleto");
  }

  // costillas: diez pares de arcos, de la columna hacia el esternón
  const s2 = P("Spine2");
  for (let i = 0; i < 10; i++) {
    const y0 = s2.y + 0.09 - i * 0.022;
    const k = Math.sin((Math.PI * (i + 1.2)) / 11.5);
    const a = 0.07 + 0.065 * k;
    const b = 0.07 + 0.025 * k;
    const zEspalda = s2.z - 0.06;
    const fin = 1.15 - (i > 6 ? (i - 6) * 0.25 : 0);
    for (const lado of [-1, 1]) {
      const pts: THREE.Vector3[] = [];
      for (let j = 0; j <= 14; j++) {
        const th = -Math.PI / 2 + ((fin + Math.PI / 2) * j) / 14;
        pts.push(V(lado * a * Math.cos(th), y0 - 0.045 * ((th + Math.PI / 2) / Math.PI), zEspalda + b + b * Math.sin(th)));
      }
      fijar(tubo(pts, 0.0048, mat.hueso, 40), i < 5 ? "Spine2" : "Spine1", "esqueleto");
    }
  }
  fijar(capsula(V(0, s2.y + 0.085, s2.z + 0.085), V(0, s2.y - 0.07, s2.z + 0.09), 0.012, mat.hueso), "Spine2", "esqueleto");

  // clavículas, escápulas y pelvis
  for (const [lado, n] of [[1, "Left"], [-1, "Right"]] as const) {
    const hombro = P(`${n}Arm`);
    fijar(tubo([V(lado * 0.02, hombro.y + 0.005, s2.z + 0.08), V(lado * 0.08, hombro.y + 0.02, s2.z + 0.06), V(hombro.x, hombro.y + 0.015, hombro.z + 0.01)], 0.007, mat.hueso, 24), `${n}Shoulder`, "esqueleto");
    fijar(elipsoide(V(lado * 0.085, hombro.y - 0.06, s2.z - 0.08), [0.045, 0.06, 0.008], mat.hueso, [0.2, lado * 0.35, 0]), "Spine2", "esqueleto");
  }
  const cadera = P("Hips");
  const pelvis = new THREE.Group();
  const anillo = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.018, 12, 40), mat.hueso);
  anillo.position.set(0, cadera.y - 0.05, cadera.z + 0.005);
  anillo.rotation.x = Math.PI / 2.4;
  anillo.scale.set(1.25, 1, 0.9);
  pelvis.add(anillo);
  for (const lado of [-1, 1]) pelvis.add(elipsoide(V(lado * 0.095, cadera.y + 0.005, cadera.z - 0.005), [0.05, 0.065, 0.016], mat.hueso, [0.15, lado * 0.5, lado * -0.25]));
  fijar(pelvis, "Hips", "esqueleto");

  // huesos largos de brazos y piernas
  for (const [lado, n] of [[1, "Left"], [-1, "Right"]] as const) {
    const [hom, cod, mun] = [P(`${n}Arm`), P(`${n}ForeArm`), P(`${n}Hand`)];
    fijar(capsula(hom, cod, 0.015, mat.hueso), `${n}Arm`, "esqueleto");
    fijar(capsula(cod.clone().add(V(0, 0, 0.008)), mun.clone().add(V(0, 0, 0.012)), 0.0085, mat.hueso), `${n}ForeArm`, "esqueleto");
    fijar(capsula(cod.clone().add(V(0, 0, -0.01)), mun.clone().add(V(0, 0, -0.008)), 0.0075, mat.hueso), `${n}ForeArm`, "esqueleto");
    fijar(elipsoide(mun.clone().add(V(lado * 0.055, 0, 0)), [0.05, 0.011, 0.033], mat.hueso), `${n}Hand`, "esqueleto");

    const [mus, rod, tob, punta] = [P(`${n}UpLeg`), P(`${n}Leg`), P(`${n}Foot`), P(`${n}ToeBase`)];
    fijar(capsula(mus.clone().add(V(lado * 0.01, 0, 0)), rod, 0.02, mat.hueso), `${n}UpLeg`, "esqueleto");
    fijar(elipsoide(rod.clone().add(V(0, 0.005, 0.04)), [0.02, 0.024, 0.012], mat.hueso), `${n}Leg`, "esqueleto");
    fijar(capsula(rod, tob, 0.015, mat.hueso), `${n}Leg`, "esqueleto");
    fijar(capsula(rod.clone().add(V(lado * 0.028, -0.03, -0.01)), tob.clone().add(V(lado * 0.025, 0.02, -0.01)), 0.007, mat.hueso), `${n}Leg`, "esqueleto");
    fijar(capsula(tob.clone().add(V(0, -0.04, -0.02)), punta.clone().add(V(0, 0.01, 0.04)), 0.02, mat.hueso), `${n}Foot`, "esqueleto");
  }

  // --- órganos ---
  const s1 = P("Spine1");
  const s0 = P("Spine");
  for (const lado of [-1, 1]) fijar(elipsoide(V(lado * 0.026, cabeza.y + 0.125, 0.005), [0.034, 0.05, 0.072], mat.cerebro, [0, 0, lado * 0.08]), "Head", "organos");
  fijar(elipsoide(V(0, cabeza.y + 0.075, -0.045), [0.035, 0.022, 0.025], mat.cerebro), "Head", "organos");
  for (const lado of [-1, 1]) fijar(elipsoide(V(lado * 0.03, cabeza.y + 0.085, 0.085), [0.014, 0.014, 0.014], mat.ojos), "Head", "organos");

  const pulmones: THREE.Object3D[] = [];
  for (const lado of [-1, 1]) {
    const p = elipsoide(V(lado * 0.068, s2.y + 0.02, s2.z + 0.03), [0.058, 0.105, 0.065], mat.pulmones, [0, 0, lado * -0.12]);
    fijar(p, "Spine2", "organos");
    p.userData.base = p.scale.clone();
    pulmones.push(p);
  }
  const corazon = elipsoide(V(0.022, s2.y - 0.025, s2.z + 0.075), [0.038, 0.048, 0.036], mat.corazon, [0.2, 0, -0.45]);
  fijar(corazon, "Spine2", "organos");
  corazon.userData.base = corazon.scale.clone();

  fijar(elipsoide(V(-0.05, s1.y - 0.015, s1.z + 0.05), [0.085, 0.045, 0.06], mat.higado, [0, 0, 0.28]), "Spine1", "organos");
  fijar(elipsoide(V(0.06, s1.y - 0.03, s1.z + 0.06), [0.045, 0.038, 0.032], mat.estomago, [0, 0, -0.5]), "Spine1", "organos");
  for (const lado of [-1, 1]) fijar(elipsoide(V(lado * 0.058, s0.y + 0.02, s0.z - 0.03), [0.022, 0.036, 0.018], mat.rinones), "Spine", "organos");

  // intestino delgado: serpentina compacta; colon: marco alrededor
  const serp: THREE.Vector3[] = [];
  for (let fila = 0; fila < 6; fila++) {
    const y = s0.y + 0.03 - fila * 0.022;
    for (let j = 0; j <= 6; j++) {
      const u = fila % 2 === 0 ? j / 6 : 1 - j / 6;
      serp.push(V(-0.06 + 0.12 * u, y + Math.sin(j * 1.7) * 0.006, s0.z + 0.075 + Math.cos(j * 1.3 + fila) * 0.012));
    }
  }
  fijar(tubo(serp, 0.011, mat.intestino, 260), "Spine", "organos");
  fijar(
    tubo(
      [V(-0.085, s0.y - 0.11, s0.z + 0.06), V(-0.09, s0.y + 0.03, s0.z + 0.06), V(-0.07, s0.y + 0.06, s0.z + 0.07), V(0.07, s0.y + 0.06, s0.z + 0.07), V(0.09, s0.y + 0.03, s0.z + 0.06), V(0.085, s0.y - 0.1, s0.z + 0.06), V(0.03, s0.y - 0.13, s0.z + 0.05)],
      0.016,
      mat.colon,
      120
    ),
    "Spine",
    "organos"
  );

  // --- circulación: arterias (rojo) y venas (azul) ---
  const c = corazon.getWorldPosition(new THREE.Vector3());
  const cuello = P("Neck");
  const desc = (dx: number) => [V(dx, s2.y + 0.07, s2.z), V(dx, s1.y, s1.z - 0.02), V(dx, s0.y, s0.z - 0.01), V(dx, cadera.y - 0.02, cadera.z)];
  fijar(tubo([c, V(0.01, s2.y + 0.07, s2.z + 0.05), V(-0.005, s2.y + 0.085, s2.z + 0.015), ...desc(0.008)], 0.009, mat.arterias, 90), "Spine2", "circulacion");
  fijar(tubo([c.clone().add(V(-0.03, 0.01, 0)), ...desc(-0.022)], 0.01, mat.venas, 80), "Spine2", "circulacion");
  for (const [lado, n] of [[1, "Left"], [-1, "Right"]] as const) {
    for (const tipo of ["arterias", "venas"] as const) {
      const m = mat[tipo];
      const dz = tipo === "arterias" ? 0.018 : -0.005;
      const r = tipo === "arterias" ? 0.0055 : 0.006;
      const dx = tipo === "arterias" ? 0.012 : -0.012;
      fijar(tubo([V(lado * 0.022 + dx * 0.4, s2.y + 0.09, s2.z + 0.04), V(lado * 0.026, cuello.y, cuello.z + 0.04 + dz * 0.3), V(lado * 0.03, cabeza.y + 0.04, cabeza.z + 0.05)], r, m, 32), "Neck", "circulacion");
      const [hom, cod, mun] = [P(`${n}Arm`), P(`${n}ForeArm`), P(`${n}Hand`)];
      fijar(tubo([V(lado * 0.03, s2.y + 0.08, s2.z + 0.03), hom.clone().add(V(0, -0.02, dz))], r, m, 24), `${n}Shoulder`, "circulacion");
      fijar(tubo([hom.clone().add(V(0, -0.02, dz)), cod.clone().add(V(0, -0.018, dz))], r * 0.9, m, 24), `${n}Arm`, "circulacion");
      fijar(tubo([cod.clone().add(V(0, -0.018, dz)), mun.clone().add(V(0, -0.012, dz))], r * 0.75, m, 24), `${n}ForeArm`, "circulacion");
      const [mus, rod, tob] = [P(`${n}UpLeg`), P(`${n}Leg`), P(`${n}Foot`)];
      fijar(tubo([V(dx * 0.6, cadera.y - 0.02, cadera.z + dz), mus.clone().add(V(-lado * 0.012, -0.04, 0.02 + dz))], r * 1.1, m, 24), "Hips", "circulacion");
      fijar(tubo([mus.clone().add(V(-lado * 0.012, -0.04, 0.02 + dz)), rod.clone().add(V(-lado * 0.01, 0, -0.025 + dz))], r, m, 24), `${n}UpLeg`, "circulacion");
      fijar(tubo([rod.clone().add(V(-lado * 0.01, 0, -0.025 + dz)), tob.clone().add(V(0, 0.03, -0.02 + dz))], r * 0.85, m, 24), `${n}Leg`, "circulacion");
    }
  }

  // --- anclas de los marcadores ---
  ancla("mente", V(0, cabeza.y + 0.2, 0.03), "Head");
  ancla("cerebro_ojos", V(0.065, cabeza.y + 0.09, 0.1), "Head");
  ancla("corazon_vasos", c.clone().add(V(0.03, 0, 0.06)), "Spine2");
  ancla("sangre_inmune", V(-0.012, s0.y + 0.05, s0.z + 0.15), "Spine");
  ancla("musculos", P("LeftArm").lerp(P("LeftForeArm"), 0.5).add(V(0, 0.045, 0.04)), "LeftArm");
  ancla("huesos", P("RightLeg").add(V(0, 0.01, 0.075)), "RightLeg");

  return { capas, materiales: mat, piel, anclas, corazon, pulmones };
}

/** Grupo de iluminación al que pertenece cada material. */
const GRUPO_DE_MATERIAL: Record<string, string> = {
  craneo: "hueso",
  cerebro: "cerebro",
  ojos: "ojos",
  corazon: "corazon",
  arterias: "arterias",
  venas: "venas",
  hueso: "hueso",
};

// ---------------------------------------------------------------------------
// Escena
// ---------------------------------------------------------------------------

interface Props {
  sistemas?: Sistema[];
  seleccionado?: number | null;
  onSeleccionar?: (s: Sistema) => void;
  /** Sin marcadores ni interacción: solo la figura (pantalla de acceso). */
  decorativo?: boolean;
  className?: string;
}

type PropsEscena = Props & { capas: Record<Capa, boolean> };

function Cuerpo({ sistemas = [], seleccionado = null, onSeleccionar, decorativo, capas }: PropsEscena) {
  const grupo = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(MODELO);
  const anatomia = useMemo<Anatomia>(() => {
    if (!scene.userData.anatomia) scene.userData.anatomia = construirAnatomia(scene);
    return scene.userData.anatomia as Anatomia;
  }, [scene]);
  const { actions } = useAnimations(animations, grupo);
  const sinMovimiento = useMemo(reducido, []);
  const elegido = sistemas.find((s) => s.id === seleccionado) ?? null;
  const estadoCorazon = sistemas.find((s) => s.clave === "corazon_vasos")?.estado ?? "verde";

  useEffect(() => {
    const reposo = actions.idle;
    if (!reposo) return;
    reposo.reset().fadeIn(0.4).play();
    if (sinMovimiento) reposo.paused = true;
    return () => {
      reposo.fadeOut(0.2);
    };
  }, [actions, sinMovimiento]);

  // Al elegir un sistema, la persona asiente brevemente.
  const previo = useRef<number | null>(null);
  useEffect(() => {
    if (sinMovimiento || seleccionado === null || seleccionado === previo.current) {
      previo.current = seleccionado;
      return;
    }
    previo.current = seleccionado;
    const gesto = actions.agree;
    if (!gesto) return;
    gesto.reset().setLoop(THREE.LoopOnce, 1);
    gesto.setEffectiveWeight(0.5).fadeIn(0.25).play();
    const t = setTimeout(() => gesto.fadeOut(0.5), 1300);
    return () => clearTimeout(t);
  }, [seleccionado, actions, sinMovimiento]);

  // Capas visibles.
  useEffect(() => {
    (Object.keys(anatomia.capas) as Capa[]).forEach((c) => anatomia.capas[c].forEach((o) => (o.visible = capas[c])));
  }, [anatomia, capas]);

  // Respiración, latido e iluminación del sistema elegido.
  const negro = useMemo(() => new THREE.Color(0, 0, 0), []);
  const tinte = useMemo(() => new THREE.Color(), []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const respira = sinMovimiento ? 0 : Math.sin((t * Math.PI * 2) / 4.2);
    anatomia.pulmones.forEach((p) => {
      const b = p.userData.base as THREE.Vector3;
      p.scale.set(b.x * (1 + respira * 0.07), b.y * (1 + respira * 0.035), b.z * (1 + respira * 0.08));
    });
    const hz = estadoCorazon === "rojo" ? 1.55 : estadoCorazon === "amarillo" ? 1.3 : 1.05;
    const fase = (t * hz) % 1;
    const latido = sinMovimiento
      ? 0
      : Math.max(0, Math.sin(fase * Math.PI * 2)) ** 6 * 0.12 + Math.max(0, Math.sin((fase - 0.18) * Math.PI * 2)) ** 8 * 0.06;
    const bc = anatomia.corazon.userData.base as THREE.Vector3;
    anatomia.corazon.scale.copy(bc).multiplyScalar(1 + latido);

    const activos = elegido ? GRUPOS_SISTEMA[elegido.clave] ?? [] : [];
    const brillo = 0.45 + (sinMovimiento ? 0 : Math.sin(t * 3) * 0.15);
    if (elegido) tinte.set(COLOR_ESTADO[elegido.estado]);
    Object.entries(anatomia.materiales).forEach(([nombre, m]) => {
      const activo = activos.includes(GRUPO_DE_MATERIAL[nombre] ?? "");
      m.emissive.copy(activo ? tinte : negro);
      m.emissiveIntensity = activo ? brillo : 0;
      const base = nombre === "pulmones" ? 0.82 : nombre === "craneo" ? 0.42 : 1;
      m.opacity = elegido && !activo ? base * 0.3 : base;
      m.depthWrite = nombre !== "craneo" && m.opacity > 0.9;
    });

    // Músculos: la silueta toma color de tejido.
    const u = anatomia.piel.userData.uniforms;
    const musculo = activos.includes("musculo");
    anatomia.piel.color.set(musculo ? "#A8584E" : "#8FA6C4");
    anatomia.piel.opacity = musculo ? 0.28 : 0.05;
    u.uBorde.value.set(musculo && elegido ? COLOR_ESTADO[elegido.estado] : "#B9CBE4");
    u.uAlfaBorde.value = musculo ? 0.7 : 0.55;
  });

  return (
    <group ref={grupo} dispose={null}>
      <primitive object={scene} />
      {!decorativo &&
        sistemas.map((s) =>
          anatomia.anclas[s.clave] ? (
            <Marcador
              key={s.id}
              sistema={s}
              ancla={anatomia.anclas[s.clave]}
              activo={seleccionado === s.id}
              atenuado={seleccionado !== null && seleccionado !== s.id}
              onSeleccionar={onSeleccionar}
            />
          ) : null
        )}
    </group>
  );
}

function Marcador({
  sistema,
  ancla,
  activo,
  atenuado,
  onSeleccionar,
}: {
  sistema: Sistema;
  ancla: THREE.Object3D;
  activo: boolean;
  atenuado: boolean;
  onSeleccionar?: (s: Sistema) => void;
}) {
  const ref = useRef<THREE.Group>(null);
  const pos = useMemo(() => new THREE.Vector3(), []);
  const color = COLOR_ESTADO[sistema.estado];
  const Icono = ICONO_ESTADO[sistema.estado];

  useFrame(() => {
    if (ref.current) ref.current.position.copy(ancla.getWorldPosition(pos));
  });

  return (
    <group ref={ref}>
      <Html center zIndexRange={[20, 0]} style={{ pointerEvents: "auto" }}>
        <button
          type="button"
          onClick={() => onSeleccionar?.(sistema)}
          aria-pressed={activo}
          aria-label={`${sistema.nombre}: ${TEXTO_ESTADO[sistema.estado]}`}
          className={`group relative flex h-7 w-7 items-center justify-center rounded-full border bg-fondo/85 backdrop-blur transition-[opacity,transform] duration-300 hover:scale-110 ${
            atenuado ? "opacity-40 hover:opacity-100" : "opacity-100"
          } ${activo ? "scale-110" : ""}`}
          style={{ borderColor: activo ? "#E8E2D4" : `${color}99`, color }}
        >
          <Icono size={15} weight="fill" aria-hidden />
          {sistema.estado === "rojo" && (
            <span className="halo absolute inset-0 rounded-full border" style={{ borderColor: color }} aria-hidden />
          )}
          <span
            className={`pointer-events-none absolute left-9 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md border border-linea2 bg-fondo/90 px-2 py-1 text-xs font-medium text-tinta backdrop-blur transition-opacity duration-200 ${
              activo ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
            }`}
            aria-hidden
          >
            {CORTO[sistema.clave] ?? sistema.nombre} · {TEXTO_ESTADO[sistema.estado]}
          </span>
        </button>
      </Html>
    </group>
  );
}

/** Línea de luz que recorre el cuerpo de arriba abajo una sola vez. */
function Escaneo() {
  const ref = useRef<THREE.Mesh>(null);
  const material = useRef<THREE.MeshBasicMaterial>(null);
  const inicio = useRef<number | null>(null);
  useFrame(({ clock }) => {
    if (!ref.current || !material.current) return;
    if (inicio.current === null) inicio.current = clock.elapsedTime;
    const k = Math.min(1, (clock.elapsedTime - inicio.current - 0.3) / 2.4);
    if (k < 0) return;
    const suave = 1 - Math.pow(1 - k, 3);
    ref.current.position.y = 1.9 - suave * 1.9;
    material.current.opacity = k < 1 ? Math.sin(k * Math.PI) * 0.7 : 0;
    ref.current.visible = k < 1;
  });
  return (
    <mesh ref={ref} position={[0, 1.9, 0]} visible={false}>
      <cylinderGeometry args={[0.36, 0.36, 0.004, 96, 1, true]} />
      <meshBasicMaterial ref={material} color="#B9CBE4" transparent opacity={0} side={THREE.DoubleSide} toneMapped={false} />
    </mesh>
  );
}

/** Cámara: gira sola en reposo; al elegir un sistema se acerca sin recortar el cuerpo. */
function Camara({ anclas, clave }: { anclas: Record<string, THREE.Object3D> | null; clave: string | null }) {
  const controles = useRef<OrbitControlsImpl>(null);
  const objetivo = useMemo(() => new THREE.Vector3(0, 0.9, 0), []);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const sinMovimiento = useMemo(reducido, []);

  useFrame(({ camera }, dt) => {
    const c = controles.current;
    if (!c) return;
    let distancia = 4.3;
    objetivo.set(0, 0.9, 0);
    const a = clave && anclas ? anclas[clave] : null;
    if (a) {
      a.getWorldPosition(tmp);
      objetivo.set(0, THREE.MathUtils.clamp(tmp.y, 0.75, 1.35), 0);
      distancia = 3.1;
    }
    const k = sinMovimiento ? 1 : 1 - Math.exp(-dt * 2.6);
    c.target.lerp(objetivo, k);
    tmp.copy(camera.position).sub(c.target);
    tmp.setLength(THREE.MathUtils.lerp(tmp.length(), distancia, k));
    camera.position.copy(c.target).add(tmp);
    c.autoRotate = !clave && !sinMovimiento;
  });

  return (
    <OrbitControls
      ref={controles}
      makeDefault
      enablePan={false}
      enableZoom={false}
      autoRotateSpeed={0.6}
      minPolarAngle={Math.PI / 2.7}
      maxPolarAngle={Math.PI / 1.9}
      enableDamping
    />
  );
}

function Escena(props: PropsEscena) {
  const { scene } = useGLTF(MODELO);
  const clave = props.sistemas?.find((s) => s.id === props.seleccionado)?.clave ?? null;
  const anclas = (scene.userData.anatomia as Anatomia | undefined)?.anclas ?? null;
  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[2, 3.4, 2.8]} intensity={1.6} color="#FFF3E4" castShadow />
      <directionalLight position={[-2.5, 1.5, 1.5]} intensity={0.45} color="#C9D3E2" />
      <spotLight position={[-2.6, 2.6, -2.4]} intensity={40} angle={0.55} penumbra={1} color="#B9C6DA" />
      <spotLight position={[2.4, 2, -2.8]} intensity={35} angle={0.55} penumbra={1} color="#E8E2D4" />
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={1.6} color="#FFFFFF" position={[0, 3, 2]} scale={[4, 1.2, 1]} />
        <Lightformer form="rect" intensity={0.8} color="#C9D3E2" position={[-3, 1, -1]} rotation-y={Math.PI / 2} scale={[3, 2, 1]} />
        <Lightformer form="ring" intensity={0.9} color="#E8E2D4" position={[3, 1.4, -1]} scale={1.4} />
      </Environment>

      <Cuerpo {...props} />
      {!reducido() && <Escaneo />}

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
        <ringGeometry args={[0.5, 0.505, 128]} />
        <meshBasicMaterial color="#454C59" toneMapped={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
        <ringGeometry args={[0.64, 0.642, 128]} />
        <meshBasicMaterial color="#2A3039" toneMapped={false} />
      </mesh>
      <ContactShadows position={[0, 0, 0]} opacity={0.5} scale={3} blur={2.4} far={1.2} color="#000000" />

      <Camara anclas={props.decorativo ? null : anclas} clave={props.decorativo ? null : clave} />
    </>
  );
}

class SinWebGL extends Component<{ children: ReactNode; respaldo: ReactNode }, { fallo: boolean }> {
  state = { fallo: false };
  static getDerivedStateFromError() {
    return { fallo: true };
  }
  render() {
    return this.state.fallo ? this.props.respaldo : this.props.children;
  }
}

function Cargando() {
  return (
    <Html center>
      <p className="whitespace-nowrap text-xs text-tenue">Cargando modelo 3D…</p>
    </Html>
  );
}

export default function Cuerpo3D(props: Props) {
  const [listo, setListo] = useState(false);
  const [capas, setCapas] = useState<Record<Capa, boolean>>({ piel: true, esqueleto: true, organos: true, circulacion: true });
  const clave = props.sistemas?.find((s) => s.id === props.seleccionado)?.clave;

  // Elegir un sistema enciende la capa donde vive, si estaba apagada.
  useEffect(() => {
    const c = clave ? CAPA_SISTEMA[clave] : undefined;
    if (c) setCapas((prev) => (prev[c] ? prev : { ...prev, [c]: true }));
  }, [clave]);

  return (
    <div className={`relative ${props.className ?? ""}`}>
      <SinWebGL
        respaldo={
          <p className="flex h-full items-center justify-center px-6 text-center text-sm text-tenue">
            Este equipo no puede mostrar la figura 3D. Usa la lista de sistemas.
          </p>
        }
      >
        <Canvas
          shadows
          dpr={[1, 2]}
          camera={{ position: [0, 1.15, 4.3], fov: 30, near: 0.1, far: 30 }}
          gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping }}
          onCreated={() => setListo(true)}
          className={`transition-opacity duration-700 ${listo ? "opacity-100" : "opacity-0"}`}
          aria-hidden={props.decorativo ? true : undefined}
        >
          <Suspense fallback={<Cargando />}>
            <Escena {...props} capas={capas} />
          </Suspense>
        </Canvas>
      </SinWebGL>

      {!props.decorativo && (
        <div
          role="group"
          aria-label="Capas del cuerpo"
          className="absolute right-3 top-3 z-10 flex flex-col gap-0.5 rounded-lg border border-linea bg-fondo/80 p-1 backdrop-blur"
        >
          {CAPAS.map(({ id, nombre, Icono }) => (
            <button
              key={id}
              type="button"
              aria-pressed={capas[id]}
              onClick={() => setCapas((prev) => ({ ...prev, [id]: !prev[id] }))}
              className={`flex h-8 items-center gap-2 rounded-md px-2.5 text-xs font-medium transition-colors ${
                capas[id] ? "bg-panel2 text-tinta" : "text-tenue hover:text-tinta"
              }`}
            >
              <Icono size={15} weight={capas[id] ? "duotone" : "regular"} aria-hidden />
              {nombre}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

useGLTF.preload(MODELO);
