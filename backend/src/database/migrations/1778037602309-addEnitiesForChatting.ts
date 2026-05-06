import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEnitiesForChatting1778037602309 implements MigrationInterface {
    name = 'AddEnitiesForChatting1778037602309'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."conversation_members_role_enum" AS ENUM('owner', 'member')`);
        await queryRunner.query(`CREATE TABLE "conversation_members" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "conversation_id" uuid NOT NULL, "user_id" uuid NOT NULL, "role" "public"."conversation_members_role_enum" NOT NULL DEFAULT 'member', "unread_count" integer NOT NULL DEFAULT '0', "last_read_at" TIMESTAMP WITH TIME ZONE, "last_read_message_id" uuid, "joined_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_33146a476696a973a14d931e675" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_36340a1704b039608e34244511" ON "conversation_members" ("conversation_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_a46c76be8f62c4b00a835cdc37" ON "conversation_members" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_79721b781d08835e5093c2140f" ON "conversation_members" ("last_read_message_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_5fa9076068b6f2a26fb793d243" ON "conversation_members" ("conversation_id", "user_id") `);
        await queryRunner.query(`CREATE TYPE "public"."conversations_type_enum" AS ENUM('PRIVATE', 'GROUP')`);
        await queryRunner.query(`CREATE TABLE "conversations" ("id" uuid NOT NULL, "type" "public"."conversations_type_enum" NOT NULL DEFAULT 'PRIVATE', "title" character varying, "thumbnail_url" character varying, "thumbnail_public_url" character varying, "last_message_id" uuid, "last_message_time" TIMESTAMP WITH TIME ZONE, "creator_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_ee34f4f7ced4ec8681f26bf04ef" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_de27a2f594693a9f00dacfc1cb" ON "conversations" ("creator_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_2b38281461a58f5795890d6b86" ON "conversations" ("last_message_time", "id") `);
        await queryRunner.query(`CREATE TYPE "public"."messages_message_type_enum" AS ENUM('text', 'media', 'file', 'system')`);
        await queryRunner.query(`CREATE TABLE "messages" ("id" uuid NOT NULL, "conversation_id" uuid NOT NULL, "sender_id" uuid NOT NULL, "reply_message_id" uuid, "message_type" "public"."messages_message_type_enum" NOT NULL DEFAULT 'text', "content" character varying, "sent_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_18325f38ae6de43878487eff986" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_3bc55a7c3f9ed54b520bb5cfe2" ON "messages" ("conversation_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_22133395bd13b970ccd0c34ab2" ON "messages" ("sender_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_bead535c28ada0b663dc4e99ee" ON "messages" ("reply_message_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_c2bc726fd86d8f91c4868a1056" ON "messages" ("sent_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_8f76c86ed56968480fbd7d93f2" ON "messages" ("conversation_id", "deleted_at", "sent_at") `);
        await queryRunner.query(`CREATE TABLE "message_medias" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "message_id" uuid NOT NULL, "media_id" uuid NOT NULL, CONSTRAINT "PK_cbb3b6eaf2475b85367c540d037" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_0ee842e1ff5765861cc5b54aaa" ON "message_medias" ("message_id", "media_id") `);
        await queryRunner.query(`ALTER TABLE "conversation_members" ADD CONSTRAINT "FK_36340a1704b039608e34244511f" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "conversation_members" ADD CONSTRAINT "FK_a46c76be8f62c4b00a835cdc370" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "conversation_members" ADD CONSTRAINT "FK_79721b781d08835e5093c2140f4" FOREIGN KEY ("last_read_message_id") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "conversations" ADD CONSTRAINT "FK_de27a2f594693a9f00dacfc1cb4" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "conversations" ADD CONSTRAINT "FK_a53679287450d522a3f700088e9" FOREIGN KEY ("last_message_id") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_3bc55a7c3f9ed54b520bb5cfe23" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_22133395bd13b970ccd0c34ab22" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_bead535c28ada0b663dc4e99ee6" FOREIGN KEY ("reply_message_id") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "message_medias" ADD CONSTRAINT "FK_9b3adfe38ddac776377a6c7cfd4" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "message_medias" ADD CONSTRAINT "FK_a9102467b8218ab1f3cdf86736d" FOREIGN KEY ("media_id") REFERENCES "medias"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "message_medias" DROP CONSTRAINT "FK_a9102467b8218ab1f3cdf86736d"`);
        await queryRunner.query(`ALTER TABLE "message_medias" DROP CONSTRAINT "FK_9b3adfe38ddac776377a6c7cfd4"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_bead535c28ada0b663dc4e99ee6"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_22133395bd13b970ccd0c34ab22"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_3bc55a7c3f9ed54b520bb5cfe23"`);
        await queryRunner.query(`ALTER TABLE "conversations" DROP CONSTRAINT "FK_a53679287450d522a3f700088e9"`);
        await queryRunner.query(`ALTER TABLE "conversations" DROP CONSTRAINT "FK_de27a2f594693a9f00dacfc1cb4"`);
        await queryRunner.query(`ALTER TABLE "conversation_members" DROP CONSTRAINT "FK_79721b781d08835e5093c2140f4"`);
        await queryRunner.query(`ALTER TABLE "conversation_members" DROP CONSTRAINT "FK_a46c76be8f62c4b00a835cdc370"`);
        await queryRunner.query(`ALTER TABLE "conversation_members" DROP CONSTRAINT "FK_36340a1704b039608e34244511f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0ee842e1ff5765861cc5b54aaa"`);
        await queryRunner.query(`DROP TABLE "message_medias"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8f76c86ed56968480fbd7d93f2"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c2bc726fd86d8f91c4868a1056"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bead535c28ada0b663dc4e99ee"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_22133395bd13b970ccd0c34ab2"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3bc55a7c3f9ed54b520bb5cfe2"`);
        await queryRunner.query(`DROP TABLE "messages"`);
        await queryRunner.query(`DROP TYPE "public"."messages_message_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2b38281461a58f5795890d6b86"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_de27a2f594693a9f00dacfc1cb"`);
        await queryRunner.query(`DROP TABLE "conversations"`);
        await queryRunner.query(`DROP TYPE "public"."conversations_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5fa9076068b6f2a26fb793d243"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_79721b781d08835e5093c2140f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a46c76be8f62c4b00a835cdc37"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_36340a1704b039608e34244511"`);
        await queryRunner.query(`DROP TABLE "conversation_members"`);
        await queryRunner.query(`DROP TYPE "public"."conversation_members_role_enum"`);
    }

}
