import { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions.js";
import { DataSource } from "typeorm";
import 'dotenv/config';

const config: PostgresConnectionOptions = {
  type: "postgres",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: String(process.env.DB_PASSWORD),
  database: process.env.DB_NAME,
  entities: [__dirname + "/**/*.entity{.ts,.js}"],
  migrations: [__dirname + "/database/migrations/**/*{.ts,.js}"],
  migrationsTableName: "migrations",
}

const AppDataSource = new DataSource(config);

export { AppDataSource };
export default config;