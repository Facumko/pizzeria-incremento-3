// reporteService.js — INC-03

import { getFacturas } from "./facturaService";

// Convierte un Date a formato LocalDateTime que Spring acepta: "2026-05-13T00:00:00"
const toLocalDateTime = (date) => {
  const pad = (n) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
};

// ── Pizzas más pedidas ──────────────────────────────────────────────────────
// GET /reportes/pizzas-mas-pedidas?start=&end=
// Devuelve array de { nombre, tipoCoccion, tamanio, total }
export const getPizzasMasPedidas = async (start, end) => {
  const params = new URLSearchParams({
    start: toLocalDateTime(start),
    end:   toLocalDateTime(end),
  });
  const res = await fetch(`/reportes/pizzas-mas-pedidas?${params}`, { credentials: "include" });
  if (!res.ok) throw new Error(`Error al obtener reporte (${res.status})`);
  const data = await res.json();
  // data: [ [nombre, tipoCoccion, tamanio, cantidad], ... ]
  return data.map((row) => ({
    nombre:      row[0],
    tipoCoccion: row[1],
    tamanio:     row[2],
    total:       Number(row[3]),
  }));
};

// ── Ingresos por período ────────────────────────────────────────────────────
// Usa GET /factura/traer y filtra en cliente para tener el detalle de facturas.
// Usado por IngresosPorPeriodo (necesita la tabla de facturas).
export const getResumenPeriodoConFacturas = async (start, end) => {
  const todasLasFacturas = await getFacturas();

  const filtradas = todasLasFacturas.filter((f) => {
    if (!f.fechaEmision) return false;
    const fecha = new Date(f.fechaEmision);
    return fecha >= start && fecha <= end;
  });

  const totalIngresos = filtradas.reduce((acc, f) => acc + f.total, 0);

  return {
    totalIngresos,
    cantidadPedidos: filtradas.length,
    facturas: filtradas,
  };
};

// ── Volumen de pedidos ──────────────────────────────────────────────────────
// Usa los endpoints reales del backend:
//   GET /reportes/ingresos?start=&end=
//   GET /reportes/pedidos-por-periodo?start=&end=
// Usado por VolumenPedidos (solo necesita KPIs, sin detalle de facturas).
export const getResumenPeriodo = async (start, end) => {
  const params = new URLSearchParams({
    start: toLocalDateTime(start),
    end:   toLocalDateTime(end),
  });

  const [incomeRes, ordersRes] = await Promise.all([
    fetch(`/reportes/ingresos?${params}`, { credentials: "include" }),
    fetch(`/reportes/pedidos-por-periodo?${params}`, { credentials: "include" }),
  ]);

  if (!incomeRes.ok) throw new Error(`Error al obtener ingresos (${incomeRes.status})`);
  if (!ordersRes.ok) throw new Error(`Error al obtener pedidos (${ordersRes.status})`);

  const income = await incomeRes.json(); // { desde, hasta, totalRecaudado, cantidadFacturas }
  const orders = await ordersRes.json(); // { desde, hasta, cantidadPedidos, montoTotal }

  return {
    totalIngresos:   income.totalRecaudado,
    cantidadPedidos: income.cantidadFacturas,
    // VolumenPedidos no usa la tabla de facturas, pero el componente
    // referencia resumen.facturas para el gráfico por día → array vacío.
    facturas: [],
  };
};