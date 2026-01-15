import { pgTable, text, integer, timestamp, uuid, boolean } from "drizzle-orm/pg-core";
import { usersTable } from "./auth.schema";
import { relations } from "drizzle-orm";
import type { linkedin } from "better-auth";

export const userProfileTable = pgTable("user_profile", {
    id: uuid("id").primaryKey().defaultRandom().notNull(),
    bio: text("bio").notNull(),
    instagramUsername: text("instagram_username").notNull(),
    course: text("course").notNull(),
    graduationYear: integer("graduation_year").notNull(),

    userId: text("user_id").references(() => usersTable.id, { onDelete: 'cascade' }).unique().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
});

export const matchesTable = pgTable("matches", {
    id: uuid("id").primaryKey().defaultRandom().notNull(),
    likeBy: uuid("like_by").references(() => userProfileTable.id, { onDelete: 'cascade' }).notNull(),
    likeUser: uuid("like_user").references(() => userProfileTable.id, { onDelete: 'cascade' }).notNull(),
    mailSent: boolean("mail_sent").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userProfileRelations = relations(userProfileTable, ({ one }) => ({
    user: one(usersTable, {
        fields: [userProfileTable.userId],
        references: [usersTable.id],
    }),
    likeBy: one(matchesTable),
    likeUser: one(matchesTable)
}));

export const matchRelations = relations(matchesTable, ({ one }) => ({
    linkeBy: one(userProfileTable, {
        fields: [matchesTable.likeBy],
        references: [userProfileTable.id],
    }),
    likeUser: one(userProfileTable, {
        fields: [matchesTable.likeUser],
        references: [userProfileTable.id],
    }),
}));