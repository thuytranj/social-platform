import { MigrationInterface, QueryRunner } from "typeorm";

export class Update1779382638656 implements MigrationInterface {
    name = 'Update1779382638656'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_8f76c86ed56968480fbd7d93f2"`);
        await queryRunner.query(`ALTER TABLE "messages" RENAME COLUMN "deleted_at" TO "react_count"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "react_count"`);
        await queryRunner.query(`ALTER TABLE "messages" ADD "react_count" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a0ff835d32e2bf340df685d056"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7be21e6851a7bfc37096618085"`);
        await queryRunner.query(`ALTER TYPE "public"."reactions_target_type_enum" RENAME TO "reactions_target_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."reactions_target_type_enum" AS ENUM('post', 'comment', 'message')`);
        await queryRunner.query(`ALTER TABLE "reactions" ALTER COLUMN "target_type" TYPE "public"."reactions_target_type_enum" USING "target_type"::"text"::"public"."reactions_target_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."reactions_target_type_enum_old"`);
        await queryRunner.query(`CREATE INDEX "IDX_5dc244350d4aeea419f28acb07" ON "messages" ("conversation_id", "sent_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_a0ff835d32e2bf340df685d056" ON "reactions" ("target_type", "target_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_7be21e6851a7bfc37096618085" ON "reactions" ("target_type", "target_id", "author_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_7be21e6851a7bfc37096618085"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a0ff835d32e2bf340df685d056"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5dc244350d4aeea419f28acb07"`);
        await queryRunner.query(`CREATE TYPE "public"."reactions_target_type_enum_old" AS ENUM('post', 'comment')`);
        await queryRunner.query(`ALTER TABLE "reactions" ALTER COLUMN "target_type" TYPE "public"."reactions_target_type_enum_old" USING "target_type"::"text"::"public"."reactions_target_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."reactions_target_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."reactions_target_type_enum_old" RENAME TO "reactions_target_type_enum"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_7be21e6851a7bfc37096618085" ON "reactions" ("author_id", "target_id", "target_type") `);
        await queryRunner.query(`CREATE INDEX "IDX_a0ff835d32e2bf340df685d056" ON "reactions" ("target_id", "target_type") `);
        await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "react_count"`);
        await queryRunner.query(`ALTER TABLE "messages" ADD "react_count" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "messages" RENAME COLUMN "react_count" TO "deleted_at"`);
        await queryRunner.query(`CREATE INDEX "IDX_8f76c86ed56968480fbd7d93f2" ON "messages" ("conversation_id", "deleted_at", "sent_at") `);
    }

}
