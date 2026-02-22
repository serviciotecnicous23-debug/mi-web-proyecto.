import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Award, Download, CheckCircle, Clock, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useRef } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useAuth } from "@/hooks/use-auth";

export default function CertificadosPage() {
  const { user } = useAuth();
  const [selectedCert, setSelectedCert] = useState<any | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [verifying, setVerifying] = useState(false);
  const certRef = useRef<HTMLDivElement>(null);

  const { data: certificates = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/certificates/mine"],
    enabled: !!user,
  });

  const handleVerify = async () => {
    if (!verifyCode.trim()) return;
    setVerifying(true);
    setVerifyResult(null);
    try {
      const res = await fetch(`/api/certificates/verify/${verifyCode.trim()}`);
      if (res.ok) {
        setVerifyResult(await res.json());
      } else {
        setVerifyResult({ error: "Certificado no encontrado" });
      }
    } catch {
      setVerifyResult({ error: "Error al verificar" });
    }
    setVerifying(false);
  };

  const handlePrint = () => {
    if (!certRef.current) return;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>Certificado</title><style>
      body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #fff; font-family: 'Georgia', serif; }
      .cert { border: 8px double #c2841b; padding: 60px; max-width: 800px; text-align: center; }
      .cert h1 { color: #c2841b; font-size: 2.5em; margin: 0 0 10px; }
      .cert h2 { color: #333; font-size: 1.4em; margin: 10px 0; }
      .cert .name { font-size: 2em; color: #1a365d; margin: 20px 0; font-style: italic; }
      .cert .course { font-size: 1.5em; color: #c2841b; margin: 10px 0; }
      .cert .details { margin: 20px 0; color: #555; }
      .cert .code { font-size: 0.8em; color: #999; margin-top: 30px; }
      .cert .signature { margin-top: 40px; border-top: 1px solid #999; display: inline-block; padding-top: 10px; min-width: 200px; }
      @media print { body { margin: 0; } }
    </style></head><body><div class="cert">`);
    w.document.write(certRef.current.innerHTML);
    w.document.write(`</div></body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 500);
  };

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto p-6 text-center">
          <p>Inicia sesión para ver tus certificados</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-orange-600 flex items-center gap-2"><Award className="h-8 w-8" /> Mis Certificados</h1>
          <p className="text-muted-foreground">Certificados obtenidos por cursos completados</p>
        </div>

        {/* Certificate detail modal-like view */}
        {selectedCert && (
          <Card className="border-orange-300 border-2">
            <CardHeader className="flex flex-row justify-between items-start">
              <div>
                <CardTitle>Certificado</CardTitle>
                <CardDescription>Código: {selectedCert.verificationCode}</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handlePrint}><Download className="h-4 w-4 mr-1" /> Imprimir</Button>
                <Button variant="ghost" onClick={() => setSelectedCert(null)}>Cerrar</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div ref={certRef} className="text-center py-8">
                <h1 style={{ color: "#c2841b", fontSize: "2em", fontFamily: "Georgia, serif" }}>Ministerio de Educación Cristiana</h1>
                <h2 style={{ color: "#555", fontFamily: "Georgia, serif" }}>Certificado de Finalización</h2>
                <p style={{ margin: "30px 0 10px", color: "#555" }}>Se certifica que</p>
                <p className="name" style={{ fontSize: "1.8em", color: "#1a365d", fontStyle: "italic", fontFamily: "Georgia, serif" }}>
                  {selectedCert.studentName || user?.name || "Estudiante"}
                </p>
                <p style={{ color: "#555", margin: "10px 0" }}>ha completado satisfactoriamente el curso</p>
                <p className="course" style={{ fontSize: "1.4em", color: "#c2841b", fontWeight: "bold", fontFamily: "Georgia, serif" }}>
                  {selectedCert.courseName || "Curso"}
                </p>
                {selectedCert.grade !== null && selectedCert.grade !== undefined && (
                  <p style={{ color: "#555", margin: "10px 0" }}>Con calificación: <strong>{selectedCert.grade}/100</strong></p>
                )}
                <p style={{ color: "#555", margin: "10px 0" }}>
                  Fecha: {selectedCert.issuedAt ? format(new Date(selectedCert.issuedAt), "dd 'de' MMMM 'de' yyyy", { locale: es }) : "—"}
                </p>
                {selectedCert.teacherName && (
                  <div className="signature" style={{ marginTop: "40px", borderTop: "1px solid #999", display: "inline-block", paddingTop: "10px", minWidth: "200px" }}>
                    <p style={{ color: "#333" }}>{selectedCert.teacherName}</p>
                    <p style={{ color: "#999", fontSize: "0.8em" }}>Instructor</p>
                  </div>
                )}
                <p className="code" style={{ fontSize: "0.75em", color: "#999", marginTop: "30px" }}>
                  Código de Verificación: {selectedCert.verificationCode}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Certificates list */}
        {isLoading ? (
          <div className="text-center py-10"><Clock className="h-8 w-8 animate-spin text-muted-foreground mx-auto" /></div>
        ) : certificates.length === 0 ? (
          <Card>
            <CardContent className="text-center py-10">
              <Award className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Aún no tienes certificados.</p>
              <p className="text-sm text-muted-foreground">Completa un curso para obtener tu certificado.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {certificates.map((cert: any) => (
              <Card key={cert.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedCert(cert)}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-orange-100 dark:bg-orange-900/30 rounded-full p-2">
                      <Award className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{cert.courseName || "Curso"}</h3>
                      <p className="text-sm text-muted-foreground">{cert.teacherName && `Instructor: ${cert.teacherName}`}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">
                      {cert.issuedAt ? format(new Date(cert.issuedAt), "dd MMM yyyy", { locale: es }) : ""}
                    </span>
                    {cert.grade !== null && cert.grade !== undefined && (
                      <Badge variant="secondary">{cert.grade}/100</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
                    <CheckCircle className="h-3 w-3" /> Verificado
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Verification Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Search className="h-4 w-4" /> Verificar un Certificado</CardTitle>
            <CardDescription>Ingresa el código de verificación para comprobar la autenticidad de un certificado</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 max-w-md">
              <Input
                placeholder="Código de verificación"
                value={verifyCode}
                onChange={e => setVerifyCode(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleVerify()}
              />
              <Button onClick={handleVerify} disabled={verifying}>
                {verifying ? "Verificando..." : "Verificar"}
              </Button>
            </div>
            {verifyResult && (
              <div className="mt-4">
                {verifyResult.error ? (
                  <p className="text-red-500 text-sm">{verifyResult.error}</p>
                ) : (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-green-600 mb-2">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-semibold">Certificado Válido</span>
                    </div>
                    <p className="text-sm"><strong>Estudiante:</strong> {verifyResult.studentName}</p>
                    <p className="text-sm"><strong>Curso:</strong> {verifyResult.courseName}</p>
                    {verifyResult.grade !== null && <p className="text-sm"><strong>Calificación:</strong> {verifyResult.grade}/100</p>}
                    <p className="text-sm"><strong>Fecha:</strong> {verifyResult.issuedAt ? format(new Date(verifyResult.issuedAt), "dd/MM/yyyy") : "—"}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
