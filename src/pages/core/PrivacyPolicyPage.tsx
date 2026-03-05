import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PrivacyPolicy = () => {
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
              <Shield className="w-5 h-5 text-primary" />
              <h1 className="text-xl md:text-2xl font-bold">Política de Privacidade</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="bg-muted/30 border-b border-border/50 pb-6">
            <CardTitle className="text-2xl">Como tratamos seus dados</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Última atualização: {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </p>
          </CardHeader>
          <CardContent className="prose prose-sm md:prose-base prose-zinc dark:prose-invert max-w-none pt-8 space-y-8">

            <section>
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                1. Introdução
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Bem-vindo ao Muzze. Nós respeitamos a sua privacidade e estamos comprometidos em proteger os seus dados pessoais.
                Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos as suas informações
                quando você utiliza nossa plataforma e serviços, em conformidade com a Lei Geral de Proteção de Dados (LGPD - nº 13.709/2018).
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                2. Quais dados coletamos
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Coletamos informações essenciais para o funcionamento e melhoria da plataforma:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-muted-foreground">
                <li><strong>Dados de identificação:</strong> Nome, endereço de e-mail e foto de perfil (quando fornecida via autenticação).</li>
                <li><strong>Dados de conteúdo:</strong> Roteiros, ideias, links de referências e quaisquer outros textos inseridos por você dentro do Muzze.</li>
                <li><strong>Dados de uso:</strong> Informações sobre como você interage com a plataforma (tempo de sessão, etapas concluídas, frequência de uso), utilizadas para gamificação e melhoria da experiência.</li>
                <li><strong>Dados de Pagamento:</strong> Processados por provedores terceirizados seguros (Stripe). O Muzze não armazena dados completos do seu cartão de crédito.</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                3. Como usamos seus dados
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Utilizamos as informações coletadas para as seguintes finalidades:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-muted-foreground">
                <li>Fornecer, manter e melhorar as funcionalidades do Muzze.</li>
                <li>Executar recursos de Inteligência Artificial para análise e sugestão de melhorias em seus roteiros.</li>
                <li>Personalizar a sua experiência, fornecendo relatórios de progresso e ofensivas (streaks).</li>
                <li>Comunicar sobre novidades, atualizações de segurança ou suporte técnico.</li>
                <li>Processar pagamentos e assinaturas.</li>
              </ul>
            </section>

            <section className="bg-accent/5 p-4 rounded-lg border border-accent/20">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-2">
                4. Integrações de Terceiros (ex: Notion)
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Quando você conecta o Muzze a serviços de terceiros (como o Notion):
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-muted-foreground">
                <li>O Muzze apenas acessa os dados e espaços de trabalho que você explicitamente autoriza.</li>
                <li>No caso da importação de bases de dados do Notion, extraímos os textos e links para preencher os seus projetos no Muzze.</li>
                <li><strong>Nós não apagamos nem modificamos</strong> seus dados na plataforma de origem.</li>
                <li>As credenciais de integração (tokens de acesso) são armazenadas de forma segura e criptografada, podendo ser revogadas por você a qualquer momento.</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                5. Compartilhamento e Armazenamento
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Seus dados são armazenados de forma segura em infraestrutura em nuvem de alta confiabilidade.
                Nós <strong>não vendemos</strong> suas informações pessoais para anunciantes.
                Compartilhamos dados limitados apenas com prestadores de serviço terceirizados que nos auxiliam a operar a plataforma (como provedores de banco de dados, IA e pagamentos), os quais também estão sujeitos a rigorosos padrões de confidencialidade e proteção de dados.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                6. Retenção de Dados e Inteligência Artificial
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Retemos seus dados pessoais e conteúdos enquanto você mantiver uma conta ativa.
                Ao excluir sua conta, seus dados pessoais e roteiros são removidos de nossos bancos de dados principais.
                <strong>Importante:</strong> Os textos que você escreve no Muzze não são utilizados por nós para treinar modelos de Inteligência Artificial públicos disponíveis para outros usuários.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                7. Seus Direitos (LGPD)
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Você possui controle sobre seus dados. A qualquer momento, você pode:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-muted-foreground">
                <li>Acessar ou solicitar uma cópia dos seus dados.</li>
                <li>Corrigir informações incompletas ou imprecisas.</li>
                <li>Solicitar a exclusão da sua conta e dos dados vinculados a ela.</li>
                <li>Revogar o consentimento para integrações de terceiros.</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                8. Contato
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Se você tiver dúvidas sobre esta Política de Privacidade ou sobre o tratamento dos seus dados, nossa equipe está à disposição.
                Entre em contato conosco através do nosso e-mail de suporte (pedrotor4@icloud.com) ou através da aba "Ajuda" na plataforma.
              </p>
            </section>

          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
