Controle de Estoque – Frontend

Frontend do Sistema de Controle de Estoque, uma aplicação web desenvolvida para apoiar pequenas e médias empresas na gestão de estoque, recebimentos, vendas e controle de usuários, com foco em organização, segurança e usabilidade.
O sistema consome uma API REST dedicada e foi projetado para operar em ambientes reais de produção.

Visão Geral

A aplicação oferece uma interface moderna e responsiva para:
• Autenticação segura de usuários
• Controle de acesso baseado em perfis (RBAC)
• Gestão de estoque e armazéns
• Recebimento de materiais
• Vendas e devoluções
• Ajustes de estoque (entrada e saída)
• Cadastro e gerenciamento de usuários, materiais e clientes
• Visualização de histórico e rastreabilidade das operações
Todas as funcionalidades respeitam rigorosamente as permissões definidas no backend.

Controle de Acesso (RBAC)
O frontend adapta dinamicamente rotas, menus e ações conforme o perfil do usuário autenticado:
• MASTER_ADMIN
• GERENTE
• SUPERVISAO
• LOGISTICA
• OPERADOR
• RH
Essa validação ocorre tanto no cliente quanto no servidor, garantindo maior segurança e consistência.

Tecnologias Utilizadas
• React (Vite)
• JavaScript (ES6+)
• React Router DOM
• Axios
• Tailwind CSS
• React Hot Toast
• JWT (autenticação via cookies HTTP Only)

src/
├── api/          # Comunicação com a API backend
├── assets/       # Imagens e recursos estáticos
├── components/   # Componentes reutilizáveis
│   └── ui/       # Componentes de interface
├── config/       # Configurações globais
├── constants/    # Constantes do sistema
├── contexts/     # Contextos globais (Auth, etc.)
├── hooks/        # Hooks customizados
├── pages/        # Páginas da aplicação
├── App.jsx       # Configuração de rotas
└── main.jsx      # Ponto de entrada

Configuração do Ambiente
Pré-requisitos
• Node.js 18+
• NPM ou Yarn
• Backend em execução

Variáveis de Ambiente
Este projeto não versiona dados sensíveis.

Crie um arquivo .env na raiz do projeto com base no exemplo:
VITE_API_BASE_URL=http://localhost:8080/api

Integração com o Backend
O frontend depende diretamente do backend do sistema para:
• Autenticação via JWT em cookies
• Validação de permissões por perfil
• Consumo de endpoints REST protegidos
Certifique-se de que o backend esteja corretamente configurado antes de iniciar a aplicação.

Status do Projeto

• Em produção
• Funcional e estável
• Em constante evolução para novas funcionalidades e melhorias de UX

Autor
Édipo Ferreira da Rocha
Graduando em Engenharia da Computação
GitHub: https://github.com/EdipoFRocha
LinkedIn: linkedin.com/in/edipo-ferreira90021511
