import { MigrationInterface, QueryRunner } from 'typeorm';

export class initial1658491977564 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
      CREATE TABLE "users" (
        "id" SERIAL PRIMARY KEY NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP,
        "deleted_at" TIMESTAMP,
        "name" VARCHAR(255) NOT NULL,
        "email" VARCHAR(255) UNIQUE NOT NULL,
        "password" VARCHAR(255) NOT NULL,
        "provider" VARCHAR(255) NOT NULL,
        "photo" INT,
        "status" BOOLEAN NOT NULL DEFAULT true,
        "notification_token" VARCHAR(255),
        "hash" VARCHAR(255)
      );
      
      CREATE TABLE "roles" (
        "id" SERIAL PRIMARY KEY NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP,
        "deleted_at" TIMESTAMP,
        "name" VARCHAR(255) NOT NULL
      );
      
      CREATE TABLE "role_access" (
        "id" SERIAL PRIMARY KEY NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP,
        "deleted_at" TIMESTAMP,
        "role_id" INT NOT NULL,
        "menu_id" INT NOT NULL,
        "menu_access" INT NOT NULL
      );
      
      CREATE TABLE "menus" (
        "id" SERIAL PRIMARY KEY NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP,
        "deleted_at" TIMESTAMP,
        "name" VARCHAR(255) NOT NULL
      );
      
      CREATE TABLE "user_roles" (
        "id" SERIAL PRIMARY KEY NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP,
        "deleted_at" TIMESTAMP,
        "user_id" INT NOT NULL,
        "role_id" INT NOT NULL
      );
      
      CREATE TABLE "files" (
        "id" SERIAL PRIMARY KEY NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP,
        "deleted_at" TIMESTAMP,
        "name" VARCHAR NOT NULL,
        "path" VARCHAR NOT NULL,
        "file_type" INT NOT NULL,
        "extension" VARCHAR NOT NULL,
        "description" TEXT,
        "user_id" INT
      );
      
      CREATE TABLE "forgot_password" (
        "id" SERIAL PRIMARY KEY NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP,
        "deleted_at" TIMESTAMP,
        "hash" VARCHAR NOT NULL,
        "user_id" INT NOT NULL
      );
      
      COMMENT ON COLUMN "users"."status" IS '0: inactive, 1: active';
      
      COMMENT ON COLUMN "role_access"."menu_access" IS '0:create,1:read,2:update,3:delete';
      
      COMMENT ON COLUMN "files"."file_type" IS '0: images, 1: files, 2: video, 3: audio';
      
      ALTER TABLE "forgot_password" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");
      
      ALTER TABLE "users" ADD FOREIGN KEY ("photo") REFERENCES "files" ("id");
      
      ALTER TABLE "role_access" ADD FOREIGN KEY ("role_id") REFERENCES "roles" ("id");
      
      ALTER TABLE "role_access" ADD FOREIGN KEY ("menu_id") REFERENCES "menus" ("id");
      
      ALTER TABLE "user_roles" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");
      
      ALTER TABLE "user_roles" ADD FOREIGN KEY ("role_id") REFERENCES "roles" ("id");
      
      ALTER TABLE "files" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");
`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
        DROP SCHEMA public CASCADE;
        CREATE SCHEMA public;
        GRANT ALL ON SCHEMA public TO postgres;
        GRANT ALL ON SCHEMA public TO public;
        `,
    );
  }
}
