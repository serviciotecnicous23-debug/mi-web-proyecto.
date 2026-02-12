import React from 'react'
import { useParams } from 'wouter'
import { Layout } from '../components/Header'

export default function CursoDetalle() {
  const params = useParams<{ id: string }>()
  return <Layout><div style={{ padding: 24 }}><h1>Detalle del Curso {params?.id ?? ''}</h1></div></Layout>
}
