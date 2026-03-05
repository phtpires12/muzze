import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TermsOfUse = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="border-b border-border bg-card">
        <div
          className="max-w-3xl mx-auto px-4 py-4"
          style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)' }}
        >
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              <h1 className="text-xl md:text-2xl font-bold">Termos de Uso</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="bg-muted/30 border-b border-border/50 pb-6">
            <CardTitle className="text-2xl">Termos e Condições do Muzze</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Última atualização: {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </p>
          </CardHeader>
          <CardContent className="prose prose-sm md:prose-base prose-zinc dark:prose-invert max-w-none pt-8 space-y-8">

            <section>
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                1. Aceitação dos Termos
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Ao acessar e utilizar o Muzze ("Plataforma", "Nós", "Nosso"), você concorda em cumprir e estar vinculado aos presentes Termos de Uso.
                Se você não concordar com qualquer parte destes termos, você não deve usar nossos serviços.
                O Muzze é uma plataforma projetada para ajudar criadores de conteúdo na escrita, organização e acompanhamento de roteiros.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                2. Conta e Segurança
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Para usar o Muzze, você deve criar uma conta fornecendo informações precisas e completas.
                Você é o único responsável pela atividade que ocorre em sua conta e por manter a segurança de suas credenciais de login.
                Devemos ser notificados imediatamente sobre qualquer violação de segurança ou uso não autorizado da sua conta.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                3. Propriedade Intelectual e Seu Conteúdo
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                <strong>O Seu Conteúdo é Seu:</strong> Você retém todos os direitos e titularidade sobre os roteiros, textos e ideias ("Conteúdo do Usuário") que você criar ou inserir no Muzze.
                Ao usar a plataforma, você nos concede apenas uma licença limitada e técnica para armazenar, exibir e processar seu conteúdo exclusivamente para o fim de operar a plataforma.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-2">
                <strong>A Plataforma é Nossa:</strong> A infraestrutura, design, código, logotipos e textos institucionais do Muzze são protegidos por leis de propriedade intelectual e direitos autorais.
                É proibido copiar, modificar ou distribuir qualquer parte do serviço sem nossa autorização prévia por escrito.
              </p>
            </section>

            <section className="bg-accent/5 p-4 rounded-lg border border-accent/20">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-2">
                4. Serviços e Integrações de Terceiros
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                O Muzze pode oferecer funcionalidades que interagem com serviços de terceiros (como a importação via Notion). Ao utilizar estas integrações:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-muted-foreground">
                <li>Você nos autoriza a acessar e processar dados do serviço de terceiros em seu nome, estritamente para executar as ações que você solicitar (ex: importar textos).</li>
                <li>O Muzze não se responsabiliza pelas políticas de privacidade, termos de uso ou interrupções de serviço dessas plataformas externas.</li>
                <li>Qualquer alteração, suspensão ou desativação de APIs de terceiros que afete o funcionamento de integrações na nossa plataforma não será de nossa responsabilidade.</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                5. Conduta do Usuário
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Você concorda em não usar o Muzze para:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-muted-foreground">
                <li>Transmitir conteúdo ilícito, difamatório, ameaçador ou que infrinja direitos de terceiros.</li>
                <li>Tentativas de burlar medidas de segurança, hacking, engenharia reversa do código ou sobrecarregar a infraestrutura com solicitações massivas (ataques).</li>
                <li>Compartilhar credenciais de acesso de planos com usuários não pagantes.</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                6. Pagamentos e Assinaturas
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                O Muzze pode oferecer planos gratuitos e pagos. Ao assinar uma versão paga, você concorda em nos fornecer informações de faturamento precisas.
                As assinaturas são renovadas automaticamente ao final de cada período (mensal ou anual), a menos que você cancele antes da data de renovação.
                Cancelamentos podem ser feitos a qualquer momento pelas configurações da conta e serão efetivados no término do ciclo de faturamento atual.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                7. Limitação de Responsabilidade
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                O Muzze é fornecido no estado em que se encontra ("as is"). Embora nos esforcemos para manter a plataforma estável e segura, não garantimos que o serviço será ininterrupto, livre de erros ou 100% seguro.
                Em nenhuma circunstância o Muzze, seus criadores ou parceiros serão responsáveis por danos indiretos, perda de dados ou lucros cessantes decorrentes do uso da plataforma. Reconhecemos que é recomendável que o usuário mantenha backups próprios de conteúdos críticos.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                8. Modificações nestes Termos
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Reservamo-nos o direito de modificar estes Termos a qualquer momento. Em caso de mudanças em nossa política relacionadas à forma como operamos, notificaremos os usuários através da plataforma ou por e-mail.
                Ao continuar a acessar ou usar o Muzze após a implementação dessas revisões, você concorda em se submeter aos novos termos.
              </p>
            </section>

          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TermsOfUse;
