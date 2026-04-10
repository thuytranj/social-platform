import { MigrationInterface, QueryRunner } from "typeorm";

export class UpateProfile1775757955817 implements MigrationInterface {
    name = 'UpateProfile1775757955817'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "profiles" ADD "avatar_public_id" character varying`);
        await queryRunner.query(`ALTER TABLE "profiles" ADD "cover_public_id" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "profiles" DROP COLUMN "cover_public_id"`);
        await queryRunner.query(`ALTER TABLE "profiles" DROP COLUMN "avatar_public_id"`);
    }

}
