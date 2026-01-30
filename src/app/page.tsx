import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  FolderKanban,
  FileCheck,
  MessageSquare,
  Bell,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  const features = [
    {
      icon: FolderKanban,
      title: "Suivi en temps réel",
      description:
        "Visualisez l'avancement de votre projet étape par étape, de l'audit à la mise en production.",
    },
    {
      icon: FileCheck,
      title: "Validation simplifiée",
      description:
        "Validez les livrables en un clic ou demandez des modifications directement depuis le portail.",
    },
    {
      icon: MessageSquare,
      title: "Communication centralisée",
      description:
        "Échangez avec l'équipe via les commentaires, tout l'historique est conservé.",
    },
    {
      icon: Bell,
      title: "Notifications instantanées",
      description:
        "Recevez une alerte dès qu'un nouveau livrable est prêt à être validé.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Image
            src="/images/logo.svg"
            alt="Horde"
            width={100}
            height={32}
            priority
          />
          <Button asChild>
            <Link href="/login">
              Se connecter
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 md:py-24 lg:py-32">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <CheckCircle2 className="h-4 w-4" />
            Portail Client Horde
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display uppercase tracking-tight max-w-4xl mx-auto">
            L'avancement de votre projet,{" "}
            <span className="text-primary">centralisé</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Suivez chaque étape de votre projet web, validez les livrables et
            communiquez avec notre équipe depuis un espace dédié.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/login">
                Accéder à mon espace
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 md:py-24 bg-muted/30 border-y">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-display uppercase tracking-tight">
              Tout ce dont vous avez besoin
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Un espace conçu pour vous simplifier le suivi et la validation de
              votre projet.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-background rounded-xl border p-6 hover:shadow-md transition-shadow"
              >
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-display uppercase tracking-tight">
              Comment ça marche ?
            </h2>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="space-y-8">
              {[
                {
                  step: "1",
                  title: "Recevez votre accès",
                  description:
                    "Une fois votre projet lancé, vous recevez un email avec un lien de connexion sécurisé.",
                },
                {
                  step: "2",
                  title: "Suivez l'avancement",
                  description:
                    "Consultez les différentes étapes du projet et leur progression en temps réel.",
                },
                {
                  step: "3",
                  title: "Validez les livrables",
                  description:
                    "Téléchargez, commentez et validez chaque livrable. Demandez des modifications si nécessaire.",
                },
                {
                  step: "4",
                  title: "Restez informé",
                  description:
                    "Recevez des notifications à chaque nouvelle étape ou livrable disponible.",
                },
              ].map((item) => (
                <div key={item.step} className="flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="text-muted-foreground mt-1">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-display uppercase tracking-tight">
            Prêt à suivre votre projet ?
          </h2>
          <p className="mt-4 text-primary-foreground/80 max-w-xl mx-auto">
            Connectez-vous avec l'email utilisé lors de votre devis pour accéder
            à votre espace client.
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="mt-8"
            asChild
          >
            <Link href="/login">
              Se connecter
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Image
            src="/images/logo.svg"
            alt="Horde"
            width={80}
            height={26}
          />
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Horde. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
}
