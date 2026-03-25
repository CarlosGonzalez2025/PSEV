import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = 'RoadWise 360 <info@datnova.io>';

// ─── Tipos ───────────────────────────────────────────────────────────────────
interface InvitationEmailPayload {
  to: string;
  nombreCompleto: string;
  rolLabel: string;
  empresaId: string;
  activationUrl: string;
  expiresAt: string; // ISO string
  invitadoPor?: string;
}

// ─── Template HTML ────────────────────────────────────────────────────────────
function invitationHtml(p: InvitationEmailPayload): string {
  const expDate = new Date(p.expiresAt).toLocaleDateString('es-CO', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invitación RoadWise 360</title>
</head>
<body style="margin:0;padding:0;background-color:#F4F6F9;font-family:'Segoe UI',Arial,sans-serif;">

  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F4F6F9;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background-color:#0A0A14;border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align:center;">
                    <div style="display:inline-block;background:rgba(108,99,255,0.15);border-radius:12px;padding:10px 14px;margin-bottom:16px;">
                      <span style="font-size:24px;">🛡️</span>
                    </div>
                    <h1 style="margin:0;color:#FFFFFF;font-size:22px;font-weight:900;letter-spacing:-0.5px;text-transform:uppercase;">
                      RoadWise <span style="color:#7C6FFF;">360</span>
                    </h1>
                    <p style="margin:6px 0 0;color:#8B8FA8;font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">
                      Sistema PESV · por DateNova
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider accent -->
          <tr>
            <td style="background:linear-gradient(90deg,#6C5CE7,#7C6FFF,#a29bfe);height:3px;"></td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color:#FFFFFF;padding:40px 40px 32px;border-radius:0 0 16px 16px;">

              <!-- Greeting -->
              <h2 style="margin:0 0 8px;color:#0A0A14;font-size:24px;font-weight:800;">
                ¡Hola, ${p.nombreCompleto}! 👋
              </h2>
              <p style="margin:0 0 24px;color:#555E6E;font-size:15px;line-height:1.6;">
                Has sido invitado/a a unirte a <strong style="color:#0A0A14;">RoadWise 360</strong>,
                la plataforma de gestión del Plan Estratégico de Seguridad Vial
                <strong>(PESV)</strong> según la Resolución 40595 de 2022.
              </p>

              <!-- Role card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background:linear-gradient(135deg,#F0EEFF,#E8E4FF);border:1px solid #D4CCFF;border-radius:12px;padding:16px 20px;">
                    <p style="margin:0 0 4px;color:#7C6FFF;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:2px;">
                      Tu rol asignado
                    </p>
                    <p style="margin:0;color:#2D2B55;font-size:18px;font-weight:900;">
                      ${p.rolLabel}
                    </p>
                    ${p.invitadoPor ? `<p style="margin:6px 0 0;color:#8B8FA8;font-size:12px;">Invitado por: <strong>${p.invitadoPor}</strong></p>` : ''}
                  </td>
                </tr>
              </table>

              <!-- Steps -->
              <p style="margin:0 0 16px;color:#0A0A14;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">
                Cómo activar tu cuenta:
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="padding:8px 0;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:28px;height:28px;background:#7C6FFF;border-radius:50%;text-align:center;vertical-align:middle;">
                          <span style="color:#fff;font-size:12px;font-weight:900;">1</span>
                        </td>
                        <td style="padding-left:12px;color:#555E6E;font-size:14px;">Haz clic en el botón de abajo</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:28px;height:28px;background:#7C6FFF;border-radius:50%;text-align:center;vertical-align:middle;">
                          <span style="color:#fff;font-size:12px;font-weight:900;">2</span>
                        </td>
                        <td style="padding-left:12px;color:#555E6E;font-size:14px;">Crea tu contraseña segura</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:28px;height:28px;background:#7C6FFF;border-radius:50%;text-align:center;vertical-align:middle;">
                          <span style="color:#fff;font-size:12px;font-weight:900;">3</span>
                        </td>
                        <td style="padding-left:12px;color:#555E6E;font-size:14px;">Accede al panel PESV con tus credenciales</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td align="center">
                    <a href="${p.activationUrl}"
                       style="display:inline-block;background:linear-gradient(135deg,#6C5CE7,#7C6FFF);color:#FFFFFF;text-decoration:none;font-size:15px;font-weight:900;padding:16px 40px;border-radius:12px;letter-spacing:0.5px;text-transform:uppercase;">
                      ✅ &nbsp; Activar mi cuenta
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Fallback URL -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background:#F4F6F9;border-radius:8px;padding:12px 16px;">
                    <p style="margin:0 0 4px;color:#8B8FA8;font-size:11px;font-weight:700;text-transform:uppercase;">
                      ¿El botón no funciona? Copia este enlace en tu navegador:
                    </p>
                    <p style="margin:0;color:#6C5CE7;font-size:12px;word-break:break-all;">
                      ${p.activationUrl}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Expiry warning -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td style="background:#FFF8E1;border-left:3px solid #FFC107;border-radius:0 8px 8px 0;padding:12px 16px;">
                    <p style="margin:0;color:#7D5B00;font-size:13px;">
                      ⚠️ <strong>Este enlace expira el ${expDate}.</strong>
                      Si no activas tu cuenta antes de esa fecha, solicita una nueva invitación al administrador.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <hr style="border:none;border-top:1px solid #E8ECF0;margin:0 0 24px;" />

              <!-- Footer -->
              <p style="margin:0;color:#A0A8B8;font-size:12px;text-align:center;line-height:1.6;">
                Si no esperabas esta invitación, puedes ignorar este correo.<br />
                Este mensaje fue generado automáticamente por
                <strong style="color:#7C6FFF;">RoadWise 360</strong> — DateNova &copy; ${new Date().getFullYear()}
              </p>

            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Función pública ──────────────────────────────────────────────────────────
export async function sendInvitationEmail(payload: InvitationEmailPayload): Promise<void> {
  const { data, error } = await resend.emails.send({
    from: FROM,
    to: payload.to,
    subject: `Invitación a RoadWise 360 — ${payload.rolLabel}`,
    html: invitationHtml(payload),
  });

  if (error) {
    console.error('[Resend] Error al enviar invitación:', error);
    throw new Error(error.message);
  }

  console.log('[Resend] Invitación enviada. ID:', data?.id);
}
