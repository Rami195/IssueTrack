# 🚀 IssueHub – Gestión de Proyectos y Tickets

IssueHub es una aplicación web completa para **gestión de proyectos y seguimiento de tickets**, desarrollada con un stack moderno que incluye **FastAPI**, **React (Vite)** y **Docker**.  
Proporciona autenticación JWT, CRUD de proyectos y tickets, dashboard, filtros, ordenamiento y una interfaz moderna.

---

## 📌 Características principales

### 🔐 Autenticación
- Inicio de sesión mediante JWT
- Registro de usuarios
- Sesión persistente con localStorage
- Middleware de seguridad con OAuth2Bearer

### 📁 Gestión de Proyectos
- Crear, editar y eliminar proyectos
- Ordenamiento por ID, nombre, fecha de creación y actualización
- Filtro de búsqueda
- Interfaz moderna con Material UI

### 🎫 Sistema de Tickets
- CRUD completo de tickets
- Prioridad y estado
- Asignación a usuarios
- Tablas con ordenación

### 🖥 Dashboard intuitivo
- Resumen del usuario
- Vista rápida de proyectos y tickets
- Buscador global integrado

### 🐳 Totalmente dockerizado
Con un solo comando levantás **frontend + API + base de datos**:

## 🛠 Tecnologías utilizadas

IssueHub fue construido con un stack moderno que separa claramente frontend, backend e infraestructura:

### **Frontend**
- React 18  
- Vite    
- Material UI (MUI)  
- React Router  

### **Backend**
- FastAPI  
- Python 3.12  
- Pydantic v2  
- JWT (python-jose)  


### **Base de Datos**
- PostgreSQL 16  
- SQL estándar + migración automática mediante SQLAlchemy  

### **Infraestructura**
- Docker  

### ⚙️ Requisitos previos

Antes de levantar el proyecto, asegurate de tener instalado:

- Docker
- Docker Compose
- Node.js 18+
- Python 3.10+
- PostgreSQL 14+

### 🌐 Endpoints principales de la API
### **🔐 Autenticación**

- POST /token
  - Recibe: username, password (form-urlencoded)
  - Devuelve: access_token, token_type

- GET /users/me
  - Devuelve la información del usuario autenticado.
  - Requiere cabecera: Authorization: Bearer <token>
  
### **👤 Usuarios**

- POST /users – Registro de usuario

### **📁 Proyectos**

- GET /projects – Listar proyectos
- POST /projects – Crear proyecto
- PUT /projects/{id} – Actualizar proyecto
- DELETE /projects/{id} – Eliminar proyecto

### **🎫 Tickets**

- GET /tickets – Listar tickets
- POST /tickets – Crear ticket
- PUT /tickets/{id} – Actualizar ticket
- DELETE /tickets/{id} – Eliminar ticket

Para todos los endpoints protegidos se usa Authorization: Bearer <token>.

