import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as db from "./db";
import { nanoid } from "nanoid";

describe("Database Operations", () => {
  let testDocId: string;
  let testDataSourceId: number;

  beforeAll(async () => {
    // Initialize database connection if needed
    const dbInstance = await db.getDb();
    if (!dbInstance) {
      console.warn("Database not available for testing");
    }
  });

  describe("Data Sources", () => {
    it("should create a data source", async () => {
      const result = await db.createDataSource({
        name: "Test SÚKL Source",
        description: "Test data source for SÚKL",
        sourceType: "SUKL",
        url: "https://opendata.sukl.cz",
        isActive: true,
      });
      expect(result).toBeDefined();
    });

    it("should get all active data sources", async () => {
      const sources = await db.getDataSources();
      expect(Array.isArray(sources)).toBe(true);
    });
  });

  describe("Documents", () => {
    it("should create a document", async () => {
      testDocId = nanoid();
      const result = await db.createDocument({
        id: testDocId,
        dataSourceId: 1,
        title: "Test Guideline",
        description: "Test clinical guideline",
        url: "https://example.com/guideline",
        documentType: "GUIDELINE",
        language: "cs",
        status: "ACTIVE",
      });
      expect(result).toBeDefined();
    });

    it("should retrieve a document by ID", async () => {
      const doc = await db.getDocumentById(testDocId);
      expect(doc).toBeDefined();
      expect(doc?.title).toBe("Test Guideline");
    });

    it("should search documents", async () => {
      const results = await db.searchDocuments("Guideline", 10);
      expect(Array.isArray(results)).toBe(true);
    });

    it("should list documents with pagination", async () => {
      const docs = await db.getDocuments(10, 0);
      expect(Array.isArray(docs)).toBe(true);
    });

    it("should update a document", async () => {
      const result = await db.updateDocument(testDocId, {
        title: "Updated Test Guideline",
      });
      expect(result).toBeDefined();

      const updated = await db.getDocumentById(testDocId);
      expect(updated?.title).toBe("Updated Test Guideline");
    });
  });

  describe("Knowledge Units", () => {
    it("should create a knowledge unit", async () => {
      const unitId = nanoid();
      const result = await db.createKnowledgeUnit({
        id: unitId,
        documentId: testDocId,
        type: "GUIDELINE",
        title: "Test Knowledge Unit",
        content: "# Test Content\nThis is a test knowledge unit.",
        summary: "Test summary",
        category: "Cardiology",
        severity: "HIGH",
      });
      expect(result).toBeDefined();
    });

    it("should search knowledge units", async () => {
      const results = await db.searchKnowledgeUnits("Test", 10);
      expect(Array.isArray(results)).toBe(true);
    });

    it("should get knowledge units by category", async () => {
      const results = await db.getKnowledgeUnitsByCategory("Cardiology", 10);
      expect(Array.isArray(results)).toBe(true);
    });

    it("should list knowledge units with pagination", async () => {
      const units = await db.getKnowledgeUnits(10, 0);
      expect(Array.isArray(units)).toBe(true);
    });
  });

  describe("Drug Products", () => {
    it("should create a drug product", async () => {
      const productId = nanoid();
      const result = await db.createDrugProduct({
        id: productId,
        suklId: "SUKL123456",
        name: "Test Drug Product",
        genericName: "testdrug",
        dosageForm: "tablet",
        strength: "100mg",
        atcCode: "A01AA01",
        manufacturer: "Test Pharma",
        registrationNumber: "REG123",
        status: "ACTIVE",
      });
      expect(result).toBeDefined();
    });

    it("should search drug products", async () => {
      const results = await db.searchDrugProducts("Test", 10);
      expect(Array.isArray(results)).toBe(true);
    });

    it("should list drug products with pagination", async () => {
      const products = await db.getDrugProducts(10, 0);
      expect(Array.isArray(products)).toBe(true);
    });
  });

  describe("Drug Interactions", () => {
    it("should create a drug interaction", async () => {
      const drugId1 = nanoid();
      const drugId2 = nanoid();

      // Create two drugs first
      await db.createDrugProduct({
        id: drugId1,
        suklId: "SUKL001",
        name: "Drug 1",
        status: "ACTIVE",
      });

      await db.createDrugProduct({
        id: drugId2,
        suklId: "SUKL002",
        name: "Drug 2",
        status: "ACTIVE",
      });

      const result = await db.createDrugInteraction({
        id: nanoid(),
        drug1Id: drugId1,
        drug2Id: drugId2,
        interactionType: "CONTRAINDICATION",
        severity: "HIGH",
        mechanism: "Test mechanism",
        clinicalEffect: "Test effect",
      });
      expect(result).toBeDefined();
    });

    it("should list drug interactions with pagination", async () => {
      const interactions = await db.getDrugInteractions(10, 0);
      expect(Array.isArray(interactions)).toBe(true);
    });
  });

  describe("ETL Jobs", () => {
    it("should create an ETL job", async () => {
      const jobId = nanoid();
      const result = await db.createEtlJob({
        id: jobId,
        dataSourceId: 1,
        jobType: "SCRAPE",
        status: "PENDING",
      });
      expect(result).toBeDefined();
    });

    it("should list ETL jobs with pagination", async () => {
      const jobs = await db.getEtlJobs(10, 0);
      expect(Array.isArray(jobs)).toBe(true);
    });
  });

  describe("Audit Logs", () => {
    it("should create an audit log", async () => {
      const result = await db.createAuditLog({
        id: nanoid(),
        entityType: "document",
        entityId: testDocId,
        action: "CREATE",
        userId: "test-user",
        changes: { title: "Test Guideline" },
      });
      expect(result).toBeDefined();
    });

    it("should retrieve audit logs for an entity", async () => {
      const logs = await db.getAuditLogs(testDocId, 10);
      expect(Array.isArray(logs)).toBe(true);
    });
  });

  afterAll(async () => {
    // Cleanup if needed
  });
});
