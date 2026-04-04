import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1775231180945 implements MigrationInterface {
    name = 'Migrations1775231180945'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."profiles_sex_enum" AS ENUM('male', 'female', 'other')`);
        await queryRunner.query(`CREATE TABLE "profiles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "full_name" character varying, "sex" "public"."profiles_sex_enum", "date_of_birth" date, "avatar_url" character varying, "cover_url" character varying, "bio" text, CONSTRAINT "PK_8e520eb4da7dc01d0e190447c8e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."social_accounts_provider_enum" AS ENUM('google', 'facebook', 'twitter', 'github')`);
        await queryRunner.query(`CREATE TABLE "social_accounts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "provider" "public"."social_accounts_provider_enum" NOT NULL, "provider_user_id" character varying NOT NULL, CONSTRAINT "UQ_4508a993f9340ca4e7547db4ff3" UNIQUE ("provider", "provider_user_id"), CONSTRAINT "PK_e9e58d2d8e9fafa20af914d9750" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_4508a993f9340ca4e7547db4ff" ON "social_accounts" ("provider", "provider_user_id") `);
        await queryRunner.query(`CREATE TYPE "public"."friendships_status_enum" AS ENUM('pending', 'accepted', 'rejected', 'blocked')`);
        await queryRunner.query(`CREATE TABLE "friendships" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "requester_id" uuid NOT NULL, "addressee_id" uuid NOT NULL, "status" "public"."friendships_status_enum" NOT NULL DEFAULT 'pending', "user_low_id" character varying NOT NULL, "user_high_id" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_8ec6d0e2adc0fb61ad328fa158b" UNIQUE ("user_low_id", "user_high_id"), CONSTRAINT "CHK_e19b733aa97c1906214b1ddb78" CHECK ("requester_id" <> "addressee_id"), CONSTRAINT "PK_08af97d0be72942681757f07bc8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_8ec6d0e2adc0fb61ad328fa158" ON "friendships" ("user_low_id", "user_high_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_4864bfab7fad9a34292e12bdb0" ON "friendships" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_01b0760fd2402d21f12c6dc5f8" ON "friendships" ("addressee_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_4cf3c68ed4a5a9fde8d4c2b731" ON "friendships" ("requester_id") `);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL, "email" character varying NOT NULL, "username" character varying, "password" character varying, "is_verified" boolean NOT NULL DEFAULT false, "refresh_token" text, "profile_id" uuid, "last_active_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"), CONSTRAINT "REL_23371445bd80cb3e413089551b" UNIQUE ("profile_id"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `);
        await queryRunner.query(`CREATE INDEX "IDX_fe0bb3f6520ee0469504521e71" ON "users" ("username") `);
        await queryRunner.query(`CREATE INDEX "IDX_90144ead7619aced8f4c69d6e4" ON "users" ("last_active_at") `);
        await queryRunner.query(`CREATE TYPE "public"."verification_codes_type_enum" AS ENUM('email_verification', 'password_reset')`);
        await queryRunner.query(`CREATE TABLE "verification_codes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "code" character varying NOT NULL, "type" "public"."verification_codes_type_enum" NOT NULL, "is_used" boolean NOT NULL DEFAULT false, "attempts_count" integer NOT NULL DEFAULT '0', "expires_at" TIMESTAMP NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_8f0a76dccf0bb80c00814b438f2" UNIQUE ("email", "code", "type"), CONSTRAINT "PK_18741b6b8bf1680dbf5057421d7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_bb0f37096d5704cf8424fbd922" ON "verification_codes" ("code") `);
        await queryRunner.query(`CREATE INDEX "IDX_5796c1119fc1b0e93bed1c0c22" ON "verification_codes" ("expires_at") `);
        await queryRunner.query(`ALTER TABLE "social_accounts" ADD CONSTRAINT "FK_05a0f282d3bed93ca048a7e54dd" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "friendships" ADD CONSTRAINT "FK_4cf3c68ed4a5a9fde8d4c2b7319" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "friendships" ADD CONSTRAINT "FK_01b0760fd2402d21f12c6dc5f89" FOREIGN KEY ("addressee_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_23371445bd80cb3e413089551bf" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_23371445bd80cb3e413089551bf"`);
        await queryRunner.query(`ALTER TABLE "friendships" DROP CONSTRAINT "FK_01b0760fd2402d21f12c6dc5f89"`);
        await queryRunner.query(`ALTER TABLE "friendships" DROP CONSTRAINT "FK_4cf3c68ed4a5a9fde8d4c2b7319"`);
        await queryRunner.query(`ALTER TABLE "social_accounts" DROP CONSTRAINT "FK_05a0f282d3bed93ca048a7e54dd"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5796c1119fc1b0e93bed1c0c22"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bb0f37096d5704cf8424fbd922"`);
        await queryRunner.query(`DROP TABLE "verification_codes"`);
        await queryRunner.query(`DROP TYPE "public"."verification_codes_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_90144ead7619aced8f4c69d6e4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fe0bb3f6520ee0469504521e71"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4cf3c68ed4a5a9fde8d4c2b731"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_01b0760fd2402d21f12c6dc5f8"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4864bfab7fad9a34292e12bdb0"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8ec6d0e2adc0fb61ad328fa158"`);
        await queryRunner.query(`DROP TABLE "friendships"`);
        await queryRunner.query(`DROP TYPE "public"."friendships_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4508a993f9340ca4e7547db4ff"`);
        await queryRunner.query(`DROP TABLE "social_accounts"`);
        await queryRunner.query(`DROP TYPE "public"."social_accounts_provider_enum"`);
        await queryRunner.query(`DROP TABLE "profiles"`);
        await queryRunner.query(`DROP TYPE "public"."profiles_sex_enum"`);
    }

}
