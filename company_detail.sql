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

 Date: 20/10/2020 15:53:56
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
-- Records of company_detail
-- ----------------------------
BEGIN;
INSERT INTO "public"."company_detail" VALUES ('72cadbe9-eaf7-4699-b034-00fbf15a8a05', '2020-09-30 08:27:44.232777', '2020-08-11 07:24:06.803', NULL, 'Elite Dental description', '7496b2db-69a1-4bcf-a59c-1190492b4dfd', 'ELite Dental', 'DENTAL', '123456');
COMMIT;

-- ----------------------------
-- Primary Key structure for table company_detail
-- ----------------------------
ALTER TABLE "public"."company_detail" ADD CONSTRAINT "company_detail_pk" PRIMARY KEY ("id");

-- ----------------------------
-- Foreign Keys structure for table company_detail
-- ----------------------------
ALTER TABLE "public"."company_detail" ADD CONSTRAINT "company_detail_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
