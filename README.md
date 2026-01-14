# NailTime - Backend Node.js

Este es el backend para el sistema de reserva de citas para servicios de manicura y pedicura (NailTime), construido con **Node.js**, **Express**, **TypeScript** y **Sequelize**.

## Requisitos Previos

- **Node.js** (v16 o superior recomendado)
- **PostgreSQL**
- **npm** o **yarn**

---

## 🚀 Opción 1: Instalación Estándar (Desde Cero)

Sigue estos pasos para configurar el proyecto por primera vez utilizando las migraciones y seeders de Sequelize:

### 1. Instalar dependencias

Abre una terminal en el directorio raíz del proyecto y ejecuta:

```bash
npm install
# o si usas yarn:
yarn install
```

### 2. Crear la Base de Datos

Crea una base de datos vacía en PostgreSQL llamada `nailTimeNode` (o el nombre que prefieras).

### 3. Configurar variables de entorno (`.env`)

Puedes guiarte del archivo `.env.example`. Crea un archivo llamado `.env` en la raíz del proyecto y configura tus credenciales locales:

```env
PORT=3000
NODE_ENV=development

# Variables para Desarrollo (Local)
DB_USER_DEV=postgres
DB_PASSWORD_DEV=tu_contraseña
DB_HOST_DEV=localhost
DB_PORT_DEV=5433
DB_NAME_DEV=nailTimeNode

# Secreto para JWT
JWT_SECRET="tu_secreto_aqui"
```

_(Nota: Asegúrate de que los valores coincidan con tu configuración de PostgreSQL local)._

### 4. Ejecutar Migraciones y Seeders

Este paso creará las tablas y las llenará con datos iniciales necesarios:

```bash
# Crear las tablas
npx sequelize-cli db:migrate

# Cargar los seeders (datos de prueba)
npx sequelize-cli db:seed:all
```

### 5. Iniciar el servidor

```bash
npm run dev
```

El servidor debería estar corriendo en `http://localhost:3000`.

---

## 📦 Opción 2: Instalación desde un Backup de DB

Si prefieres cargar los datos directamente desde un archivo `.sql` de respaldo:

### 1. Instalar dependencias

```bash
npm install
```

### 2. Crear la Base de Datos y Cargar Backup

1. Crea la base de datos en tu gestor de PostgreSQL.
2. Carga el archivo de backup (ej: `db.sql`):

### 3. Configurar variables de entorno (`.env`)

Asegúrate de tener el archivo `.env` configurado como se explica en la Opción 1, apuntando a la base de datos donde cargaste el backup.

### 4. Iniciar el servidor

```bash
npm run dev
```

---

## Scripts Disponibles

- `npm run dev`: Inicia el servidor en modo desarrollo con recarga automática (`nodemon`).
- `npm run build`: Compila el código TypeScript a JavaScript en la carpeta `dist`.
- `npm start`: Inicia el servidor en modo producción (requiere haber ejecutado el build).

## Estructura del Proyecto

- `src/`: Código fuente en TypeScript.
- `models/`: Definición de modelos de Sequelize.
- `controllers/`: Lógica de negocio de los endpoints.
- `routes/`: Definición de rutas de la API.
- `config/`: Configuración de base de datos y otros servicios.
- `migrations/`: Archivos de migración de Sequelize.
- `seeders/`: Archivos para poblar la base de datos.
