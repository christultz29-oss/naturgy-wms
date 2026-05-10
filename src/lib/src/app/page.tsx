'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Package, AlertTriangle, CheckCircle } from 'lucide-react'

type Producto = {
  id: number
  codigo: string
  nombre: string
  categoria: string
  ubicacion: string
  stock_bodega: number
  stock_area: number
  stock_minimo: number
}

export default function Home() {
  const [productos, setProductos] = useState<Producto[]>([])

  useEffect(() => {
    const fetchProductos = async () => {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .order('id')

      if (!error && data) {
        setProductos(data)
      }
    }

    fetchProductos()
  }, [])

  const bajoMinimo = productos.filter(
    (p) => p.stock_bodega + p.stock_area <= p.stock_minimo
  ).length

  const totalProductos = productos.length
  const stockOk = totalProductos - bajoMinimo

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom right, #020617, #0f172a)',
        color: 'white',
        padding: '40px'
      }}
    >
      <h1
        style={{
          fontSize: '52px',
          color: '#eab308',
          marginBottom: '10px'
        }}
      >
        NATURGY WMS v1.0
      </h1>

      <p style={{ color: '#94a3b8', marginBottom: '40px' }}>
        Dashboard de Inventario y Control Logístico
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '20px',
          marginBottom: '40px'
        }}
      >
        <Card
          title="Total Productos"
          value={totalProductos}
          icon={<Package />}
        />
        <Card
          title="Bajo Mínimo"
          value={bajoMinimo}
          icon={<AlertTriangle />}
        />
        <Card
          title="Stock OK"
          value={stockOk}
          icon={<CheckCircle />}
        />
      </div>

      <div
        style={{
          background: '#0f172a',
          padding: '25px',
          borderRadius: '18px',
          overflowX: 'auto',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse'
          }}
        >
          <thead>
            <tr style={{ color: '#eab308', textAlign: 'left' }}>
              <th style={thStyle}>Código</th>
              <th style={thStyle}>Nombre</th>
              <th style={thStyle}>Categoría</th>
              <th style={thStyle}>Ubicación</th>
              <th style={thStyle}>Total Stock</th>
            </tr>
          </thead>

          <tbody>
            {productos.map((p) => (
              <tr key={p.id} style={{ borderTop: '1px solid #1e293b' }}>
                <td style={tdStyle}>{p.codigo}</td>
                <td style={tdStyle}>{p.nombre}</td>
                <td style={tdStyle}>{p.categoria}</td>
                <td style={tdStyle}>{p.ubicacion}</td>
                <td style={tdStyle}>
                  {p.stock_bodega + p.stock_area}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}

function Card({
  title,
  value,
  icon
}: {
  title: string
  value: number
  icon: React.ReactNode
}) {
  return (
    <div
      style={{
        background: '#0f172a',
        padding: '25px',
        borderRadius: '18px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.25)'
      }}
    >
      <div style={{ color: '#eab308', marginBottom: '10px' }}>{icon}</div>
      <p style={{ color: '#94a3b8', marginBottom: '8px' }}>{title}</p>
      <h2 style={{ fontSize: '36px', margin: 0 }}>{value}</h2>
    </div>
  )
}

const thStyle = {
  padding: '14px',
  borderBottom: '1px solid #334155'
}

const tdStyle = {
  padding: '14px',
  color: '#e2e8f0'
}
