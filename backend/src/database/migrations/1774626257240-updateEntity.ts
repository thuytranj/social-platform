import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateEntity1774626257240 implements MigrationInterface {
    name = 'UpdateEntity1774626257240'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "verification_codes" DROP CONSTRAINT "FK_0a53c41a810420ee446082ce6c6"`);
        await queryRunner.query(`ALTER TABLE "verification_codes" DROP COLUMN "user_id"`);
        await queryRunner.query(`ALTER TABLE "verification_codes" ADD "email" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "verification_codes" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "verification_codes" ADD CONSTRAINT "UQ_8f0a76dccf0bb80c00814b438f2" UNIQUE ("email", "code", "type")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "verification_codes" DROP CONSTRAINT "UQ_8f0a76dccf0bb80c00814b438f2"`);
        await queryRunner.query(`ALTER TABLE "verification_codes" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "verification_codes" DROP COLUMN "email"`);
        await queryRunner.query(`ALTER TABLE "verification_codes" ADD "user_id" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "verification_codes" ADD CONSTRAINT "FK_0a53c41a810420ee446082ce6c6" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
