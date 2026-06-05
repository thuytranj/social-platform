import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateMessageType1779287823721 implements MigrationInterface {
    name = 'UpdateMessageType1779287823721'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."messages_message_type_enum" RENAME TO "messages_message_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."messages_message_type_enum" AS ENUM('text', 'revoked', 'system')`);
        await queryRunner.query(`ALTER TABLE "messages" ALTER COLUMN "message_type" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "messages" ALTER COLUMN "message_type" TYPE "public"."messages_message_type_enum" USING "message_type"::"text"::"public"."messages_message_type_enum"`);
        await queryRunner.query(`ALTER TABLE "messages" ALTER COLUMN "message_type" SET DEFAULT 'text'`);
        await queryRunner.query(`DROP TYPE "public"."messages_message_type_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."messages_message_type_enum_old" AS ENUM('text', 'media', 'file', 'system')`);
        await queryRunner.query(`ALTER TABLE "messages" ALTER COLUMN "message_type" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "messages" ALTER COLUMN "message_type" TYPE "public"."messages_message_type_enum_old" USING "message_type"::"text"::"public"."messages_message_type_enum_old"`);
        await queryRunner.query(`ALTER TABLE "messages" ALTER COLUMN "message_type" SET DEFAULT 'text'`);
        await queryRunner.query(`DROP TYPE "public"."messages_message_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."messages_message_type_enum_old" RENAME TO "messages_message_type_enum"`);
    }

}
