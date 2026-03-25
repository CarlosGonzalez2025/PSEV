'use client';

/**
 * /admin — Panel Maestro SaaS (solo Superadmin)
 *
 * Este page se declara como Client Component para poder usar
 * `next/dynamic({ ssr: false })` sin que Next 15 intente prerenderizar
 * el panel admin durante el build.
 */
import dynamic from 'next/dynamic';

const AdminPanel = dynamic(() => import('./AdminPanel'), { ssr: false });

export default function AdminPage() {
  return <AdminPanel />;
}
