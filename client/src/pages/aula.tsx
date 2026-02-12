import React from 'react'
import { useParams } from 'wouter'
import { Layout } from '../components/Header'

export default function AulaVirtual() {
  const params = useParams<{ id: string }>()
  return <Layout><div style={{ padding: 24 }}><h1>Aula Virtual {params?.id ?? ''}</h1></div></Layout>
}
