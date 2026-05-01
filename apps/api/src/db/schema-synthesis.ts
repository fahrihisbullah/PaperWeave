import { pgTable, uuid, text, timestamp, jsonb, pgEnum, index } from 'drizzle-orm/pg-core'
import { projects } from './schema.js'
import { papers } from './schema.js'

export const relationTypeEnum = pgEnum('relation_type', [
  'supports',
  'contradicts',
  'extends',
  'uses_method_of',
  'shares_dataset',
  'cites',
  'related',
])

export const paperRelations = pgTable(
  'paper_relations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    project_id: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    source_paper_id: uuid('source_paper_id')
      .notNull()
      .references(() => papers.id, { onDelete: 'cascade' }),
    target_paper_id: uuid('target_paper_id')
      .notNull()
      .references(() => papers.id, { onDelete: 'cascade' }),
    relation_type: relationTypeEnum('relation_type').notNull(),
    description: text('description'),
    confidence: text('confidence'),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    projectIdx: index('paper_relations_project_idx').on(table.project_id),
    sourceIdx: index('paper_relations_source_idx').on(table.source_paper_id),
    targetIdx: index('paper_relations_target_idx').on(table.target_paper_id),
  })
)

export const themes = pgTable(
  'themes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    project_id: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    keywords: jsonb('keywords'),
    research_gaps: jsonb('research_gaps'),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    projectIdx: index('themes_project_idx').on(table.project_id),
  })
)

export const themePapers = pgTable(
  'theme_papers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    theme_id: uuid('theme_id')
      .notNull()
      .references(() => themes.id, { onDelete: 'cascade' }),
    paper_id: uuid('paper_id')
      .notNull()
      .references(() => papers.id, { onDelete: 'cascade' }),
    relevance_note: text('relevance_note'),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    themeIdx: index('theme_papers_theme_idx').on(table.theme_id),
    paperIdx: index('theme_papers_paper_idx').on(table.paper_id),
  })
)

export const reviewDrafts = pgTable(
  'review_drafts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    project_id: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    content_markdown: text('content_markdown').notNull(),
    structure: jsonb('structure'),
    model_provider: text('model_provider'),
    model_name: text('model_name'),
    prompt_version: text('prompt_version'),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    projectIdx: index('review_drafts_project_idx').on(table.project_id),
  })
)
