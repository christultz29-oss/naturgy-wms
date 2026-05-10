'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

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

      if (!error && data) {
        setProductos(data)
      }
    }

    fetchProductos()
  }, [])

  return (
    <main style={{
      minHeight: '100vh',
      background: '#020617',
      color: 'white',
      padding: '40px',
      fontFamily: 'Arial'
    }}>
      <h1 style={{
        color: '#eab308',
        fontSize: '48px',
        marginBottom: '30px'
      }}>
        NATURGY WMS v1.0
      </h1>

      <table style={{
        width: '100%',
        background: '#0f172a',
        borderRadius: '12px',
        padding: '20px'
      }}>
        <thead>
          <tr style={{ color: '#eab308' }}>
            <th>Código</th>
            <th>Nombre</th>
            <th>Categoría</th>
            <th>Ubicación</th>
          </tr>
        </thead>
        <tbody>
          {productos.map((p) => (
            <tr key={p.id}>
              <td>{p.codigo}</td>
              <td>{p.nombre}</td>
              <td>{p.categoria}</td>
              <td>{p.ubicacion}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  )
}
