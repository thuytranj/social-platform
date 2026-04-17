import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCoverPublicIdInGroup1776435045447 implements MigrationInterface {
    name = 'AddCoverPublicIdInGroup1776435045447'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "groups" ADD "cover_public_id" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "groups" DROP COLUMN "cover_public_id"`);
    }

}
