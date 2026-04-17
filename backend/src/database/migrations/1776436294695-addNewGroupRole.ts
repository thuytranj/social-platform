import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNewGroupRole1776436294695 implements MigrationInterface {
    name = 'AddNewGroupRole1776436294695'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."group_members_role_enum" RENAME TO "group_members_role_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."group_members_role_enum" AS ENUM('owner', 'member', 'admin', 'moderator')`);
        await queryRunner.query(`ALTER TABLE "group_members" ALTER COLUMN "role" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "group_members" ALTER COLUMN "role" TYPE "public"."group_members_role_enum" USING "role"::"text"::"public"."group_members_role_enum"`);
        await queryRunner.query(`ALTER TABLE "group_members" ALTER COLUMN "role" SET DEFAULT 'member'`);
        await queryRunner.query(`DROP TYPE "public"."group_members_role_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."group_members_role_enum_old" AS ENUM('member', 'admin', 'moderator')`);
        await queryRunner.query(`ALTER TABLE "group_members" ALTER COLUMN "role" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "group_members" ALTER COLUMN "role" TYPE "public"."group_members_role_enum_old" USING "role"::"text"::"public"."group_members_role_enum_old"`);
        await queryRunner.query(`ALTER TABLE "group_members" ALTER COLUMN "role" SET DEFAULT 'member'`);
        await queryRunner.query(`DROP TYPE "public"."group_members_role_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."group_members_role_enum_old" RENAME TO "group_members_role_enum"`);
    }

}
