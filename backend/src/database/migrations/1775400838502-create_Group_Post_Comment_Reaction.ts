import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateGroupPostCommentReaction1775400838502 implements MigrationInterface {
    name = 'CreateGroupPostCommentReaction1775400838502'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "comments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "post_id" uuid NOT NULL, "author_id" uuid NOT NULL, "parent_id" uuid, "content" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_8bf68bc960f2b69e818bdb90dcb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_259bf9825d9d198608d1b46b0b" ON "comments" ("post_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_e6d38899c31997c45d128a8973" ON "comments" ("author_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_d6f93329801a93536da4241e38" ON "comments" ("parent_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_a0205f8dc849fe8920139c6dbe" ON "comments" ("parent_id", "created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_06a1038b5b8f236c9ddb068af5" ON "comments" ("post_id", "created_at") `);
        await queryRunner.query(`CREATE TYPE "public"."group_members_role_enum" AS ENUM('member', 'admin')`);
        await queryRunner.query(`CREATE TYPE "public"."group_members_status_enum" AS ENUM('active', 'banned')`);
        await queryRunner.query(`CREATE TABLE "group_members" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "group_id" uuid NOT NULL, "user_id" uuid NOT NULL, "role" "public"."group_members_role_enum" NOT NULL DEFAULT 'member', "status" "public"."group_members_status_enum" NOT NULL DEFAULT 'active', "joined_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_86446139b2c96bfd0f3b8638852" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_2c840df5db52dc6b4a1b0b69c6" ON "group_members" ("group_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_20a555b299f75843aa53ff8b0e" ON "group_members" ("user_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_f5939ee0ad233ad35e03f5c65c" ON "group_members" ("group_id", "user_id") `);
        await queryRunner.query(`CREATE TYPE "public"."groups_privacy_enum" AS ENUM('public', 'private')`);
        await queryRunner.query(`CREATE TABLE "groups" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" text, "cover_url" character varying, "creator_id" uuid NOT NULL, "privacy" "public"."groups_privacy_enum" NOT NULL DEFAULT 'public', "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_659d1483316afb28afd3a90646e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_664ea405ae2a10c264d582ee56" ON "groups" ("name") `);
        await queryRunner.query(`CREATE INDEX "IDX_33b49cd404bac777f795028c3b" ON "groups" ("creator_id") `);
        await queryRunner.query(`CREATE TABLE "feeds" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "post_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_3dafbf766ecbb1eb2017732153f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_ca81f22ea67d9df1257df35afb" ON "feeds" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_a1cb7a8cb9461da1042be03017" ON "feeds" ("post_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_89b548da7b6f4c187056dabc13" ON "feeds" ("user_id", "post_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_e92fde6bc01fa8684ea695fd8b" ON "feeds" ("user_id", "created_at") `);
        await queryRunner.query(`CREATE TYPE "public"."posts_privacy_enum" AS ENUM('public', 'friends_only', 'private')`);
        await queryRunner.query(`CREATE TABLE "posts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "author_id" uuid NOT NULL, "group_id" uuid, "content" character varying NOT NULL, "privacy" "public"."posts_privacy_enum" NOT NULL DEFAULT 'public', "react_count" integer NOT NULL DEFAULT '0', "comment_count" integer NOT NULL DEFAULT '0', "share_count" integer NOT NULL DEFAULT '0', "original_post_id" uuid, "root_post_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2829ac61eff60fcec60d7274b9e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_312c63be865c81b922e39c2475" ON "posts" ("author_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_7628aa3741a30d6217271a226c" ON "posts" ("group_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_3f7c083467ede0a2660bdb8011" ON "posts" ("original_post_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_8aba1c4a85beb2b3958086dbc7" ON "posts" ("root_post_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_51ce96f90864a33b711e2bc941" ON "posts" ("group_id", "created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_8b2fdcb4fb94d189e0e679748a" ON "posts" ("author_id", "created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_60818528127866f5002e7f826d" ON "posts" ("created_at") `);
        await queryRunner.query(`CREATE TYPE "public"."reactions_target_type_enum" AS ENUM('post', 'comment')`);
        await queryRunner.query(`CREATE TYPE "public"."reactions_type_enum" AS ENUM('like', 'love', 'haha', 'wow', 'sad', 'angry')`);
        await queryRunner.query(`CREATE TABLE "reactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "target_type" "public"."reactions_target_type_enum" NOT NULL, "target_id" character varying NOT NULL, "author_id" character varying NOT NULL, "type" "public"."reactions_type_enum" NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "authorId" uuid, CONSTRAINT "PK_0b213d460d0c473bc2fb6ee27f3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_9b401ddbeca7c98f38d625c423" ON "reactions" ("target_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_8bdd3d78cd2c50634c992711d1" ON "reactions" ("author_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_a0ff835d32e2bf340df685d056" ON "reactions" ("target_type", "target_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_7be21e6851a7bfc37096618085" ON "reactions" ("target_type", "target_id", "author_id") `);
        await queryRunner.query(`ALTER TABLE "comments" ADD CONSTRAINT "FK_e6d38899c31997c45d128a8973b" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "comments" ADD CONSTRAINT "FK_259bf9825d9d198608d1b46b0b5" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "comments" ADD CONSTRAINT "FK_d6f93329801a93536da4241e386" FOREIGN KEY ("parent_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "group_members" ADD CONSTRAINT "FK_2c840df5db52dc6b4a1b0b69c6e" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "group_members" ADD CONSTRAINT "FK_20a555b299f75843aa53ff8b0ee" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "groups" ADD CONSTRAINT "FK_33b49cd404bac777f795028c3b0" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "feeds" ADD CONSTRAINT "FK_ca81f22ea67d9df1257df35afb9" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "feeds" ADD CONSTRAINT "FK_a1cb7a8cb9461da1042be030176" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "posts" ADD CONSTRAINT "FK_312c63be865c81b922e39c2475e" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "posts" ADD CONSTRAINT "FK_7628aa3741a30d6217271a226cf" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "posts" ADD CONSTRAINT "FK_3f7c083467ede0a2660bdb8011c" FOREIGN KEY ("original_post_id") REFERENCES "posts"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "posts" ADD CONSTRAINT "FK_8aba1c4a85beb2b3958086dbc7b" FOREIGN KEY ("root_post_id") REFERENCES "posts"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reactions" ADD CONSTRAINT "FK_13bf71cc39cab0c98adb8901ee6" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reactions" DROP CONSTRAINT "FK_13bf71cc39cab0c98adb8901ee6"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP CONSTRAINT "FK_8aba1c4a85beb2b3958086dbc7b"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP CONSTRAINT "FK_3f7c083467ede0a2660bdb8011c"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP CONSTRAINT "FK_7628aa3741a30d6217271a226cf"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP CONSTRAINT "FK_312c63be865c81b922e39c2475e"`);
        await queryRunner.query(`ALTER TABLE "feeds" DROP CONSTRAINT "FK_a1cb7a8cb9461da1042be030176"`);
        await queryRunner.query(`ALTER TABLE "feeds" DROP CONSTRAINT "FK_ca81f22ea67d9df1257df35afb9"`);
        await queryRunner.query(`ALTER TABLE "groups" DROP CONSTRAINT "FK_33b49cd404bac777f795028c3b0"`);
        await queryRunner.query(`ALTER TABLE "group_members" DROP CONSTRAINT "FK_20a555b299f75843aa53ff8b0ee"`);
        await queryRunner.query(`ALTER TABLE "group_members" DROP CONSTRAINT "FK_2c840df5db52dc6b4a1b0b69c6e"`);
        await queryRunner.query(`ALTER TABLE "comments" DROP CONSTRAINT "FK_d6f93329801a93536da4241e386"`);
        await queryRunner.query(`ALTER TABLE "comments" DROP CONSTRAINT "FK_259bf9825d9d198608d1b46b0b5"`);
        await queryRunner.query(`ALTER TABLE "comments" DROP CONSTRAINT "FK_e6d38899c31997c45d128a8973b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7be21e6851a7bfc37096618085"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a0ff835d32e2bf340df685d056"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8bdd3d78cd2c50634c992711d1"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9b401ddbeca7c98f38d625c423"`);
        await queryRunner.query(`DROP TABLE "reactions"`);
        await queryRunner.query(`DROP TYPE "public"."reactions_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."reactions_target_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_60818528127866f5002e7f826d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8b2fdcb4fb94d189e0e679748a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_51ce96f90864a33b711e2bc941"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8aba1c4a85beb2b3958086dbc7"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3f7c083467ede0a2660bdb8011"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7628aa3741a30d6217271a226c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_312c63be865c81b922e39c2475"`);
        await queryRunner.query(`DROP TABLE "posts"`);
        await queryRunner.query(`DROP TYPE "public"."posts_privacy_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e92fde6bc01fa8684ea695fd8b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_89b548da7b6f4c187056dabc13"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a1cb7a8cb9461da1042be03017"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ca81f22ea67d9df1257df35afb"`);
        await queryRunner.query(`DROP TABLE "feeds"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_33b49cd404bac777f795028c3b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_664ea405ae2a10c264d582ee56"`);
        await queryRunner.query(`DROP TABLE "groups"`);
        await queryRunner.query(`DROP TYPE "public"."groups_privacy_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f5939ee0ad233ad35e03f5c65c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_20a555b299f75843aa53ff8b0e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2c840df5db52dc6b4a1b0b69c6"`);
        await queryRunner.query(`DROP TABLE "group_members"`);
        await queryRunner.query(`DROP TYPE "public"."group_members_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."group_members_role_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_06a1038b5b8f236c9ddb068af5"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a0205f8dc849fe8920139c6dbe"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d6f93329801a93536da4241e38"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e6d38899c31997c45d128a8973"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_259bf9825d9d198608d1b46b0b"`);
        await queryRunner.query(`DROP TABLE "comments"`);
    }

}
