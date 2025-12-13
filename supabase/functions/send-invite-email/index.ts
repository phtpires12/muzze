import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteEmailRequest {
  inviteId: string;
  toEmail: string;
  inviterName: string;
  workspaceName: string;
  role: string;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { inviteId, toEmail, inviterName, workspaceName, role }: InviteEmailRequest = await req.json();

    console.log(`Sending invite email to ${toEmail} for workspace ${workspaceName}`);

    // Build the invite link using the project ID
    const projectId = "lxjhrnbxwknobcgnuruk";
    const inviteLink = `https://${projectId}.lovableproject.com/invite?id=${inviteId}`;

    const roleLabel = role === "admin" ? "Administrador" : "Colaborador";

    const emailResponse = await resend.emails.send({
      from: "Muzze <onboarding@resend.dev>",
      to: [toEmail],
      subject: `${inviterName} convidou você para colaborar na Muzze`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 40px 20px;">
          <div style="max-width: 480px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            
            <!-- Header with gradient -->
            <div style="background: linear-gradient(135deg, #FF9A5F 0%, #8B5CF6 100%); padding: 32px 24px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">Muzze</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">Organize sua Criatividade</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 32px 24px;">
              <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 20px; font-weight: 600;">
                Você foi convidado! 🎉
              </h2>
              
              <p style="color: #4b5563; margin: 0 0 24px 0; font-size: 16px; line-height: 1.6;">
                <strong>${inviterName}</strong> convidou você para colaborar no workspace <strong>"${workspaceName}"</strong> como <strong>${roleLabel}</strong>.
              </p>
              
              <p style="color: #6b7280; margin: 0 0 24px 0; font-size: 14px; line-height: 1.5;">
                Com a Muzze, vocês podem organizar ideias, roteiros e gravações juntos de forma colaborativa.
              </p>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="${inviteLink}" 
                   style="display: inline-block; background: linear-gradient(135deg, #FF9A5F 0%, #8B5CF6 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);">
                  Aceitar Convite
                </a>
              </div>
              
              <p style="color: #9ca3af; margin: 24px 0 0 0; font-size: 12px; text-align: center;">
                Este convite expira em 7 dias.
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 20px 24px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; margin: 0; font-size: 12px;">
                Se você não esperava este email, pode ignorá-lo com segurança.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending invite email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
