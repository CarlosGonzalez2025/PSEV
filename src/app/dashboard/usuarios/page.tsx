'use client';

import { useState, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, collectionGroup } from 'firebase/firestore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from '@/hooks/use-toast';
import { createInvitationAction, updateUserAction } from '@/actions/usuarios/membership';
import {
  ROLES_CONFIG,
  getRolesDisponibles,
  puedeCrearUsuarios,
  type RolUsuario,
} from '@/types/usuarios';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  Search,
  Copy,
  Check,
  UserCog,
  ShieldCheck,
  ShieldX,
  Users,
  Mail,
  Link2,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

// ─── Schemas ───────────────────────────────────────────────────────────────
const inviteSchema = z.object({
  nombreCompleto: z.string().min(3, 'Nombre requerido (mín. 3 caracteres)'),
  email: z.string().email('Correo inválido'),
  rol: z.string().min(1, 'Selecciona un rol'),
  empresaId: z.string().optional(),
});

// ─── Helpers ────────────────────────────────────────────────────────────────
function RolBadge({ rol }: { rol: string }) {
  const cfg = ROLES_CONFIG[rol as RolUsuario];
  if (!cfg) return <Badge variant="outline" className="text-[8px]">{rol}</Badge>;

  const colorMap: Record<string, string> = {
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
    primary: 'bg-primary/10 text-primary border-primary/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    green: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    slate: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  };

  return (
    <Badge className={`border text-[8px] uppercase font-black ${colorMap[cfg.color]}`}>
      {cfg.label}
    </Badge>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <Button variant="outline" size="sm" onClick={handleCopy} className="border-border-dark gap-2 shrink-0">
      {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
      {copied ? 'Copiado' : 'Copiar'}
    </Button>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function UsuariosPage() {
  const firestore = useFirestore();
  const { profile } = useUser();
  const isSuperadmin = profile?.rol === 'Superadmin';
  const empresaId = profile?.empresaId;

  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activationUrl, setActivationUrl] = useState<string | null>(null);
  const [invitedName, setInvitedName] = useState('');
  const [invitedEmail, setInvitedEmail] = useState('');
  const [emailWarning, setEmailWarning] = useState<string | null>(null);

  // ─── Data: usuarios de la empresa ─────────────────────────────────────────
  const usuariosRef = useMemoFirebase(() => {
    if (!firestore) return null;
    if (isSuperadmin) {
      // Superadmin ve TODOS los usuarios del sistema sin ordenar aquí 
      // para evitar problemas de índices compuestos no creados
      return query(collectionGroup(firestore, 'usuarios'));
    }
    
    if (!empresaId || empresaId === 'system') return null;
    // Usuarios normales ven los de su empresa
    return query(
      collection(firestore, 'empresas', empresaId, 'usuarios'),
      orderBy('nombreCompleto')
    );
  }, [firestore, empresaId, isSuperadmin]);

  const { data: usuarios, isLoading } = useCollection(usuariosRef);

  // ─── Data: empresas (solo superadmin) ──────────────────────────────────────
  const empresasRef = useMemoFirebase(() => {
    if (!firestore || !isSuperadmin) return null;
    return query(collection(firestore, 'empresas'), orderBy('razonSocial'));
  }, [firestore, isSuperadmin]);

  const { data: empresas } = useCollection(empresasRef);

  // ─── Filtro ────────────────────────────────────────────────────────────────
  const filteredUsuarios = useMemo(() => {
    if (!usuarios) return [];
    const arr = usuarios.filter(u =>
      u.nombreCompleto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.rol?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (isSuperadmin && u.empresaId?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Ordenar alfabéticamente en cliente (necesario por collectionGroup sin orderBy local)
    return arr.sort((a, b) => (a.nombreCompleto || '').localeCompare(b.nombreCompleto || ''));
  }, [usuarios, searchTerm, isSuperadmin]);

  // ─── Stats ─────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    if (!usuarios) return { total: 0, activos: 0, inactivos: 0 };
    const activos = usuarios.filter(u => u.estado === 'Activo').length;
    return { total: usuarios.length, activos, inactivos: usuarios.length - activos };
  }, [usuarios]);

  const rolesDisponibles = profile?.rol ? getRolesDisponibles(profile.rol as RolUsuario) : [];
  const canCreate = profile?.rol ? puedeCrearUsuarios(profile.rol as RolUsuario) : false;

  // ─── Form ──────────────────────────────────────────────────────────────────
  const form = useForm<z.infer<typeof inviteSchema>>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { nombreCompleto: '', email: '', rol: '', empresaId: empresaId || '' },
  });

  async function onSubmit(values: z.infer<typeof inviteSchema>) {
    const targetEmpresaId = isSuperadmin ? (values.empresaId || '') : (empresaId || '');
    if (!targetEmpresaId) {
      form.setError('empresaId', { message: 'Selecciona la empresa' });
      return;
    }
    if (!profile?.id) return;

    const result = await createInvitationAction({
      nombreCompleto: values.nombreCompleto,
      email: values.email,
      rol: values.rol as RolUsuario,
      empresaId: targetEmpresaId,
      createdBy: profile.id,
    });

    if (!result.success) {
      toast({ variant: 'destructive', title: 'Error', description: result.message });
      return;
    }

    setActivationUrl(result.activationUrl!);
    setInvitedName(values.nombreCompleto);
    setInvitedEmail(values.email);
    // Si hay mensaje = el correo falló pero la invitación está creada
    setEmailWarning(result.message || null);
    form.reset();

    if (result.message) {
      toast({ variant: 'destructive', title: 'Correo no enviado', description: result.message });
    } else {
      toast({ title: '¡Invitación enviada!', description: `Correo enviado a ${values.email}` });
    }
  }

  // ─── Toggle estado usuario ─────────────────────────────────────────────────
  async function toggleEstado(u: any) {
    if (!profile?.id || !empresaId) return;
    const nuevoEstado = u.estado === 'Activo' ? 'Inactivo' : 'Activo';
    const result = await updateUserAction({
      targetUid: u.id,
      empresaId,
      updates: { estado: nuevoEstado },
      updatedBy: profile.id,
    });
    if (result.success) {
      toast({ title: `Usuario ${nuevoEstado === 'Activo' ? 'activado' : 'desactivado'}` });
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.message });
    }
  }

  // ─── Guard ─────────────────────────────────────────────────────────────────
  if (!canCreate && profile?.rol !== 'Auditor') {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
        <ShieldX className="size-12 text-destructive" />
        <h2 className="text-foreground font-black text-xl uppercase">Acceso Restringido</h2>
        <p className="text-text-secondary text-sm">No tienes permisos para gestionar usuarios.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight uppercase italic">
            Gestión de Usuarios
          </h1>
          <p className="text-text-secondary mt-1">
            Control de acceso y roles del sistema PESV
          </p>
        </div>
        {canCreate && (
          <Button
            className="bg-primary font-black uppercase h-11 px-8 shadow-lg shadow-primary/20"
            onClick={() => { setActivationUrl(null); setOpen(true); }}
          >
            <Plus className="size-5 mr-2" /> Invitar Usuario
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-surface-dark border-border-dark">
          <CardHeader className="pb-2">
            <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">
              <Users className="size-3 inline mr-1" /> Total Usuarios
            </p>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-foreground">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="bg-surface-dark border-border-dark">
          <CardHeader className="pb-2">
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">
              <ShieldCheck className="size-3 inline mr-1" /> Activos
            </p>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-emerald-500">{stats.activos}</div>
          </CardContent>
        </Card>
        <Card className="bg-surface-dark border-border-dark">
          <CardHeader className="pb-2">
            <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">
              Roles Disponibles
            </p>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-primary">{rolesDisponibles.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de usuarios */}
      <Card className="bg-surface-dark border-border-dark overflow-hidden">
        <CardHeader className="border-b border-white/5 bg-white/[0.02] flex flex-row items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-text-secondary" />
            <Input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-background-dark border-border-dark pl-9"
              placeholder="Buscar por nombre, correo o rol..."
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border-dark bg-white/5">
                <TableHead className="text-[10px] font-black uppercase">Usuario</TableHead>
                <TableHead className="text-[10px] font-black uppercase">Correo</TableHead>
                <TableHead className="text-[10px] font-black uppercase">Rol</TableHead>
                {isSuperadmin && <TableHead className="text-[10px] font-black uppercase">Empresa</TableHead>}
                <TableHead className="text-[10px] font-black uppercase text-center">Estado</TableHead>
                {canCreate && <TableHead className="text-right text-[10px] font-black uppercase">Acciones</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-20">
                    <Skeleton className="h-20 w-full" />
                  </TableCell>
                </TableRow>
              ) : filteredUsuarios.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-20 italic text-text-secondary">
                    Sin usuarios registrados.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsuarios.map(u => (
                  <TableRow key={u.id} className="border-border-dark hover:bg-white/5 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-sm uppercase italic">
                          {u.nombreCompleto?.substring(0, 2) || '?'}
                        </div>
                        <span className="text-sm font-bold text-foreground uppercase tracking-tight">
                          {u.nombreCompleto}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-text-secondary flex items-center gap-2">
                        <Mail className="size-3" /> {u.email}
                      </span>
                    </TableCell>
                    <TableCell>
                      <RolBadge rol={u.rol} />
                    </TableCell>
                    {isSuperadmin && (
                      <TableCell>
                        <span className="text-sm font-medium text-foreground">
                          {empresas?.find(e => e.id === u.empresaId)?.razonSocial || u.empresaId || 'Global'}
                        </span>
                      </TableCell>
                    )}
                    <TableCell className="text-center">
                      {u.estado === 'Activo' ? (
                        <Badge className="bg-emerald-500/10 text-emerald-500 border-none text-[8px] uppercase gap-1">
                          <ShieldCheck className="size-3" /> Activo
                        </Badge>
                      ) : (
                        <Badge className="bg-destructive/10 text-destructive border-none text-[8px] uppercase gap-1">
                          <ShieldX className="size-3" /> Inactivo
                        </Badge>
                      )}
                    </TableCell>
                    {canCreate && (
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          title={u.estado === 'Activo' ? 'Desactivar usuario' : 'Activar usuario'}
                          className={`${u.estado === 'Activo' ? 'text-emerald-500 hover:text-destructive' : 'text-destructive hover:text-emerald-500'}`}
                          onClick={() => toggleEstado(u)}
                        >
                          {u.estado === 'Activo'
                            ? <ToggleRight className="size-5" />
                            : <ToggleLeft className="size-5" />}
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Mapa de roles */}
      <Card className="bg-surface-dark border-border-dark">
        <CardHeader className="border-b border-white/5 pb-4">
          <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest flex items-center gap-2">
            <UserCog className="size-3.5" /> Definición de Roles del Sistema
          </p>
        </CardHeader>
        <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.entries(ROLES_CONFIG)
            .filter(([rol]) => rol !== 'Superadmin')
            .map(([rol, cfg]) => (
              <div
                key={rol}
                className="flex items-start gap-3 p-3 rounded-xl border border-border-dark bg-white/[0.02]"
              >
                <RolBadge rol={rol} />
                <div>
                  <p className="text-xs font-bold text-foreground">{cfg.label}</p>
                  <p className="text-[11px] text-text-secondary mt-0.5">{cfg.descripcion}</p>
                </div>
              </div>
            ))}
        </CardContent>
      </Card>

      {/* Dialog crear invitación */}
      <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) setActivationUrl(null); }}>
        <DialogContent className="max-w-lg bg-surface-dark border-border-dark text-foreground p-0 overflow-hidden">
          <DialogHeader className="p-6 bg-primary/10 border-b border-border-dark">
            <DialogTitle className="text-xl font-black uppercase italic">Invitar Nuevo Usuario</DialogTitle>
            <DialogDescription className="text-text-secondary">
              Se generará un enlace de activación único. El usuario lo usará para crear su contraseña.
            </DialogDescription>
          </DialogHeader>

          {activationUrl ? (
            /* ── Paso 2: confirmación ── */
            <div className="p-6 space-y-5">
              {emailWarning ? (
                /* Correo falló */
                <div className="flex items-center justify-center size-16 rounded-2xl bg-amber-500/10 text-amber-400 mx-auto">
                  <Mail className="size-8" />
                </div>
              ) : (
                /* Correo enviado */
                <div className="flex items-center justify-center size-16 rounded-2xl bg-emerald-500/10 text-emerald-500 mx-auto">
                  <Mail className="size-8" />
                </div>
              )}

              <div className="text-center">
                {emailWarning ? (
                  <>
                    <p className="text-amber-400 font-black text-lg">Invitación creada</p>
                    <p className="text-text-secondary text-sm mt-1">
                      El correo <strong className="text-foreground">no pudo enviarse</strong>. Copia el enlace y compártelo manualmente con{' '}
                      <strong className="text-foreground">{invitedName}</strong>.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-emerald-400 font-black text-lg">¡Correo enviado!</p>
                    <p className="text-text-secondary text-sm mt-1">
                      Se envió un correo de invitación a{' '}
                      <strong className="text-foreground">{invitedEmail}</strong>.<br />
                      El enlace expira en 7 días.
                    </p>
                  </>
                )}
              </div>

              {/* Enlace de respaldo — siempre visible */}
              <div>
                <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-2">
                  <Link2 className="size-3 inline mr-1" /> Enlace de activación (respaldo)
                </p>
                <div className="flex items-center gap-2 bg-background-dark rounded-xl border border-border-dark p-3">
                  <code className="text-[10px] text-primary flex-1 break-all leading-relaxed">
                    {activationUrl}
                  </code>
                  <CopyButton text={activationUrl} />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-primary font-black uppercase h-11"
                  onClick={() => { setActivationUrl(null); setEmailWarning(null); }}
                >
                  <Plus className="size-4 mr-2" /> Nueva Invitación
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-border-dark h-11"
                  onClick={() => setOpen(false)}
                >
                  Cerrar
                </Button>
              </div>
            </div>
          ) : (
            /* ── Paso 1: formulario ── */
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar"
              >
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="nombreCompleto" render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Nombre Completo</FormLabel>
                      <FormControl>
                        <Input {...field} className="bg-background-dark" placeholder="Ej. María García López" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Correo Electrónico</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" className="bg-background-dark" placeholder="usuario@empresa.com" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="rol" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rol en el Sistema</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-background-dark">
                          <SelectValue placeholder="Selecciona un rol..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {rolesDisponibles.map(rol => (
                          <SelectItem key={rol} value={rol}>
                            <div className="flex flex-col">
                              <span className="font-bold">{ROLES_CONFIG[rol].label}</span>
                              <span className="text-[10px] text-muted-foreground">{ROLES_CONFIG[rol].descripcion}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* Selector de empresa — solo superadmin */}
                {isSuperadmin && (
                  <FormField control={form.control} name="empresaId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Empresa</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background-dark">
                            <SelectValue placeholder="Selecciona la empresa..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {empresas?.map(emp => (
                            <SelectItem key={emp.id} value={emp.id}>
                              {emp.razonSocial || emp.id}
                            </SelectItem>
                          ))}
                          <SelectItem value="system">DateNova Global (DateNova)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                )}

                <Button
                  type="submit"
                  disabled={form.formState.isSubmitting}
                  className="w-full bg-primary font-black uppercase h-12 shadow-xl shadow-primary/20"
                >
                  {form.formState.isSubmitting ? 'Generando...' : 'Generar Enlace de Activación'}
                </Button>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
