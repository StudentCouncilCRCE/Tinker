import { pgTable, text, integer, timestamp, uuid, boolean } from "drizzle-orm/pg-core";
import { usersTable } from "./auth.schema";
import { relations } from "drizzle-orm";

export const userProfileTable = pgTable("user_profile", {
    userId: text("user_id").references(() => usersTable.id, { onDelete: 'cascade' }).notNull().primaryKey(),
    name: text("name").notNull(),
    bio: text("bio").notNull(),
    instagramUsername: text("instagram_username").notNull(),
    image: text("image").notNull(),
    course: text("course").notNull(),
    graduationYear: integer("graduation_year").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
});

export const matchesTable = pgTable("matches", {
    id: uuid("id").primaryKey().defaultRandom().notNull(),
    likeFormUser: text("like_from").references(() => userProfileTable.userId, { onDelete: 'cascade' }).notNull(),
    likeToUser: text("like_to").references(() => userProfileTable.userId, { onDelete: 'cascade' }).notNull(),
    mailSent: boolean("mail_sent").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userProfileRelations = relations(userProfileTable, ({ one }) => ({
    user: one(usersTable, {
        fields: [userProfileTable.userId],
        references: [usersTable.id],
    }),
    likeForm: one(matchesTable),
    likeTo: one(matchesTable)
}));

export const matchRelations = relations(matchesTable, ({ one }) => ({
    likeFormUser: one(userProfileTable, {
        fields: [matchesTable.likeFormUser],
        references: [userProfileTable.userId],
    }),
    likeToUser: one(userProfileTable, {
        fields: [matchesTable.likeToUser],
        references: [userProfileTable.userId],
    }),
}));