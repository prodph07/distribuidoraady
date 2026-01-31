# Distribuidora Ady

Aplicação de distribuição de bebidas e conveniência, desenvolvida com tecnologia moderna para oferecer uma experiência rápida e fluida aos clientes.

## 🚀 Sobre o Projeto (MVP V2)

Este projeto é uma plataforma de e-commerce focada em delivery de bebidas, permitindo que os clientes façam pedidos, acompanhem o status em tempo real e realizem pagamentos de forma segura.

### Funcionalidades Principais
- **Catálogo de Produtos**: Navegação por categorias (Cervejas, Destilados, etc.).
- **Carrinho e Checkout**: Fluxo de compra otimizado.
- **Rastreamento de Pedidos**: Página de status em tempo real com atualizações via WebSocket.
- **Painel Administrativo**: Gestão de produtos, pedidos e configurações da loja.
- **Pagamentos**: Integração com Mercado Pago (PIX e Cartão).
- **Notificações**: Atualizações de status de pedido em tempo real.

## 🛠️ Tecnologias Utilizadas

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/)
- **Linguagem**: TypeScript
- **Estilização**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Backend / Banco de Dados**: [Supabase](https://supabase.com/)
- **Pagamentos**: Mercado Pago SDK
- **Componentes UI**: Radix UI + Lucide React

## 📦 Como Rodar Localmente

1. Clone o repositório:
```bash
git clone https://github.com/prodph07/distribuidoraady.git
cd distribuidoraady
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
Crie um arquivo `.env.local` na raiz do projeto e adicione as chaves necessárias (Supabase, Mercado Pago, etc.).

4. Rode o servidor de desenvolvimento:
```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

## 🚢 Deploy

O projeto está configurado para deploy na Vercel ou Cloudflare Pages.

## 📝 Licença

Este projeto é privado e proprietário.
