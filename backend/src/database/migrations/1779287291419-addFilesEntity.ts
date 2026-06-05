import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFilesEntity1779287291419 implements MigrationInterface {
    name = 'AddFilesEntity1779287291419'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "files" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "message_id" uuid, "post_id" uuid, "comment_id" uuid, "url" character varying NOT NULL, "file_name" character varying NOT NULL, "original_name" character varying NOT NULL, "file_size" integer, "mime_type" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6c16b9093a142e0e7613b04a3d9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_63ee0a7c78bd7a1968a0893eda" ON "files" ("message_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_3bafa3455a692c11471ac3bf37" ON "files" ("post_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_db7b86afe40dda812511f3dc91" ON "files" ("comment_id") `);
        await queryRunner.query(`ALTER TABLE "files" ADD CONSTRAINT "FK_63ee0a7c78bd7a1968a0893edab" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "files" ADD CONSTRAINT "FK_3bafa3455a692c11471ac3bf375" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "files" ADD CONSTRAINT "FK_db7b86afe40dda812511f3dc91c" FOREIGN KEY ("comment_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "files" DROP CONSTRAINT "FK_db7b86afe40dda812511f3dc91c"`);
        await queryRunner.query(`ALTER TABLE "files" DROP CONSTRAINT "FK_3bafa3455a692c11471ac3bf375"`);
        await queryRunner.query(`ALTER TABLE "files" DROP CONSTRAINT "FK_63ee0a7c78bd7a1968a0893edab"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_db7b86afe40dda812511f3dc91"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3bafa3455a692c11471ac3bf37"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_63ee0a7c78bd7a1968a0893eda"`);
        await queryRunner.query(`DROP TABLE "files"`);
    }

}
