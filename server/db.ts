import { eq, and, like, desc, asc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users,
  InsertDataSource, dataSources,
  InsertDocument, documents,
  InsertKnowledgeUnit, knowledgeUnits,
  InsertDrugProduct, drugProducts,
  InsertDrugInteraction, drugInteractions,
  InsertEtlJob, etlJobs,
  InsertEtlJobLog, etlJobLogs,
  InsertAuditLog, auditLogs,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============================================================================
// USER OPERATIONS
// ============================================================================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// DATA SOURCE OPERATIONS
// ============================================================================

export async function createDataSource(data: InsertDataSource) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(dataSources).values(data);
  return result;
}

export async function getDataSources() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(dataSources).where(eq(dataSources.isActive, true));
}

export async function getDataSourceById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(dataSources).where(eq(dataSources.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateDataSource(id: number, data: Partial<InsertDataSource>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(dataSources).set(data).where(eq(dataSources.id, id));
}

// ============================================================================
// DOCUMENT OPERATIONS
// ============================================================================

export async function createDocument(data: InsertDocument) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(documents).values(data);
}

export async function getDocuments(limit: number = 100, offset: number = 0) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(documents)
    .where(eq(documents.status, 'ACTIVE'))
    .orderBy(desc(documents.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getDocumentById(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function searchDocuments(query: string, limit: number = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(documents)
    .where(
      and(
        eq(documents.status, 'ACTIVE'),
        like(documents.title, `%${query}%`)
      )
    )
    .limit(limit);
}

export async function updateDocument(id: string, data: Partial<InsertDocument>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(documents).set(data).where(eq(documents.id, id));
}

// ============================================================================
// KNOWLEDGE UNIT OPERATIONS
// ============================================================================

export async function createKnowledgeUnit(data: InsertKnowledgeUnit) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(knowledgeUnits).values(data);
}

export async function getKnowledgeUnits(limit: number = 100, offset: number = 0) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(knowledgeUnits)
    .orderBy(desc(knowledgeUnits.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getKnowledgeUnitById(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(knowledgeUnits).where(eq(knowledgeUnits.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function searchKnowledgeUnits(query: string, limit: number = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(knowledgeUnits)
    .where(
      like(knowledgeUnits.title, `%${query}%`)
    )
    .limit(limit);
}

export async function getKnowledgeUnitsByCategory(category: string, limit: number = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(knowledgeUnits)
    .where(eq(knowledgeUnits.category, category))
    .limit(limit);
}

export async function updateKnowledgeUnit(id: string, data: Partial<InsertKnowledgeUnit>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(knowledgeUnits).set(data).where(eq(knowledgeUnits.id, id));
}

// ============================================================================
// DRUG PRODUCT OPERATIONS
// ============================================================================

export async function createDrugProduct(data: InsertDrugProduct) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(drugProducts).values(data);
}

export async function getDrugProducts(limit: number = 100, offset: number = 0) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(drugProducts)
    .where(eq(drugProducts.status, 'ACTIVE'))
    .orderBy(asc(drugProducts.name))
    .limit(limit)
    .offset(offset);
}

export async function getDrugProductById(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(drugProducts).where(eq(drugProducts.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getDrugProductBySuklId(suklId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(drugProducts).where(eq(drugProducts.suklId, suklId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function searchDrugProducts(query: string, limit: number = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(drugProducts)
    .where(
      and(
        eq(drugProducts.status, 'ACTIVE'),
        like(drugProducts.name, `%${query}%`)
      )
    )
    .limit(limit);
}

export async function updateDrugProduct(id: string, data: Partial<InsertDrugProduct>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(drugProducts).set(data).where(eq(drugProducts.id, id));
}

// ============================================================================
// DRUG INTERACTION OPERATIONS
// ============================================================================

export async function createDrugInteraction(data: InsertDrugInteraction) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(drugInteractions).values(data);
}

export async function getDrugInteractions(limit: number = 100, offset: number = 0) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(drugInteractions)
    .orderBy(desc(drugInteractions.severity))
    .limit(limit)
    .offset(offset);
}

export async function getDrugInteractionById(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(drugInteractions).where(eq(drugInteractions.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getDrugInteractionsByDrug(drugId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(drugInteractions)
    .where(
      sql`${drugInteractions.drug1Id} = ${drugId} OR ${drugInteractions.drug2Id} = ${drugId}`
    );
}

export async function updateDrugInteraction(id: string, data: Partial<InsertDrugInteraction>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(drugInteractions).set(data).where(eq(drugInteractions.id, id));
}

// ============================================================================
// ETL JOB OPERATIONS
// ============================================================================

export async function createEtlJob(data: InsertEtlJob) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(etlJobs).values(data);
}

export async function getEtlJobs(limit: number = 100, offset: number = 0) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(etlJobs)
    .orderBy(desc(etlJobs.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getEtlJobById(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(etlJobs).where(eq(etlJobs.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateEtlJob(id: string, data: Partial<InsertEtlJob>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(etlJobs).set(data).where(eq(etlJobs.id, id));
}

// ============================================================================
// ETL JOB LOG OPERATIONS
// ============================================================================

export async function createEtlJobLog(data: InsertEtlJobLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(etlJobLogs).values(data);
}

export async function getEtlJobLogs(jobId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(etlJobLogs)
    .where(eq(etlJobLogs.jobId, jobId))
    .orderBy(asc(etlJobLogs.timestamp));
}

// ============================================================================
// AUDIT LOG OPERATIONS
// ============================================================================

export async function createAuditLog(data: InsertAuditLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(auditLogs).values(data);
}

export async function getAuditLogs(entityId: string, limit: number = 100) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(auditLogs)
    .where(eq(auditLogs.entityId, entityId))
    .orderBy(desc(auditLogs.timestamp))
    .limit(limit);
}
