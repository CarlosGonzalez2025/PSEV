'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
    getFirestore, doc, getDoc, addDoc, collection, serverTimestamp,
} from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';
import {
    ShieldCheck, FileText, CheckCircle2, Calendar, AlertTriangle,
    Send, User, Briefcase, ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

// ─── Firebase init (public — no auth) ────────────────────────────────────────
function getPublicFirestore() {
    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    return getFirestore(app);
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface PoliticaData {
    titulo?: string;
    contenidoHtml?: string;
    imagenUrl?: string;
    version?: string;
    estado?: string;
    fechaAprobacion?: string;
    fechaVencimiento?: string;
    actualizadoPor?: string;
    empresaId?: string;
}

interface EmpresaData {
    razonSocial?: string;
    nombre?: string;
    logoUrl?: string;
    nit?: string;
    ciudad?: string;
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function PoliticaPublicaPage() {
    const params = useParams();
    const empresaId = typeof params.empresaId === 'string' ? params.empresaId : '';

    const [empresa, setEmpresa] = useState<EmpresaData | null>(null);
    const [politica, setPolitica] = useState<PoliticaData | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    // Signing form state
    const [nombre, setNombre] = useState('');
    const [cargo, setCargo] = useState('');
    const [aceptado, setAceptado] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [signed, setSigned] = useState(false);
    const [error, setError] = useState('');

    // ─── Load data ────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!empresaId) return;
        const db = getPublicFirestore();

        Promise.all([
            getDoc(doc(db, 'empresas', empresaId)),
            getDoc(doc(db, 'empresas', empresaId, 'politicasSeguridadVial', 'actual')),
        ]).then(([empSnap, politicaSnap]) => {
            if (!empSnap.exists() || !politicaSnap.exists()) {
                setNotFound(true);
            } else {
                setEmpresa(empSnap.data() as EmpresaData);
                setPolitica(politicaSnap.data() as PoliticaData);
            }
        }).catch(() => setNotFound(true))
          .finally(() => setLoading(false));
    }, [empresaId]);

    // ─── Submit signature ─────────────────────────────────────────────────────
    async function handleSign() {
        setError('');
        if (!nombre.trim() || !cargo.trim()) {
            setError('Por favor ingresa tu nombre y cargo.');
            return;
        }
        if (!aceptado) {
            setError('Debes aceptar haber leído la política para firmar.');
            return;
        }
        setSubmitting(true);
        try {
            const db = getPublicFirestore();
            await addDoc(collection(db, 'empresas', empresaId, 'difusiones_politica'), {
                nombre: nombre.trim(),
                cargo: cargo.trim(),
                aceptado: true,
                metodo: 'URL_Publica',
                fechaAceptacion: new Date().toISOString(),
                createdAt: serverTimestamp(),
            });
            setSigned(true);
        } catch {
            setError('Ocurrió un error al registrar tu firma. Intenta de nuevo.');
        } finally {
            setSubmitting(false);
        }
    }

    // ─── Loading ──────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center gap-3">
                    <div className="size-12 rounded-2xl bg-blue-200" />
                    <div className="h-4 w-32 rounded bg-slate-200" />
                </div>
            </div>
        );
    }

    // ─── Not Found ────────────────────────────────────────────────────────────
    if (notFound || !politica) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center space-y-4">
                    <AlertTriangle className="size-12 text-amber-400 mx-auto" />
                    <h1 className="text-xl font-black text-gray-900 uppercase">Política no disponible</h1>
                    <p className="text-gray-500 text-sm">
                        Esta empresa no tiene una política de seguridad vial publicada o el enlace es inválido.
                    </p>
                </div>
            </div>
        );
    }

    const empresaNombre = empresa?.razonSocial || empresa?.nombre || 'Mi Empresa';

    // ─── Signed confirmation ───────────────────────────────────────────────────
    if (signed) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center space-y-5">
                    <div className="size-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                        <CheckCircle2 className="size-10 text-emerald-500" />
                    </div>
                    <h1 className="text-2xl font-black text-gray-900 uppercase">¡Firma Registrada!</h1>
                    <p className="text-gray-500 text-sm leading-relaxed">
                        Gracias, <strong className="text-gray-800">{nombre}</strong>. Tu firma digital
                        ha sido registrada y notificada al equipo PESV de{' '}
                        <strong className="text-gray-800">{empresaNombre}</strong>.
                    </p>
                    <Badge className="bg-emerald-100 text-emerald-700 border-none text-sm px-4 py-1.5">
                        {new Date().toLocaleDateString('es-CO', { dateStyle: 'long' })}
                    </Badge>
                    <p className="text-xs text-gray-400 italic">Puedes cerrar esta ventana.</p>
                </div>
            </div>
        );
    }

    // ─── Main View ────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 shadow-sm px-4 py-4 sticky top-0 z-10">
                <div className="max-w-3xl mx-auto flex items-center gap-3">
                    {empresa?.logoUrl ? (
                        <img src={empresa.logoUrl} alt={empresaNombre} className="h-10 w-auto object-contain rounded-lg" />
                    ) : (
                        <div className="size-10 bg-blue-600 rounded-xl flex items-center justify-center shrink-0">
                            <ShieldCheck className="size-6 text-white" />
                        </div>
                    )}
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-tight">
                            Política de Seguridad Vial
                        </p>
                        <p className="text-sm font-black text-gray-800 leading-tight">
                            {empresaNombre}
                        </p>
                    </div>
                    {politica.estado === 'Publicada' && (
                        <Badge className="ml-auto bg-emerald-100 text-emerald-700 border-none text-xs font-bold shrink-0">
                            Vigente
                        </Badge>
                    )}
                </div>
            </header>

            {/* Body */}
            <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">

                {/* Meta info badges */}
                <div className="flex flex-wrap gap-2">
                    {politica.version && (
                        <Badge className="bg-blue-100 text-blue-700 border-none text-xs font-bold">
                            <FileText className="size-3 mr-1" /> Versión {politica.version}
                        </Badge>
                    )}
                    {politica.fechaAprobacion && (
                        <Badge className="bg-gray-100 text-gray-600 border-none text-xs font-bold">
                            <Calendar className="size-3 mr-1" />
                            Aprobada: {new Date(politica.fechaAprobacion).toLocaleDateString('es-CO')}
                        </Badge>
                    )}
                    {politica.fechaVencimiento && (
                        <Badge className="bg-amber-100 text-amber-700 border-none text-xs font-bold">
                            Vigente hasta: {new Date(politica.fechaVencimiento).toLocaleDateString('es-CO')}
                        </Badge>
                    )}
                </div>

                {/* Policy image if available */}
                {politica.imagenUrl && (
                    <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
                        <div className="p-4 border-b border-gray-100 flex items-center gap-2">
                            <FileText className="size-4 text-blue-500" />
                            <span className="text-sm font-bold text-gray-700">Documento oficial de la política</span>
                            <a
                                href={politica.imagenUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-auto text-xs text-blue-500 flex items-center gap-1 hover:underline"
                            >
                                Abrir en nueva pestaña <ExternalLink className="size-3" />
                            </a>
                        </div>
                        <img
                            src={politica.imagenUrl}
                            alt="Política de Seguridad Vial"
                            className="w-full object-contain max-h-[600px]"
                        />
                    </div>
                )}

                {/* Policy text content */}
                {politica.contenidoHtml && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                            <h2 className="font-black text-gray-800 text-base uppercase tracking-tight">
                                {politica.titulo || 'Política de Seguridad Vial'}
                            </h2>
                        </div>
                        <div className="px-6 py-6">
                            <p className="whitespace-pre-wrap text-gray-700 text-[15px] leading-relaxed">
                                {politica.contenidoHtml}
                            </p>
                        </div>
                    </div>
                )}

                {/* Signing section */}
                <div className="bg-white rounded-2xl shadow-sm border border-blue-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-blue-100 bg-blue-50 flex items-center gap-3">
                        <Send className="size-5 text-blue-600" />
                        <div>
                            <h2 className="font-black text-blue-800 text-sm uppercase tracking-tight">
                                Firma Digital de Divulgación
                            </h2>
                            <p className="text-xs text-blue-600 mt-0.5">
                                Confirma que has leído y comprendido esta política de seguridad vial
                            </p>
                        </div>
                    </div>
                    <div className="px-6 py-6 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold uppercase text-gray-500 tracking-widest flex items-center gap-1">
                                    <User className="size-3" /> Nombre Completo *
                                </label>
                                <Input
                                    value={nombre}
                                    onChange={e => setNombre(e.target.value)}
                                    placeholder="Tu nombre completo"
                                    className="border-gray-200"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold uppercase text-gray-500 tracking-widest flex items-center gap-1">
                                    <Briefcase className="size-3" /> Cargo *
                                </label>
                                <Input
                                    value={cargo}
                                    onChange={e => setCargo(e.target.value)}
                                    placeholder="Tu cargo en la empresa"
                                    className="border-gray-200"
                                />
                            </div>
                        </div>

                        <label className="flex items-start gap-3 cursor-pointer group">
                            <Checkbox
                                checked={aceptado}
                                onCheckedChange={v => setAceptado(!!v)}
                                className="mt-0.5 border-blue-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                            />
                            <span className="text-sm text-gray-600 leading-relaxed group-hover:text-gray-800 transition-colors">
                                He leído y comprendido la <strong>Política de Seguridad Vial</strong> de{' '}
                                <strong>{empresaNombre}</strong> y me comprometo a cumplirla.
                            </span>
                        </label>

                        {error && (
                            <p className="text-sm text-red-500 flex items-center gap-1.5">
                                <AlertTriangle className="size-4 shrink-0" /> {error}
                            </p>
                        )}

                        <Button
                            onClick={handleSign}
                            disabled={submitting}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black uppercase h-12 text-sm tracking-wide gap-2 shadow-lg shadow-blue-200"
                        >
                            <CheckCircle2 className="size-5" />
                            {submitting ? 'Registrando firma...' : 'Confirmar que he leído la política'}
                        </Button>

                        <p className="text-[11px] text-gray-400 text-center">
                            Tu firma digital quedará registrada con fecha, nombre y cargo en el sistema PESV de {empresaNombre}.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <footer className="text-center text-xs text-gray-400 pb-4">
                    <p>Gestionado por <strong className="text-gray-600">RoadWise 360</strong> — Sistema PESV</p>
                    <p>Resolución 40595 de 2022 · Ministerio de Transporte de Colombia</p>
                </footer>
            </main>
        </div>
    );
}
