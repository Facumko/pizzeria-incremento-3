// reporteService.js — INC-03

import { getPedidos } from "./pedidoService";

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

// ── Ingresos y volumen por período ──────────────────────────────────────────
// Calculado sobre pedidos en estado "Facturado" (no requiere /factura/traer).
// Devuelve { totalIngresos, cantidadPedidos, facturas: [...] }
export const getResumenPeriodo = async (start, end) => {
  const pedidos = await getPedidos("Facturado");

  const filtrados = pedidos.filter((p) => {
    const fecha = new Date(p.fecha);
    return fecha >= start && fecha <= end;
  });

  const calcularTotal = (lineas = []) =>
    lineas.reduce((acc, l) => acc + l.precioUnitario * l.cantidad, 0);

  const totalIngresos = filtrados.reduce((acc, p) => acc + calcularTotal(p.lineas), 0);

  // Adaptamos los objetos para que los componentes los usen con la misma forma
  // que antes (campos usados: id, nroFactura, fechaEmision, pedido.cliente, pedido.nroPedido, total)
  const facturasAdaptadas = filtrados.map((p) => ({
    id:           p.id,
    nroFactura:   p.nroPedido,
    fechaEmision: p.fecha,
    total:        calcularTotal(p.lineas),
    pedido: {
      id:        p.id,
      nroPedido: p.nroPedido,
      cliente:   p.cliente,
    },
  }));

  return {
    totalIngresos,
    cantidadPedidos: filtrados.length,
    facturas: facturasAdaptadas,
  };
};