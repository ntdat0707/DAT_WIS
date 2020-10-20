/*
 Navicat Premium Data Transfer

 Source Server         : marketplace
 Source Server Type    : PostgreSQL
 Source Server Version : 110009
 Source Host           : db-postgresql-sgp1-88538-do-user-6846099-0.a.db.ondigitalocean.com:25060
 Source Catalog        : wisere
 Source Schema         : public

 Target Server Type    : PostgreSQL
 Target Server Version : 110009
 File Encoding         : 65001

 Date: 20/10/2020 16:07:11
*/


-- ----------------------------
-- Table structure for company_detail
-- ----------------------------
DROP TABLE IF EXISTS "public"."company_detail";
CREATE TABLE "public"."company_detail" (
  "id" uuid NOT NULL,
  "updated_at" timestamp(6),
  "created_at" timestamp(6),
  "deleted_at" timestamp(6),
  "description" varchar(500) COLLATE "pg_catalog"."default",
  "company_id" uuid,
  "business_name" varchar(255) COLLATE "pg_catalog"."default",
  "business_type" varchar(255) COLLATE "pg_catalog"."default",
  "phone" varchar(255) COLLATE "pg_catalog"."default"
)
;
ALTER TABLE "public"."company_detail" OWNER TO "doadmin";

-- ----------------------------
-- Table structure for location_image
-- ----------------------------
DROP TABLE IF EXISTS "public"."location_image";
CREATE TABLE "public"."location_image" (
  "id" uuid NOT NULL,
  "location_id" uuid,
  "path" text COLLATE "pg_catalog"."default",
  "is_avatar" bool,
  "created_at" timestamp(6),
  "updated_at" timestamp(6),
  "deleted_at" timestamp(6)
)
;
ALTER TABLE "public"."location_image" OWNER TO "doadmin";

-- ----------------------------
-- Primary Key structure for table company_detail
-- ----------------------------
ALTER TABLE "public"."company_detail" ADD CONSTRAINT "company_detail_pk" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table location_image
-- ----------------------------
ALTER TABLE "public"."location_image" ADD CONSTRAINT "location_image_pk" PRIMARY KEY ("id");

-- ----------------------------
-- Foreign Keys structure for table company_detail
-- ----------------------------
ALTER TABLE "public"."company_detail" ADD CONSTRAINT "company_detail_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- ----------------------------
-- Foreign Keys structure for table location_image
-- ----------------------------
ALTER TABLE "public"."location_image" ADD CONSTRAINT "location_image_fk" FOREIGN KEY ("location_id") REFERENCES "public"."location" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
