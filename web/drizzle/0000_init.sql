CREATE TYPE "public"."application_status" AS ENUM('신청 대기', '수락', '거절', '신청 취소');--> statement-breakpoint
CREATE TYPE "public"."attendance_status" AS ENUM('확인 대기', '참여 확인', '불참 확인', '검토 중');--> statement-breakpoint
CREATE TYPE "public"."change_status" AS ENUM('제안됨', '변경 확인 중', '반영됨', '반려됨');--> statement-breakpoint
CREATE TYPE "public"."confirm_mode" AS ENUM('auto', 'manual');--> statement-breakpoint
CREATE TYPE "public"."host_kind" AS ENUM('business', 'resident');--> statement-breakpoint
CREATE TYPE "public"."host_status" AS ENUM('확인 대기', '확인 완료', '보류', '정지');--> statement-breakpoint
CREATE TYPE "public"."post_kind" AS ENUM('여행 후기', '코스 공유', '질문');--> statement-breakpoint
CREATE TYPE "public"."report_status" AS ENUM('검토 중', '처리 완료', '반려');--> statement-breakpoint
CREATE TYPE "public"."theme_status" AS ENUM('모집 중', '모집 마감', '일정 조율 중', '일정 확정', '여행 완료', '취소');--> statement-breakpoint
CREATE TABLE "applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"theme_id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"party" integer DEFAULT 1 NOT NULL,
	"message" text DEFAULT '' NOT NULL,
	"status" "application_status" DEFAULT '신청 대기' NOT NULL,
	"invite_token" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"decided_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "attendance" (
	"theme_id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "attendance_status" DEFAULT '확인 대기' NOT NULL,
	"note" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "attendance_theme_id_user_id_pk" PRIMARY KEY("theme_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "blocks" (
	"user_id" uuid NOT NULL,
	"blocked_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "blocks_user_id_blocked_id_pk" PRIMARY KEY("user_id","blocked_id")
);
--> statement-breakpoint
CREATE TABLE "change_confirms" (
	"change_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "change_confirms_change_id_user_id_pk" PRIMARY KEY("change_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "changes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"theme_id" text NOT NULL,
	"proposer_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"label" text NOT NULL,
	"from_text" text NOT NULL,
	"to_text" text NOT NULL,
	"source" text DEFAULT '직접' NOT NULL,
	"major" boolean DEFAULT false NOT NULL,
	"status" "change_status" DEFAULT '제안됨' NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"decided_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "checkins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"theme_id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"place_id" text NOT NULL,
	"method" text DEFAULT 'qr' NOT NULL,
	"first_visit" boolean,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" text NOT NULL,
	"author_id" uuid NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hosts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" "host_kind" NOT NULL,
	"name" text NOT NULL,
	"area" text NOT NULL,
	"intro" text DEFAULT '' NOT NULL,
	"contact" text DEFAULT '' NOT NULL,
	"status" "host_status" DEFAULT '확인 대기' NOT NULL,
	"confirm_mode" "confirm_mode" DEFAULT 'auto' NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"verified_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"theme_id" text NOT NULL,
	"user_id" uuid,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"href" text DEFAULT '/' NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "peer_reviews" (
	"theme_id" text NOT NULL,
	"from_user" uuid NOT NULL,
	"to_user" uuid NOT NULL,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "peer_reviews_theme_id_from_user_to_user_pk" PRIMARY KEY("theme_id","from_user","to_user")
);
--> statement-breakpoint
CREATE TABLE "places" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"short" text,
	"area" text NOT NULL,
	"kind" text NOT NULL,
	"group" text NOT NULL,
	"region" text,
	"checked_on" date,
	"source_url" text,
	"image" text NOT NULL,
	"image_alt" text NOT NULL,
	"image_bg" text DEFAULT '#e6e1d8' NOT NULL,
	"indoor" boolean DEFAULT false NOT NULL,
	"cost" integer DEFAULT 0 NOT NULL,
	"stamp" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" "post_kind" NOT NULL,
	"author_id" uuid NOT NULL,
	"theme_id" text,
	"place_id" text,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"photos" text[] DEFAULT '{}'::text[] NOT NULL,
	"transport" text,
	"changed_place" text,
	"spent_won" integer,
	"public" boolean DEFAULT true NOT NULL,
	"allow_copy" boolean DEFAULT true NOT NULL,
	"visited_on" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reporter_id" uuid NOT NULL,
	"target_user_id" uuid,
	"target_theme_id" text,
	"reason" text NOT NULL,
	"detail" text DEFAULT '' NOT NULL,
	"status" "report_status" DEFAULT '검토 중' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "request_skips" (
	"host_id" text NOT NULL,
	"request_id" uuid NOT NULL,
	CONSTRAINT "request_skips_host_id_request_id_pk" PRIMARY KEY("host_id","request_id")
);
--> statement-breakpoint
CREATE TABLE "saved_courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"core_place_id" text NOT NULL,
	"title" text NOT NULL,
	"day" date,
	"stops" text[] NOT NULL,
	"from_post_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"user_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"key" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_user_id_kind_key_pk" PRIMARY KEY("user_id","kind","key")
);
--> statement-breakpoint
CREATE TABLE "theme_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"body" text NOT NULL,
	"when" text NOT NULL,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"same" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "theme_stops" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"theme_id" text NOT NULL,
	"ord" integer NOT NULL,
	"place_id" text NOT NULL,
	"time" text NOT NULL,
	"stay_min" integer NOT NULL,
	"next" text,
	"fixed" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "themes" (
	"id" text PRIMARY KEY NOT NULL,
	"host_id" text NOT NULL,
	"core_place_id" text NOT NULL,
	"title" text NOT NULL,
	"intro" text DEFAULT '' NOT NULL,
	"day" date NOT NULL,
	"start" text NOT NULL,
	"end" text NOT NULL,
	"min" integer NOT NULL,
	"max" integer NOT NULL,
	"deadline" timestamp with time zone NOT NULL,
	"origin" text DEFAULT '상봉역' NOT NULL,
	"travel_min" integer DEFAULT 45 NOT NULL,
	"transit" boolean DEFAULT true NOT NULL,
	"cost_won" integer DEFAULT 0 NOT NULL,
	"meet" text DEFAULT '' NOT NULL,
	"include" text DEFAULT '' NOT NULL,
	"exclude" text DEFAULT '' NOT NULL,
	"activities" text[] DEFAULT '{}'::text[] NOT NULL,
	"status" "theme_status" DEFAULT '모집 중' NOT NULL,
	"confirm_mode" "confirm_mode" DEFAULT 'auto' NOT NULL,
	"schedule_version" integer DEFAULT 1 NOT NULL,
	"meet_detail" text DEFAULT '' NOT NULL,
	"cancel_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"handle" text NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"password_hash" text,
	"kakao_id" text,
	"role" text DEFAULT 'user' NOT NULL,
	"adult" boolean DEFAULT false NOT NULL,
	"origin" text,
	"mbti" text,
	"mbti_public" boolean DEFAULT false NOT NULL,
	"prefs" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"privacy" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"onboarded" boolean DEFAULT false NOT NULL,
	"demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_theme_id_themes_id_fk" FOREIGN KEY ("theme_id") REFERENCES "public"."themes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_theme_id_themes_id_fk" FOREIGN KEY ("theme_id") REFERENCES "public"."themes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_blocked_id_users_id_fk" FOREIGN KEY ("blocked_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "change_confirms" ADD CONSTRAINT "change_confirms_change_id_changes_id_fk" FOREIGN KEY ("change_id") REFERENCES "public"."changes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "change_confirms" ADD CONSTRAINT "change_confirms_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "changes" ADD CONSTRAINT "changes_theme_id_themes_id_fk" FOREIGN KEY ("theme_id") REFERENCES "public"."themes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "changes" ADD CONSTRAINT "changes_proposer_id_users_id_fk" FOREIGN KEY ("proposer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkins" ADD CONSTRAINT "checkins_theme_id_themes_id_fk" FOREIGN KEY ("theme_id") REFERENCES "public"."themes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkins" ADD CONSTRAINT "checkins_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkins" ADD CONSTRAINT "checkins_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hosts" ADD CONSTRAINT "hosts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_theme_id_themes_id_fk" FOREIGN KEY ("theme_id") REFERENCES "public"."themes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "peer_reviews" ADD CONSTRAINT "peer_reviews_theme_id_themes_id_fk" FOREIGN KEY ("theme_id") REFERENCES "public"."themes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "peer_reviews" ADD CONSTRAINT "peer_reviews_from_user_users_id_fk" FOREIGN KEY ("from_user") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "peer_reviews" ADD CONSTRAINT "peer_reviews_to_user_users_id_fk" FOREIGN KEY ("to_user") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_theme_id_themes_id_fk" FOREIGN KEY ("theme_id") REFERENCES "public"."themes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_target_user_id_users_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_target_theme_id_themes_id_fk" FOREIGN KEY ("target_theme_id") REFERENCES "public"."themes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_skips" ADD CONSTRAINT "request_skips_host_id_hosts_id_fk" FOREIGN KEY ("host_id") REFERENCES "public"."hosts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_skips" ADD CONSTRAINT "request_skips_request_id_theme_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."theme_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_courses" ADD CONSTRAINT "saved_courses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_courses" ADD CONSTRAINT "saved_courses_core_place_id_places_id_fk" FOREIGN KEY ("core_place_id") REFERENCES "public"."places"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_courses" ADD CONSTRAINT "saved_courses_from_post_id_posts_id_fk" FOREIGN KEY ("from_post_id") REFERENCES "public"."posts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "theme_requests" ADD CONSTRAINT "theme_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "theme_stops" ADD CONSTRAINT "theme_stops_theme_id_themes_id_fk" FOREIGN KEY ("theme_id") REFERENCES "public"."themes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "theme_stops" ADD CONSTRAINT "theme_stops_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "themes" ADD CONSTRAINT "themes_host_id_hosts_id_fk" FOREIGN KEY ("host_id") REFERENCES "public"."hosts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "themes" ADD CONSTRAINT "themes_core_place_id_places_id_fk" FOREIGN KEY ("core_place_id") REFERENCES "public"."places"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "applications_once" ON "applications" USING btree ("theme_id","user_id");--> statement-breakpoint
CREATE INDEX "applications_user" ON "applications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "changes_theme" ON "changes" USING btree ("theme_id");--> statement-breakpoint
CREATE UNIQUE INDEX "checkins_once" ON "checkins" USING btree ("theme_id","user_id");--> statement-breakpoint
CREATE INDEX "checkins_place" ON "checkins" USING btree ("place_id");--> statement-breakpoint
CREATE UNIQUE INDEX "hosts_user" ON "hosts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "messages_theme" ON "messages" USING btree ("theme_id","created_at");--> statement-breakpoint
CREATE INDEX "notifications_user" ON "notifications" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "posts_created" ON "posts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "sessions_user" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "stops_order" ON "theme_stops" USING btree ("theme_id","ord");--> statement-breakpoint
CREATE INDEX "themes_day" ON "themes" USING btree ("day");--> statement-breakpoint
CREATE INDEX "themes_host" ON "themes" USING btree ("host_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_handle" ON "users" USING btree ("handle");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email" ON "users" USING btree (lower("email"));--> statement-breakpoint
CREATE UNIQUE INDEX "users_kakao" ON "users" USING btree ("kakao_id");