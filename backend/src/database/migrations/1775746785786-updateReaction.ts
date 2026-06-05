import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateReaction1775746785786 implements MigrationInterface {
    name = 'UpdateReaction1775746785786'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reactions" DROP CONSTRAINT "FK_13bf71cc39cab0c98adb8901ee6"`);
        await queryRunner.query(`ALTER TABLE "reactions" DROP COLUMN "authorId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7be21e6851a7bfc37096618085"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8bdd3d78cd2c50634c992711d1"`);
        await queryRunner.query(`ALTER TABLE "reactions" DROP COLUMN "author_id"`);
        await queryRunner.query(`ALTER TABLE "reactions" ADD "author_id" uuid NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_8bdd3d78cd2c50634c992711d1" ON "reactions" ("author_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_7be21e6851a7bfc37096618085" ON "reactions" ("target_type", "target_id", "author_id") `);
        await queryRunner.query(`ALTER TABLE "reactions" ADD CONSTRAINT "FK_8bdd3d78cd2c50634c992711d15" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reactions" DROP CONSTRAINT "FK_8bdd3d78cd2c50634c992711d15"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7be21e6851a7bfc37096618085"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8bdd3d78cd2c50634c992711d1"`);
        await queryRunner.query(`ALTER TABLE "reactions" DROP COLUMN "author_id"`);
        await queryRunner.query(`ALTER TABLE "reactions" ADD "author_id" character varying NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_8bdd3d78cd2c50634c992711d1" ON "reactions" ("author_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_7be21e6851a7bfc37096618085" ON "reactions" ("author_id", "target_id", "target_type") `);
        await queryRunner.query(`ALTER TABLE "reactions" ADD "authorId" uuid`);
        await queryRunner.query(`ALTER TABLE "reactions" ADD CONSTRAINT "FK_13bf71cc39cab0c98adb8901ee6" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
