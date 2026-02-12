import React, { useEffect, useState } from 'react'

type PostResponse = { received: string; echo: string; timestamp: string }

export default function Home() {
  const [message, setMessage] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [result, setResult] = useState<PostResponse | null>(null)

  useEffect(() => {
    fetch('/api/hello')
      .then((res) => res.json())
      .then((data) => setMessage(data.message))
      .catch(() => setMessage('No se pudo conectar al servidor'))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setResult(null)
    try {
      const res = await fetch('/api/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      })
      if (!res.ok) {
        const err = await res.json()
        setResult({ received: '', echo: err.error || 'Error', timestamp: '' })
        return
      }
      const data: PostResponse = await res.json()
      setResult(data)
      setText('')
    } catch (err) {
      setResult({ received: '', echo: 'Fallo de comunicación', timestamp: '' })
    }
  }

  return (
    <main>
      <h1>Bienvenido</h1>
      <p>Esta es una versión mínima del cliente creada para recuperar la estructura perdida.</p>
      <p><strong>Servidor:</strong> {message ?? 'Cargando...'}</p>

      <section style={{ marginTop: 16 }}>
        <h2>Enviar mensaje al servidor</h2>
        <form onSubmit={handleSubmit}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escribe algo..."
            aria-label="mensaje"
            style={{ padding: 8, width: '60%' }}
          />
          <button type="submit" style={{ marginLeft: 8, padding: '8px 12px' }}>Enviar</button>
        </form>

        {result && (
          <div style={{ marginTop: 12 }}>
            <div><strong>Echo:</strong> {result.echo}</div>
            <div><strong>Received:</strong> {result.received}</div>
            <div><strong>Timestamp:</strong> {result.timestamp}</div>
          </div>
        )}
      </section>
    </main>
  )
}
