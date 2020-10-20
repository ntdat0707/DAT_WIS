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

 Date: 20/10/2020 15:53:38
*/


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
-- Records of location_image
-- ----------------------------
BEGIN;
INSERT INTO "public"."location_image" VALUES ('ed039d5b-ccb1-4626-9b02-e05bac7af6ba', '5ffbd124-9d20-4108-8736-a46518f6d850', 'https://space-sgp1-01.sgp1.digitaloceanspaces.com/psbF13NtWH5Qf5yggWW-1.jpg', 't', '2020-09-23 09:10:47', '2020-09-23 09:10:47', NULL);
INSERT INTO "public"."location_image" VALUES ('c5203e4a-8ba3-45a9-9fd1-752c01080da6', '5ffbd124-9d20-4108-8736-a46518f6d850', 'https://space-sgp1-01.sgp1.digitaloceanspaces.com/ERmyjIdd8Laj8xAG_AKh-2.jpg', 'f', '2020-09-23 09:10:47', '2020-09-23 09:10:47', NULL);
INSERT INTO "public"."location_image" VALUES ('1fa8357f-3aee-424f-a6d1-a0cfeaba90e0', '5ffbd124-9d20-4108-8736-a46518f6d850', 'https://space-sgp1-01.sgp1.digitaloceanspaces.com/CSvi2hJPoue4Y_xWlsWJ-3.jpg', 'f', '2020-09-23 09:10:47', '2020-09-23 09:10:47', NULL);
INSERT INTO "public"."location_image" VALUES ('6f288416-0dcc-484a-94df-3a9fb8eda484', 'ee44fb05-12ce-440f-a538-6958b9dae7e1', 'https://space-sgp1-01.sgp1.digitaloceanspaces.com/BW5fs1NJcdax3vV3PkB-4.jpg', 't', '2020-09-23 09:11:13', '2020-09-23 09:11:13', NULL);
INSERT INTO "public"."location_image" VALUES ('1b4cbc1e-4180-4bbf-91f7-0d2413341d29', 'ee44fb05-12ce-440f-a538-6958b9dae7e1', 'https://space-sgp1-01.sgp1.digitaloceanspaces.com/kZqQVVv0yEePrG7mz6A--5.jpg', 'f', '2020-09-23 09:11:13', '2020-09-23 09:11:13', NULL);
INSERT INTO "public"."location_image" VALUES ('6728678b-b072-428e-a03c-5f9e879383b5', 'ee44fb05-12ce-440f-a538-6958b9dae7e1', 'https://space-sgp1-01.sgp1.digitaloceanspaces.com/Zj5TsQ4eF6iLxQrHNjb3-6.jpg', 'f', '2020-09-23 09:11:13', '2020-09-23 09:11:13', NULL);
INSERT INTO "public"."location_image" VALUES ('e5419ec1-38f9-47ef-a8eb-da4931703812', 'fd25ff79-2339-4605-8f30-41a1f0701733', 'https://space-sgp1-01.sgp1.digitaloceanspaces.com/OETwk-ditkL_fmgXJFt-cn1.jpg', 't', '2020-10-16 09:00:24.369792', '2020-10-16 09:00:24.369792', NULL);
INSERT INTO "public"."location_image" VALUES ('47798ecf-39c6-41d8-b098-09d20f471d6f', 'b75306b0-11d8-474c-95d5-985c4d7ca2fa', 'https://space-sgp1-01.sgp1.digitaloceanspaces.com/xxKDP0v47Ew66WF-aF9-cn2.jpg', 't', '2020-10-16 09:31:42.071633', '2020-10-16 09:31:42.071633', NULL);
INSERT INTO "public"."location_image" VALUES ('6e3af8f5-f00a-424b-9a11-87624f553187', '4e904364-a76e-4a15-8eeb-4efa5a57cb13', 'https://space-sgp1-01.sgp1.digitaloceanspaces.com/zt1cpVlnTxtQaSgOH17-cn3.jpg', 't', '2020-10-16 11:04:13.378372', '2020-10-16 11:04:13.378372', NULL);
COMMIT;

-- ----------------------------
-- Primary Key structure for table location_image
-- ----------------------------
ALTER TABLE "public"."location_image" ADD CONSTRAINT "location_image_pk" PRIMARY KEY ("id");

-- ----------------------------
-- Foreign Keys structure for table location_image
-- ----------------------------
ALTER TABLE "public"."location_image" ADD CONSTRAINT "location_image_fk" FOREIGN KEY ("location_id") REFERENCES "public"."location" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
