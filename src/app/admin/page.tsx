/**
 * /admin — Panel Maestro SaaS (solo Superadmin)
 *
 * Se importa con ssr: false para evitar que Next.js intente prerenderizar
 * el componente en build time, donde Firebase no está inicializado.
 */
import dynamic from 'next/dynamic';

const AdminPanel = dynamic(() => import('./AdminPanel'), { ssr: false });

export default function AdminPage() {
  return <AdminPanel />;
}
