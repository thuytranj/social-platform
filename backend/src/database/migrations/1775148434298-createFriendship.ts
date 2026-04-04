import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateFriendship1775148434298 implements MigrationInterface {
    name = 'CreateFriendship1775148434298'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."friendships_status_enum" AS ENUM('pending', 'accepted', 'rejected', 'blocked')`);
        await queryRunner.query(`CREATE TABLE "friendships" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "requester_id" uuid NOT NULL, "addressee_id" uuid NOT NULL, "status" "public"."friendships_status_enum" NOT NULL DEFAULT 'pending', "user_low_id" character varying NOT NULL, "user_high_id" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_8ec6d0e2adc0fb61ad328fa158b" UNIQUE ("user_low_id", "user_high_id"), CONSTRAINT "CHK_e19b733aa97c1906214b1ddb78" CHECK ("requester_id" <> "addressee_id"), CONSTRAINT "PK_08af97d0be72942681757f07bc8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_8ec6d0e2adc0fb61ad328fa158" ON "friendships" ("user_low_id", "user_high_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_4864bfab7fad9a34292e12bdb0" ON "friendships" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_01b0760fd2402d21f12c6dc5f8" ON "friendships" ("addressee_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_4cf3c68ed4a5a9fde8d4c2b731" ON "friendships" ("requester_id") `);
        await queryRunner.query(`ALTER TABLE "friendships" ADD CONSTRAINT "FK_4cf3c68ed4a5a9fde8d4c2b7319" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "friendships" ADD CONSTRAINT "FK_01b0760fd2402d21f12c6dc5f89" FOREIGN KEY ("addressee_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "friendships" DROP CONSTRAINT "FK_01b0760fd2402d21f12c6dc5f89"`);
        await queryRunner.query(`ALTER TABLE "friendships" DROP CONSTRAINT "FK_4cf3c68ed4a5a9fde8d4c2b7319"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4cf3c68ed4a5a9fde8d4c2b731"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_01b0760fd2402d21f12c6dc5f8"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4864bfab7fad9a34292e12bdb0"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8ec6d0e2adc0fb61ad328fa158"`);
        await queryRunner.query(`DROP TABLE "friendships"`);
        await queryRunner.query(`DROP TYPE "public"."friendships_status_enum"`);
    }

}
