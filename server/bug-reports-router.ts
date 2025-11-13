import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { bugReports } from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";

export const bugReportsRouter = router({
  // Criar novo bug report (público - qualquer usuário pode reportar)
  create: publicProcedure
    .input(
      z.object({
        description: z.string().min(10, "Descrição deve ter no mínimo 10 caracteres"),
        page: z.string().optional(),
        userAgent: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      
      const [result] = await db.insert(bugReports).values({
        userId: ctx.user?.id || null,
        description: input.description,
        page: input.page || null,
        userAgent: input.userAgent || null,
        status: "pending",
        priority: "medium",
      });

      return {
        success: true,
        id: result.insertId,
        message: "Bug reportado com sucesso! Obrigado pelo feedback.",
      };
    }),

  // Listar todos os bug reports (apenas admin)
  list: protectedProcedure
    .input(
      z.object({
        status: z.enum(["pending", "in_progress", "resolved", "closed", "all"]).optional().default("all"),
        limit: z.number().optional().default(50),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      
      let query = db.select().from(bugReports).orderBy(desc(bugReports.createdAt));
      
      if (input.status !== "all") {
        query = query.where(eq(bugReports.status, input.status));
      }
      
      const reports = await query.limit(input.limit);
      
      return reports;
    }),

  // Atualizar status de um bug report (apenas admin)
  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["pending", "in_progress", "resolved", "closed"]),
        priority: z.enum(["low", "medium", "high", "critical"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      
      const updateData: any = {
        status: input.status,
      };
      
      if (input.priority) {
        updateData.priority = input.priority;
      }
      
      await db.update(bugReports).set(updateData).where(eq(bugReports.id, input.id));
      
      return {
        success: true,
        message: "Status atualizado com sucesso!",
      };
    }),

  // Deletar bug report (apenas admin)
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      
      await db.delete(bugReports).where(eq(bugReports.id, input.id));
      
      return {
        success: true,
        message: "Bug report deletado com sucesso!",
      };
    }),
});
