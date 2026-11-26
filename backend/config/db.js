const { Pool } = require("pg");

require("dotenv").config({ quiet: true });

const isTest = process.env.NODE_ENV === "test";

const poolConfig =
    !isTest && process.env.DATABASE_URL
        ? {
              connectionString: process.env.DATABASE_URL
          }
        : {
              user: process.env.DB_USER,
              host: process.env.DB_HOST,
              database: isTest
                  ? process.env.TEST_DB_NAME
                  : process.env.DB_NAME,
              password: process.env.DB_PASSWORD,
              port: process.env.DB_PORT
          };

const pool = new Pool(poolConfig);

module.exports = pool;
