// useFechas.js — Hook compartido para manejo de rangos de fechas en reportes

import { useState } from "react";

const hoy = () => {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
};

const inicioHoy = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const hace = (dias) => {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  d.setHours(0, 0, 0, 0);
  return d;
};

const inicioMes = () => {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const PRESETS_DEF = [
  { id: "hoy",    label: "Hoy" },
  { id: "semana", label: "Últimos 7 días" },
  { id: "mes",    label: "Este mes" },
  { id: "30d",    label: "Últimos 30 días" },
];

export const useFechas = () => {
  const [start, setStart] = useState(hace(7));
  const [end,   setEnd]   = useState(hoy());
  const [preset, setPresetState] = useState("semana");

  const setPreset = (id) => {
    setPresetState(id);
    switch (id) {
      case "hoy":
        setStart(inicioHoy());
        setEnd(hoy());
        break;
      case "semana":
        setStart(hace(7));
        setEnd(hoy());
        break;
      case "mes":
        setStart(inicioMes());
        setEnd(hoy());
        break;
      case "30d":
        setStart(hace(30));
        setEnd(hoy());
        break;
      default:
        break;
    }
  };

  return {
    start, setStart,
    end,   setEnd,
    preset,
    setPreset,
    PRESETS: PRESETS_DEF,
  };
};