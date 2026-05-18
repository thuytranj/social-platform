import { MigrationInterface, QueryRunner } from "typeorm";

export class AddKeyForPrivateConversation1779124101755 implements MigrationInterface {
    name = 'AddKeyForPrivateConversation1779124101755'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "message_medias" DROP CONSTRAINT "FK_9b3adfe38ddac776377a6c7cfd4"`);
        await queryRunner.query(`ALTER TABLE "message_medias" DROP CONSTRAINT "FK_a9102467b8218ab1f3cdf86736d"`);
        await queryRunner.query(`ALTER TABLE "conversations" ADD "private_key" character varying`);
        await queryRunner.query(`CREATE INDEX "IDX_241e01d2ad24eef750293ac946" ON "conversations" ("private_key") `);
        await queryRunner.query(`ALTER TABLE "message_medias" ADD CONSTRAINT "FK_9b3adfe38ddac776377a6c7cfd4" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "message_medias" ADD CONSTRAINT "FK_a9102467b8218ab1f3cdf86736d" FOREIGN KEY ("media_id") REFERENCES "medias"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "message_medias" DROP CONSTRAINT "FK_a9102467b8218ab1f3cdf86736d"`);
        await queryRunner.query(`ALTER TABLE "message_medias" DROP CONSTRAINT "FK_9b3adfe38ddac776377a6c7cfd4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_241e01d2ad24eef750293ac946"`);
        await queryRunner.query(`ALTER TABLE "conversations" DROP COLUMN "private_key"`);
        await queryRunner.query(`ALTER TABLE "message_medias" ADD CONSTRAINT "FK_a9102467b8218ab1f3cdf86736d" FOREIGN KEY ("media_id") REFERENCES "medias"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "message_medias" ADD CONSTRAINT "FK_9b3adfe38ddac776377a6c7cfd4" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
