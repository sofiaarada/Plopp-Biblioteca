import React, { useState, useEffect, useMemo } from 'react';
import { BookOpen, Users, Library, Activity } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { api } from '../api';

interface BookRow { estado?: string; }
interface LoanRow { estado?: string; fecha_prestamo?: string; }

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const COLORS = ['#B8E628', '#1B2A4A', '#C4B5E0', '#9CC41E'];

export const DashboardView: React.FC = () => {
  const [totalLibros, setTotalLibros] = useState<number>(0);
  const [totalUsuarios, setTotalUsuarios] = useState<number>(0);
  const [prestamosActivos, setPrestamosActivos] = useState<number>(0);
  const [prestamosVencidos, setPrestamosVencidos] = useState<number>(0);
  const [disponibles, setDisponibles] = useState<number>(0);
  const [prestamos, setPrestamos] = useState<LoanRow[]>([]);
  const [libros, setLibros] = useState<BookRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api('/libros'), api('/usuarios'), api('/prestamos')])
      .then((values) => Promise.all(values.map((v) => v.json())))
      .then(([librosData, usuarios, prestamosData]) => {
        const librosArr = Array.isArray(librosData) ? (librosData as BookRow[]) : [];
        const prestamosArr = Array.isArray(prestamosData) ? (prestamosData as LoanRow[]) : [];

        setLibros(librosArr);
        setPrestamos(prestamosArr);
        setTotalLibros(librosArr.length);
        setDisponibles(librosArr.filter((l) => l.estado === 'Disponible').length);
        setTotalUsuarios(Array.isArray(usuarios) ? usuarios.length : 0);
        setPrestamosActivos(prestamosArr.filter((p) => p.estado === 'Activo').length);
        setPrestamosVencidos(prestamosArr.filter((p) => p.estado === 'Vencido').length);
      })
      .catch((error) => {
        console.error('Error al obtener estadísticas del dashboard:', error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const prestamosPorMes = useMemo(() => {
    const conteo = Array(12).fill(0);
    prestamos.forEach((p) => {
      if (!p.fecha_prestamo) return;
      const mes = new Date(p.fecha_prestamo).getMonth();
      if (!Number.isNaN(mes) && mes >= 0) conteo[mes] += 1;
    });
    return MESES.map((mes, i) => ({ mes, prestamos: conteo[i] }));
  }, [prestamos]);

  const librosPorEstado = useMemo(() => {
    const grupos: Record<string, number> = {};
    libros.forEach((l) => {
      const estado = l.estado || 'Sin estado';
      grupos[estado] = (grupos[estado] || 0) + 1;
    });
    return Object.entries(grupos).map(([name, value]) => ({ name, value }));
  }, [libros]);

  const stats = [
    { label: 'Total Libros', value: totalLibros, icon: BookOpen, color: 'var(--primary)' },
    { label: 'Libros Disponibles', value: disponibles, icon: Library, color: '#9CC41E' },
    { label: 'Usuarios Registrados', value: totalUsuarios, icon: Users, color: 'var(--success)' },
    { label: 'Préstamos Activos', value: prestamosActivos, icon: Activity, color: 'var(--warning)' },
    { label: 'Préstamos Vencidos', value: prestamosVencidos, icon: Activity, color: 'var(--danger)' },
  ];

  return (
    <div className="view-container">
      <div className="page-header">
        <h2>Resumen General</h2>
      </div>

      <div className="stats-grid">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: `${stat.color}18`, color: stat.color }}>
                <Icon size={22} />
              </div>
              <div>
                <p className="stat-label">{stat.label}</p>
                <h3 className="stat-value">{loading ? '...' : stat.value}</h3>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20, marginTop: 20 }}>
        <div className="chart-card">
          <h3>Préstamos por mes</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={prestamosPorMes}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="mes" stroke="var(--text-muted)" fontSize={12} />
              <YAxis stroke="var(--text-muted)" fontSize={12} allowDecimals={false} />
              <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }} />
              <Bar dataKey="prestamos" fill="#B8E628" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Libros por estado</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={librosPorEstado} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                {librosPorEstado.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
