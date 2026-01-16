import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import * as db from "./db";
import * as schemas from "@shared/schemas";
import { z } from "zod";
import { createAuditLog } from "./db";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Helper to create audit log
async function logAudit(
  entityType: string,
  entityId: string,
  action: string,
  userId: string | undefined,
  changes: Record<string, any>,
  ctx: any
) {
  try {
    await createAuditLog({
      id: nanoid(),
      entityType,
      entityId,
      action: action as any,
      userId,
      changes,
      ipAddress: ctx.req?.ip,
      userAgent: ctx.req?.headers?.["user-agent"],
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
  }
}

// ============================================================================
// DATA SOURCES ROUTER
// ============================================================================

const dataSourcesRouter = router({
  list: publicProcedure.query(async () => {
    try {
      return await db.getDataSources();
    } catch (error) {
      console.error("Error listing data sources:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to list data sources",
      });
    }
  }),

  getById: publicProcedure
    .input(z.object({ id: z.number().int() }))
    .query(async ({ input }) => {
      try {
        const source = await db.getDataSourceById(input.id);
        if (!source) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Data source not found",
          });
        }
        return source;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error getting data source:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get data source",
        });
      }
    }),

  create: protectedProcedure
    .input(schemas.createDataSourceSchema)
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "editor") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins and editors can create data sources",
        });
      }

      try {
        const id = nanoid();
        await db.createDataSource({
          ...input,
          id: undefined,
        });

        await logAudit("data_source", id.toString(), "CREATE", ctx.user.id.toString(), input, ctx);

        return { success: true, message: "Data source created" };
      } catch (error) {
        console.error("Error creating data source:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create data source",
        });
      }
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number().int(),
        data: schemas.updateDataSourceSchema,
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "editor") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins and editors can update data sources",
        });
      }

      try {
        await db.updateDataSource(input.id, input.data);
        await logAudit("data_source", input.id.toString(), "UPDATE", ctx.user.id.toString(), input.data, ctx);

        return { success: true, message: "Data source updated" };
      } catch (error) {
        console.error("Error updating data source:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update data source",
        });
      }
    }),
});

// ============================================================================
// DOCUMENTS ROUTER
// ============================================================================

const documentsRouter = router({
  list: publicProcedure
    .input(schemas.paginationSchema)
    .query(async ({ input }) => {
      try {
        return await db.getDocuments(input.limit, input.offset);
      } catch (error) {
        console.error("Error listing documents:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to list documents",
        });
      }
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      try {
        const doc = await db.getDocumentById(input.id);
        if (!doc) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Document not found",
          });
        }
        return doc;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error getting document:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get document",
        });
      }
    }),

  search: publicProcedure
    .input(schemas.searchDocumentsSchema)
    .query(async ({ input }) => {
      try {
        return await db.searchDocuments(input.query, input.limit);
      } catch (error) {
        console.error("Error searching documents:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to search documents",
        });
      }
    }),

  create: protectedProcedure
    .input(schemas.createDocumentSchema)
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "editor") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins and editors can create documents",
        });
      }

      try {
        const id = nanoid();
        await db.createDocument({
          ...input,
          id,
        });

        await logAudit("document", id, "CREATE", ctx.user.id.toString(), input, ctx);

        return { success: true, id, message: "Document created" };
      } catch (error) {
        console.error("Error creating document:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create document",
        });
      }
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: schemas.updateDocumentSchema,
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "editor") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins and editors can update documents",
        });
      }

      try {
        await db.updateDocument(input.id, input.data);
        await logAudit("document", input.id, "UPDATE", ctx.user.id.toString(), input.data, ctx);

        return { success: true, message: "Document updated" };
      } catch (error) {
        console.error("Error updating document:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update document",
        });
      }
    }),
});

// ============================================================================
// KNOWLEDGE UNITS ROUTER
// ============================================================================

const knowledgeUnitsRouter = router({
  list: publicProcedure
    .input(schemas.paginationSchema)
    .query(async ({ input }) => {
      try {
        return await db.getKnowledgeUnits(input.limit, input.offset);
      } catch (error) {
        console.error("Error listing knowledge units:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to list knowledge units",
        });
      }
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      try {
        const unit = await db.getKnowledgeUnitById(input.id);
        if (!unit) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Knowledge unit not found",
          });
        }
        return unit;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error getting knowledge unit:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get knowledge unit",
        });
      }
    }),

  search: publicProcedure
    .input(schemas.searchKnowledgeUnitsSchema)
    .query(async ({ input }) => {
      try {
        return await db.searchKnowledgeUnits(input.query, input.limit);
      } catch (error) {
        console.error("Error searching knowledge units:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to search knowledge units",
        });
      }
    }),

  getByCategory: publicProcedure
    .input(z.object({ category: z.string(), limit: z.number().int().positive().default(50) }))
    .query(async ({ input }) => {
      try {
        return await db.getKnowledgeUnitsByCategory(input.category, input.limit);
      } catch (error) {
        console.error("Error getting knowledge units by category:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get knowledge units",
        });
      }
    }),

  create: protectedProcedure
    .input(schemas.createKnowledgeUnitSchema)
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "editor") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins and editors can create knowledge units",
        });
      }

      try {
        const id = nanoid();
        await db.createKnowledgeUnit({
          ...input,
          id,
        });

        await logAudit("knowledge_unit", id, "CREATE", ctx.user.id.toString(), input, ctx);

        return { success: true, id, message: "Knowledge unit created" };
      } catch (error) {
        console.error("Error creating knowledge unit:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create knowledge unit",
        });
      }
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: schemas.updateKnowledgeUnitSchema,
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "editor") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins and editors can update knowledge units",
        });
      }

      try {
        await db.updateKnowledgeUnit(input.id, input.data);
        await logAudit("knowledge_unit", input.id, "UPDATE", ctx.user.id.toString(), input.data, ctx);

        return { success: true, message: "Knowledge unit updated" };
      } catch (error) {
        console.error("Error updating knowledge unit:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update knowledge unit",
        });
      }
    }),
});

// ============================================================================
// DRUG PRODUCTS ROUTER
// ============================================================================

const drugProductsRouter = router({
  list: publicProcedure
    .input(schemas.paginationSchema)
    .query(async ({ input }) => {
      try {
        return await db.getDrugProducts(input.limit, input.offset);
      } catch (error) {
        console.error("Error listing drug products:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to list drug products",
        });
      }
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      try {
        const product = await db.getDrugProductById(input.id);
        if (!product) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Drug product not found",
          });
        }
        return product;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error getting drug product:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get drug product",
        });
      }
    }),

  search: publicProcedure
    .input(schemas.searchDrugProductsSchema)
    .query(async ({ input }) => {
      try {
        return await db.searchDrugProducts(input.query, input.limit);
      } catch (error) {
        console.error("Error searching drug products:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to search drug products",
        });
      }
    }),

  create: protectedProcedure
    .input(schemas.createDrugProductSchema)
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "editor") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins and editors can create drug products",
        });
      }

      try {
        const id = nanoid();
        await db.createDrugProduct({
          ...input,
          id,
        });

        await logAudit("drug_product", id, "CREATE", ctx.user.id.toString(), input, ctx);

        return { success: true, id, message: "Drug product created" };
      } catch (error) {
        console.error("Error creating drug product:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create drug product",
        });
      }
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: schemas.updateDrugProductSchema,
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "editor") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins and editors can update drug products",
        });
      }

      try {
        await db.updateDrugProduct(input.id, input.data);
        await logAudit("drug_product", input.id, "UPDATE", ctx.user.id.toString(), input.data, ctx);

        return { success: true, message: "Drug product updated" };
      } catch (error) {
        console.error("Error updating drug product:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update drug product",
        });
      }
    }),
});

// ============================================================================
// DRUG INTERACTIONS ROUTER
// ============================================================================

const drugInteractionsRouter = router({
  list: publicProcedure
    .input(schemas.paginationSchema)
    .query(async ({ input }) => {
      try {
        return await db.getDrugInteractions(input.limit, input.offset);
      } catch (error) {
        console.error("Error listing drug interactions:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to list drug interactions",
        });
      }
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      try {
        const interaction = await db.getDrugInteractionById(input.id);
        if (!interaction) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Drug interaction not found",
          });
        }
        return interaction;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error getting drug interaction:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get drug interaction",
        });
      }
    }),

  getByDrug: publicProcedure
    .input(z.object({ drugId: z.string() }))
    .query(async ({ input }) => {
      try {
        return await db.getDrugInteractionsByDrug(input.drugId);
      } catch (error) {
        console.error("Error getting drug interactions:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get drug interactions",
        });
      }
    }),

  create: protectedProcedure
    .input(schemas.createDrugInteractionSchema)
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "editor") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins and editors can create drug interactions",
        });
      }

      try {
        const id = nanoid();
        await db.createDrugInteraction({
          ...input,
          id,
        });

        await logAudit("drug_interaction", id, "CREATE", ctx.user.id.toString(), input, ctx);

        return { success: true, id, message: "Drug interaction created" };
      } catch (error) {
        console.error("Error creating drug interaction:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create drug interaction",
        });
      }
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: schemas.updateDrugInteractionSchema,
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "editor") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins and editors can update drug interactions",
        });
      }

      try {
        await db.updateDrugInteraction(input.id, input.data);
        await logAudit("drug_interaction", input.id, "UPDATE", ctx.user.id.toString(), input.data, ctx);

        return { success: true, message: "Drug interaction updated" };
      } catch (error) {
        console.error("Error updating drug interaction:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update drug interaction",
        });
      }
    }),
});

// ============================================================================
// MAIN ROUTER
// ============================================================================

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  dataSources: dataSourcesRouter,
  documents: documentsRouter,
  knowledgeUnits: knowledgeUnitsRouter,
  drugProducts: drugProductsRouter,
  drugInteractions: drugInteractionsRouter,
});

export type AppRouter = typeof appRouter;
