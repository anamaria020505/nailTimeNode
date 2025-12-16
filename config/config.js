require('dotenv').config();

module.exports = {
    // === DEVELOPMENT Environment (Usa variables _DEV) ===
    development: {
        // Busca DB_USER_DEV, si no, usa DB_USER, si no, usa 'postgres'
        username: process.env.DB_USER_DEV || process.env.DB_USER || 'postgres',

        // Busca DB_PASSWORD_DEV, si no, usa un fallback local
        password: process.env.DB_PASSWORD_DEV || '020505',

        // Busca DB_NAME_DEV, si no, usa 'nailTimeNode'
        database: process.env.DB_NAME_DEV || 'nailTimeNode',

        // Conexión
        host: process.env.DB_HOST_DEV || 'localhost',
        port: process.env.DB_PORT_DEV || 5433,
        dialect: process.env.DB_DIALECT || 'postgres',
    },

    // === TEST Environment (Usa variables _TEST) ===
    test: {
        // Busca DB_USER_TEST, si no, usa DB_USER, si no, usa 'postgres'
        username: process.env.DB_USER_TEST || process.env.DB_USER || 'postgres',

        // Busca DB_PASSWORD_TEST, si no, usa un fallback simple
        password: process.env.DB_PASSWORD_TEST || 'testpass',

        // Busca DB_NAME_TEST, si no, usa 'nailTimeNode_test'
        database: process.env.DB_NAME_TEST || 'nailTimeNode_test',

        // Conexión
        host: process.env.DB_HOST_TEST || 'localhost',
        port: process.env.DB_PORT_TEST || 5433,
        dialect: process.env.DB_DIALECT || 'postgres',
    },

    // === PRODUCTION Environment (Solo variables genéricas, ¡SIN FALLBACKS CODIFICADOS!) ===
    production: {
        // DEBEN estar definidas en el entorno de despliegue
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        host: process.env.DB_HOST,

        // Puerto y Dialecto pueden tener un fallback estándar si es necesario
        port: process.env.DB_PORT || 5432,
        dialect: process.env.DB_DIALECT || 'postgres',
    }
}
