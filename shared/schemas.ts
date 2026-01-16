import { z } from "zod";

// ============================================================================
// DATA SOURCE SCHEMAS
// ============================================================================

export const createDataSourceSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().optional(),
  sourceType: z.enum(["SUKL", "NIKEZ", "WIKISKRIPTA", "OTHER"]),
  url: z.string().url().optional(),
  apiEndpoint: z.string().url().optional(),
  scrapingConfig: z.record(z.string(), z.any()).optional(),
});

export const updateDataSourceSchema = createDataSourceSchema.partial();

export type CreateDataSource = z.infer<typeof createDataSourceSchema>;
export type UpdateDataSource = z.infer<typeof updateDataSourceSchema>;

// ============================================================================
// DOCUMENT SCHEMAS
// ============================================================================

export const createDocumentSchema = z.object({
  dataSourceId: z.number().int().positive(),
  sourceId: z.string().optional(),
  title: z.string().min(1).max(512),
  description: z.string().optional(),
  url: z.string().url(),
  downloadUrl: z.string().url().optional(),
  documentType: z.enum(["GUIDELINE", "SPC", "PIL", "PROCEDURE", "ARTICLE", "OTHER"]),
  language: z.enum(["cs", "en"]).default("cs"),
  publishedDate: z.date().optional(),
  version: z.string().max(50).optional(),
  authors: z.array(z.string()).optional(),
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  contentHash: z.string().max(64).optional(),
});

export const updateDocumentSchema = createDocumentSchema.partial();

export const searchDocumentsSchema = z.object({
  query: z.string().min(1),
  limit: z.number().int().positive().default(50),
});

export type CreateDocument = z.infer<typeof createDocumentSchema>;
export type UpdateDocument = z.infer<typeof updateDocumentSchema>;
export type SearchDocuments = z.infer<typeof searchDocumentsSchema>;

// ============================================================================
// KNOWLEDGE UNIT SCHEMAS
// ============================================================================

export const evidenceSchema = z.object({
  level: z.enum(["A", "B", "C", "D"]),
  source: z.string(),
}).optional();

export const referenceSchema = z.object({
  documentId: z.string(),
  section: z.string().optional(),
  pageNumber: z.number().int().optional(),
});

export const createKnowledgeUnitSchema = z.object({
  documentId: z.string(),
  type: z.enum(["GUIDELINE", "RECOMMENDATION", "PROCEDURE", "DEFINITION", "INTERACTION", "CONTRAINDICATION"]),
  title: z.string().min(1).max(512),
  content: z.string().min(1),
  summary: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  category: z.string().max(255).optional(),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  evidence: evidenceSchema,
  references: z.array(referenceSchema).optional(),
  relatedUnits: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const updateKnowledgeUnitSchema = createKnowledgeUnitSchema.partial();

export const searchKnowledgeUnitsSchema = z.object({
  query: z.string().min(1),
  category: z.string().optional(),
  type: z.enum(["GUIDELINE", "RECOMMENDATION", "PROCEDURE", "DEFINITION", "INTERACTION", "CONTRAINDICATION"]).optional(),
  limit: z.number().int().positive().default(50),
});

export type CreateKnowledgeUnit = z.infer<typeof createKnowledgeUnitSchema>;
export type UpdateKnowledgeUnit = z.infer<typeof updateKnowledgeUnitSchema>;
export type SearchKnowledgeUnits = z.infer<typeof searchKnowledgeUnitsSchema>;

// ============================================================================
// DRUG PRODUCT SCHEMAS
// ============================================================================

export const activeIngredientSchema = z.object({
  name: z.string(),
  strength: z.string(),
  unit: z.string(),
});

export const createDrugProductSchema = z.object({
  suklId: z.string().min(1).max(50),
  name: z.string().min(1).max(512),
  genericName: z.string().max(512).optional(),
  activeIngredients: z.array(activeIngredientSchema).optional(),
  dosageForm: z.string().max(255).optional(),
  strength: z.string().max(255).optional(),
  route: z.string().max(255).optional(),
  atcCode: z.string().max(50).optional(),
  manufacturer: z.string().max(512).optional(),
  registrationNumber: z.string().max(50).optional(),
  registrationDate: z.date().optional(),
  spcUrl: z.string().url().optional(),
  pilUrl: z.string().url().optional(),
});

export const updateDrugProductSchema = createDrugProductSchema.partial();

export const searchDrugProductsSchema = z.object({
  query: z.string().min(1),
  atcCode: z.string().optional(),
  limit: z.number().int().positive().default(50),
});

export type CreateDrugProduct = z.infer<typeof createDrugProductSchema>;
export type UpdateDrugProduct = z.infer<typeof updateDrugProductSchema>;
export type SearchDrugProducts = z.infer<typeof searchDrugProductsSchema>;

// ============================================================================
// DRUG INTERACTION SCHEMAS
// ============================================================================

export const createDrugInteractionSchema = z.object({
  drug1Id: z.string(),
  drug2Id: z.string(),
  interactionType: z.enum(["CONTRAINDICATION", "CAUTION", "INTERACTION", "MONITORING"]),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  mechanism: z.string().optional(),
  clinicalEffect: z.string().optional(),
  management: z.string().optional(),
  evidence: evidenceSchema,
  references: z.array(z.object({
    documentId: z.string(),
    url: z.string().url().optional(),
  })).optional(),
});

export const updateDrugInteractionSchema = createDrugInteractionSchema.partial();

export type CreateDrugInteraction = z.infer<typeof createDrugInteractionSchema>;
export type UpdateDrugInteraction = z.infer<typeof updateDrugInteractionSchema>;

// ============================================================================
// PAGINATION SCHEMAS
// ============================================================================

export const paginationSchema = z.object({
  limit: z.number().int().positive().default(100),
  offset: z.number().int().nonnegative().default(0),
});

export type Pagination = z.infer<typeof paginationSchema>;
