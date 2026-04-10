import { MigrationInterface, QueryRunner } from "typeorm";

export class RenameReactCountColumn1775746913887 implements MigrationInterface {
    name = 'RenameReactCountColumn1775746913887'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "comments" RENAME COLUMN "reaction_count" TO "react_count"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "comments" RENAME COLUMN "react_count" TO "reaction_count"`);
    }

}
