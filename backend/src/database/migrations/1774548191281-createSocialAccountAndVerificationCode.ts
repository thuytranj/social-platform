import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSocialAccountAndVerificationCode1774548191281 implements MigrationInterface {
    name = 'CreateSocialAccountAndVerificationCode1774548191281'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."verification_codes_type_enum" AS ENUM('email_verification', 'password_reset')`);
        await queryRunner.query(`CREATE TABLE "verification_codes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "code" character varying NOT NULL, "type" "public"."verification_codes_type_enum" NOT NULL, "is_used" boolean NOT NULL DEFAULT false, "attempts_count" integer NOT NULL DEFAULT '0', "expires_at" TIMESTAMP NOT NULL, CONSTRAINT "PK_18741b6b8bf1680dbf5057421d7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_bb0f37096d5704cf8424fbd922" ON "verification_codes" ("code") `);
        await queryRunner.query(`CREATE INDEX "IDX_5796c1119fc1b0e93bed1c0c22" ON "verification_codes" ("expires_at") `);
        await queryRunner.query(`CREATE TYPE "public"."social_accounts_provider_enum" AS ENUM('google', 'facebook', 'twitter', 'github')`);
        await queryRunner.query(`CREATE TABLE "social_accounts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "provider" "public"."social_accounts_provider_enum" NOT NULL, "provider_user_id" character varying NOT NULL, CONSTRAINT "UQ_4508a993f9340ca4e7547db4ff3" UNIQUE ("provider", "provider_user_id"), CONSTRAINT "PK_e9e58d2d8e9fafa20af914d9750" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_4508a993f9340ca4e7547db4ff" ON "social_accounts" ("provider", "provider_user_id") `);
        await queryRunner.query(`ALTER TABLE "profiles" ALTER COLUMN "full_name" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "verification_codes" ADD CONSTRAINT "FK_0a53c41a810420ee446082ce6c6" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "social_accounts" ADD CONSTRAINT "FK_05a0f282d3bed93ca048a7e54dd" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "social_accounts" DROP CONSTRAINT "FK_05a0f282d3bed93ca048a7e54dd"`);
        await queryRunner.query(`ALTER TABLE "verification_codes" DROP CONSTRAINT "FK_0a53c41a810420ee446082ce6c6"`);
        await queryRunner.query(`ALTER TABLE "profiles" ALTER COLUMN "full_name" SET NOT NULL`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4508a993f9340ca4e7547db4ff"`);
        await queryRunner.query(`DROP TABLE "social_accounts"`);
        await queryRunner.query(`DROP TYPE "public"."social_accounts_provider_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5796c1119fc1b0e93bed1c0c22"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bb0f37096d5704cf8424fbd922"`);
        await queryRunner.query(`DROP TABLE "verification_codes"`);
        await queryRunner.query(`DROP TYPE "public"."verification_codes_type_enum"`);
    }

}
