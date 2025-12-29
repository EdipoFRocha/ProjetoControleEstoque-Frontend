# Projeto Controle de Estoque — Frontend

Frontend do sistema **Projeto Controle de Estoque**, uma aplicação web para gestão de estoque, recebimento, vendas, usuários e permissões por perfil.

Este projeto consome uma API backend dedicada e foi desenvolvido com foco em organização, segurança e escalabilidade.

---

##  Visão Geral

O sistema permite:

- Autenticação de usuários
- Controle de acesso por perfil (RBAC)
- Gestão de estoque
- Recebimento de materiais
- Vendas
- Ajustes de estoque
- Cadastro de usuários, materiais, clientes e armazéns
- Interface responsiva e intuitiva

---

##  Tecnologias Utilizadas

- **React** (Vite)
- **JavaScript (ES6+)**
- **React Router DOM**
- **Axios**
- **Tailwind CSS**
- **React Hot Toast**
- **JWT (via cookies HTTP Only)**

---

##  Controle de Acesso

O frontend trabalha com **perfis de usuário**, respeitando as permissões definidas no backend:

- MASTER_ADMIN  
- GERENTE  
- SUPERVISAO  
- LOGISTICA  
- OPERADOR  
- RH  

As rotas e menus são exibidos dinamicamente conforme o perfil do usuário autenticado.

---

##  Estrutura do Projeto

src/
├── api/ # Comunicação com o backend
├── assets/ # Imagens e recursos estáticos
├── components/ # Componentes reutilizáveis
│ └── ui/ # Componentes de interface
├── config/ # Configurações globais
├── constants/ # Constantes do sistema
├── contexts/ # Contextos globais (Auth, etc.)
├── hooks/ # Hooks customizados
├── pages/ # Páginas da aplicação
├── App.jsx # Configuração de rotas
└── main.jsx # Ponto de entrada


---

##  Configuração do Ambiente

### Pré-requisitos
- Node.js 18+
- NPM ou Yarn
- Backend em execução

---

###  Variáveis de Ambiente

O projeto **não versiona arquivos sensíveis**.

Crie um arquivo `.env` na raiz do projeto com base no exemplo:

``env
VITE_API_BASE_URL=http://localhost:8080/api

 Integração com o Backend

Este frontend depende do backend do projeto:

Autenticação via JWT (cookies)

Controle de permissões no servidor

Endpoints REST protegidos

Certifique-se de que o backend esteja configurado corretamente antes de executar o frontend.

Autor

Édipo Ferreira da Rocha
Engenharia da Computação
