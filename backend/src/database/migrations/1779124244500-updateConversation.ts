import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateConversation1779124244500 implements MigrationInterface {
    name = 'UpdateConversation1779124244500'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "conversations" ADD CONSTRAINT "UQ_241e01d2ad24eef750293ac946b" UNIQUE ("private_key")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "conversations" DROP CONSTRAINT "UQ_241e01d2ad24eef750293ac946b"`);
    }

}
