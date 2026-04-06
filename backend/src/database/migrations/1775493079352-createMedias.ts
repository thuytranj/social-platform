import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateMedias1775493079352 implements MigrationInterface {
    name = 'CreateMedias1775493079352'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."medias_type_enum" AS ENUM('image', 'video', 'audio', 'other')`);
        await queryRunner.query(`CREATE TABLE "medias" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "url" character varying NOT NULL, "public_id" character varying NOT NULL, "type" "public"."medias_type_enum" NOT NULL DEFAULT 'other', "resource_type" character varying NOT NULL, "format" character varying, "bytes" integer, "width" integer, "height" integer, "duration" integer, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f27321557a66cd4fae9bc1ed6e7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "post_medias" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "post_id" uuid NOT NULL, "media_id" uuid NOT NULL, CONSTRAINT "PK_454dd8c598c65ed6c948552610f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_86d1b22bb6d6508941a24ff9f9" ON "post_medias" ("post_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_5554bd48cc9d63c7e93ec64539" ON "post_medias" ("media_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_fb71011973692cca69a78b1cd3" ON "post_medias" ("post_id", "media_id") `);
        await queryRunner.query(`ALTER TABLE "post_medias" ADD CONSTRAINT "FK_86d1b22bb6d6508941a24ff9f98" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "post_medias" ADD CONSTRAINT "FK_5554bd48cc9d63c7e93ec64539a" FOREIGN KEY ("media_id") REFERENCES "medias"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "post_medias" DROP CONSTRAINT "FK_5554bd48cc9d63c7e93ec64539a"`);
        await queryRunner.query(`ALTER TABLE "post_medias" DROP CONSTRAINT "FK_86d1b22bb6d6508941a24ff9f98"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fb71011973692cca69a78b1cd3"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5554bd48cc9d63c7e93ec64539"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_86d1b22bb6d6508941a24ff9f9"`);
        await queryRunner.query(`DROP TABLE "post_medias"`);
        await queryRunner.query(`DROP TABLE "medias"`);
        await queryRunner.query(`DROP TYPE "public"."medias_type_enum"`);
    }

}
