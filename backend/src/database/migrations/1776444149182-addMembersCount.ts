import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMembersCount1776444149182 implements MigrationInterface {
    name = 'AddMembersCount1776444149182'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "groups" ADD "members_count" integer NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "groups" DROP COLUMN "members_count"`);
    }

}
