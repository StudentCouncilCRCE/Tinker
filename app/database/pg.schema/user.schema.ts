import { pgTable, text, integer, timestamp, uuid } from "drizzle-orm/pg-core";
import { usersTable } from "./auth.schema";
import { relations } from "drizzle-orm";

export const userProfileTable = pgTable("user_profile", {
    id: uuid("id").primaryKey().defaultRandom(),
    bio: text("bio").notNull(),
    instagramUsername: text("instagram_username").notNull(),
    course: text("course").notNull(),
    graduationYear: integer("graduation_year").notNull(),

    userId: text("user_id").references(() => usersTable.id, { onDelete: 'cascade' }).unique().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
});

export const userRelations = relations(usersTable, ({ one }) => ({
    profile: one(userProfileTable),
}));

export const userProfileRelations = relations(userProfileTable, ({ one }) => ({
    user: one(usersTable, {
        fields: [userProfileTable.userId],
        references: [usersTable.id],
    }),
}));