import { MigrationInterface, QueryRunner } from "typeorm";

export class AddReactionCountInComments1775664939855 implements MigrationInterface {
    name = 'AddReactionCountInComments1775664939855'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "comments" ADD "reaction_count" integer NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "comments" DROP COLUMN "reaction_count"`);
    }

}
