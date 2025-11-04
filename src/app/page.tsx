"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Anchor, Shield, Smartphone, Cloud, Users, Building2, Zap } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-950">
      {/* Header */}
      <header className="px-4 lg:px-6 h-16 flex items-center border-b bg-white/95 dark:bg-gray-950/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-gray-950/60 border-gray-200 dark:border-gray-800">
        <div className="container mx-auto flex items-center justify-between">
          <Link className="flex items-center justify-center" href="/">
            <Anchor className="h-6 w-6 text-violet-600 dark:text-violet-400" />
            <span className="ml-2 text-xl font-bold text-gray-900 dark:text-gray-50">AnchorView</span>
          </Link>
          <nav className="hidden md:flex gap-6">
            <Link className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400 transition-colors" href="#features">
              Recursos
            </Link>
            <Link className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400 transition-colors" href="#pricing">
              Planos
            </Link>
            <Link className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400 transition-colors" href="#contact">
              Contato
            </Link>
          </nav>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/auth/login">Entrar</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/auth/register">Começar</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center py-12 md:py-24 lg:py-32 bg-gradient-to-br from-violet-50 to-blue-50 dark:from-violet-950/20 dark:to-blue-950/20">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="space-y-2">
              <Badge variant="secondary" className="mb-4">
                Gestão Profissional de Ancoragens
              </Badge>
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none text-gray-900 dark:text-gray-50">
                Gerencie pontos de ancoragem com
                <span className="text-violet-600 dark:text-violet-400 block">tecnologia avançada</span>
              </h1>
              <p className="mx-auto max-w-[700px] text-gray-600 dark:text-gray-400 md:text-xl">
                Sistema completo para inspeção, manutenção e relatórios de pontos de ancoragem industrial.
                Funciona 100% offline com sincronização automática.
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Button size="lg" asChild>
                <Link href="/auth/register">Começar Gratuitamente</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/auth/login">Ver Demo</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-white dark:bg-gray-950">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <Badge variant="secondary">Recursos</Badge>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-gray-900 dark:text-gray-50">
                Tudo que você precisa para gestão de ancoragens
              </h2>
              <p className="max-w-[900px] text-gray-600 dark:text-gray-400 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Ferramentas profissionais para inspeção, documentação e relatórios técnicos completos.
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3 lg:gap-12">
            <Card className="flex flex-col justify-center space-y-4 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <Smartphone className="h-8 w-8 text-violet-600 dark:text-violet-400" />
                <CardTitle className="ml-2 text-gray-900 dark:text-gray-50">Modo Offline</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Trabalhe sem conexão à internet. Todos os dados ficam salvos no dispositivo e sincronizam automaticamente quando conectado.
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="flex flex-col justify-center space-y-4 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <Shield className="h-8 w-8 text-violet-600 dark:text-violet-400" />
                <CardTitle className="ml-2 text-gray-900 dark:text-gray-50">Relatórios Técnicos</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Gere relatórios profissionais em PDF com fotos, medições e dados técnicos completos conforme normas.
                </CardDescription>
              </CardContent>
            </Card>
            <Card className="flex flex-col justify-center space-y-4 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <Cloud className="h-8 w-8 text-violet-600 dark:text-violet-400" />
                <CardTitle className="ml-2 text-gray-900 dark:text-gray-50">Sincronização</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Dados sincronizados em tempo real entre equipes e dispositivos com backup automático na nuvem.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="w-full py-12 md:py-24 lg:py-32 bg-gray-50 dark:bg-gray-900/50">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <Badge variant="secondary">Planos</Badge>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-gray-900 dark:text-gray-50">
                Escolha o plano ideal para sua empresa
              </h2>
              <p className="max-w-[600px] text-gray-600 dark:text-gray-400 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Preços transparentes e recursos profissionais para empresas de todos os tamanhos.
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-6xl items-center gap-6 py-12 lg:grid-cols-3 lg:gap-12">

            {/* Plano Básico */}
            <Card className="flex flex-col justify-between bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2 text-gray-900 dark:text-gray-50">
                  <Users className="h-5 w-5" />
                  Básico
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">Ideal para pequenas empresas</CardDescription>
                <div className="text-4xl font-bold text-center py-4 text-gray-900 dark:text-gray-50">
                  R$ 297<span className="text-lg font-normal text-gray-500 dark:text-gray-400">/mês</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Até 3 usuários</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Até 5 projetos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">200 pontos de ancoragem</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Relatórios básicos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Modo offline</span>
                  </div>
                </div>
                <Button className="w-full" asChild>
                  <Link href="/auth/register?plan=basic">Começar</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Plano Profissional */}
            <Card className="flex flex-col justify-between border-violet-200 dark:border-violet-800 relative bg-white dark:bg-gray-900">
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-violet-600 dark:bg-violet-500">
                Mais Popular
              </Badge>
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2 text-gray-900 dark:text-gray-50">
                  <Building2 className="h-5 w-5" />
                  Profissional
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">Perfeito para empresas médias</CardDescription>
                <div className="text-4xl font-bold text-center py-4 text-gray-900 dark:text-gray-50">
                  R$ 597<span className="text-lg font-normal text-gray-500 dark:text-gray-400">/mês</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Até 10 usuários</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Projetos ilimitados</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">1000 pontos de ancoragem</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Relatórios avançados</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">IA para análise</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Suporte prioritário</span>
                  </div>
                </div>
                <Button className="w-full" asChild>
                  <Link href="/auth/register?plan=professional">Começar</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Plano Enterprise */}
            <Card className="flex flex-col justify-between bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2 text-gray-900 dark:text-gray-50">
                  <Zap className="h-5 w-5" />
                  Enterprise
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">Para grandes operações</CardDescription>
                <div className="text-4xl font-bold text-center py-4 text-gray-900 dark:text-gray-50">
                  R$ 1.197<span className="text-lg font-normal text-gray-500 dark:text-gray-400">/mês</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Usuários ilimitados</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Tudo ilimitado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">API personalizada</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Integração ERP</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Suporte 24/7</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Treinamento incluído</span>
                  </div>
                </div>
                <Button className="w-full" asChild>
                  <Link href="/auth/register?plan=enterprise">Começar</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800">
        <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            © 2024 AnchorView. Todos os direitos reservados.
          </p>
          <nav className="sm:ml-auto flex gap-4 sm:gap-6">
            <Link className="text-xs hover:underline underline-offset-4 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200" href="#privacy">
              Privacidade
            </Link>
            <Link className="text-xs hover:underline underline-offset-4 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200" href="#terms">
              Termos
            </Link>
            <Link className="text-xs hover:underline underline-offset-4 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200" href="#contact">
              Contato
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
