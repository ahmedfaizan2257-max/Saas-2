import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cookieParser from "cookie-parser";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { z } from "zod";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "medicare-pro-secret-key-123";

async function seedAdmin() {
  try {
    const adminEmail = "admin@medipro.com";
    const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (!existing) {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      const org = await prisma.organization.create({
        data: { name: "MediCare Pro Demo", slug: "demo-clinic" }
      });
      await prisma.user.create({
        data: {
          email: adminEmail,
          password: hashedPassword,
          name: "Super Admin",
          role: "ADMIN",
          organizationId: org.id
        }
      });
      console.log("Seeded basic admin: admin@medipro.com / admin123");
    }
  } catch (error) {
    console.error("Seeding failed:", error);
  }
}

async function startServer() {
  await seedAdmin();
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser());
  app.use(cors());

  // --- API ROUTES ---

  // Auth: Register
  app.post("/api/auth/register", async (req, res) => {
    try {
      const registerSchema = z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string().min(2),
        role: z.enum(["ADMIN", "DOCTOR", "RECEPTIONIST", "BILLING_STAFF"]),
        organizationName: z.string().min(2),
      });

      const { email, password, name, role, organizationName } = registerSchema.parse(req.body);

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) return res.status(400).json({ error: "User with this email already exists" });

      const hashedPassword = await bcrypt.hash(password, 10);

      // Create organization and user in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Generate a slug and check if it exists, if so append random suffix
        let slug = organizationName.toLowerCase().replace(/ /g, "-");
        const existingOrg = await tx.organization.findUnique({ where: { slug } });
        if (existingOrg) {
          slug = `${slug}-${Math.floor(Math.random() * 1000)}`;
        }

        const organization = await tx.organization.create({
          data: {
            name: organizationName,
            slug,
          },
        });

        const user = await tx.user.create({
          data: {
            email,
            password: hashedPassword,
            name,
            role,
            organizationId: organization.id,
          },
        });

        return { user, organization };
      });

      console.log(`Registered user: ${result.user.email}`);
      res.status(201).json({ message: "User registered successfully", user: { id: result.user.id, email: result.user.email, role: result.user.role } });
    } catch (error: any) {
      console.error("Registration error:", error);
      if (error instanceof z.ZodError) return res.status(400).json({ error: "Invalid input data", details: error.format() });
      res.status(500).json({ error: "Internal server error during registration", details: error.message });
    }
  });

  // Auth: Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const loginSchema = z.object({
        email: z.string().email(),
        password: z.string(),
      });

      const { email, password } = loginSchema.parse(req.body);

      const user = await prisma.user.findUnique({
        where: { email },
        include: { organization: true },
      });

      if (!user) {
        console.log(`Login attempt failed: User not found (${email})`);
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        console.log(`Login attempt failed: Incorrect password for ${email}`);
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = jwt.sign(
        { userId: user.id, organizationId: user.organizationId, role: user.role },
        JWT_SECRET,
        { expiresIn: "1d" }
      );

      res.cookie("token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production" });
      console.log(`User logged in: ${user.email}`);
      res.json({
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        organization: user.organization,
        token
      });
    } catch (error: any) {
      console.error("Login error:", error);
      if (error instanceof z.ZodError) return res.status(400).json({ error: "Invalid login data" });
      res.status(500).json({ error: "Internal server error during login" });
    }
  });

  // Auth: Logout
  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("token");
    res.json({ message: "Logged out" });
  });

  // Middleware to check auth
  const authenticateToken = (req: any, res: any, next: any) => {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  // Auth: Me
  app.get("/api/auth/me", authenticateToken, async (req: any, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        include: { organization: true },
      });
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json({
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        organization: user.organization
      });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // --- PATIENTS ---
  app.get("/api/patients", authenticateToken, async (req: any, res) => {
    const patients = await prisma.patient.findMany({
      where: { organizationId: req.user.organizationId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(patients);
  });

  app.post("/api/patients", authenticateToken, async (req: any, res) => {
    try {
      const patientSchema = z.object({
        name: z.string().min(1),
        dob: z.string().or(z.date()),
        phone: z.string(),
        email: z.string().email().optional().nullable(),
        diagnosis: z.string().optional().nullable(),
        insuranceId: z.string().optional().nullable(),
        medicalHistory: z.string().optional().nullable(),
      });
      const data = patientSchema.parse(req.body);
      const patient = await prisma.patient.create({
        data: {
          ...data,
          dob: new Date(data.dob),
          organizationId: req.user.organizationId
        }
      });
      res.status(201).json(patient);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // --- APPOINTMENTS ---
  app.get("/api/appointments", authenticateToken, async (req: any, res) => {
    const appointments = await prisma.appointment.findMany({
      where: { organizationId: req.user.organizationId },
      include: { patient: true },
      orderBy: { date: 'asc' }
    });
    res.json(appointments);
  });

  app.post("/api/appointments", authenticateToken, async (req: any, res) => {
    try {
      const appointmentSchema = z.object({
        patientId: z.string(),
        date: z.string().or(z.date()),
        status: z.enum(["UPCOMING", "COMPLETED", "CANCELLED"]),
        notes: z.string().optional().nullable(),
      });
      const data = appointmentSchema.parse(req.body);
      const appointment = await prisma.appointment.create({
        data: {
          ...data,
          date: new Date(data.date),
          organizationId: req.user.organizationId
        }
      });
      res.status(201).json(appointment);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // --- LAB RESULTS ---
  app.get("/api/lab-results", authenticateToken, async (req: any, res) => {
    const results = await prisma.labResult.findMany({
      where: { organizationId: req.user.organizationId },
      include: { patient: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(results);
  });

  // --- PRESCRIPTIONS ---
  app.get("/api/prescriptions", authenticateToken, async (req: any, res) => {
    const prescriptions = await prisma.prescription.findMany({
      where: { organizationId: req.user.organizationId },
      include: { patient: true, doctor: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(prescriptions);
  });

  // --- BILLING & INVOICES ---
  app.get("/api/invoices", authenticateToken, async (req: any, res) => {
    const invoices = await prisma.invoice.findMany({
      where: { organizationId: req.user.organizationId },
      include: { patient: true, items: true, claims: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(invoices);
  });

  app.post("/api/invoices", authenticateToken, async (req: any, res) => {
    try {
      const invoiceSchema = z.object({
        patientId: z.string(),
        items: z.array(z.object({
          description: z.string(),
          amount: z.number()
        })),
        status: z.enum(["PAID", "PENDING", "OVERDUE"])
      });
      const { patientId, items, status } = invoiceSchema.parse(req.body);
      const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

      const invoice = await prisma.invoice.create({
        data: {
          patientId,
          status,
          totalAmount,
          organizationId: req.user.organizationId,
          items: {
            create: items
          }
        },
        include: { items: true }
      });
      res.status(201).json(invoice);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // --- INSURANCE CLAIMS ---
  app.get("/api/claims", authenticateToken, async (req: any, res) => {
    const claims = await prisma.insuranceClaim.findMany({
      where: { organizationId: req.user.organizationId },
      include: { patient: true, invoice: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(claims);
  });

  app.post("/api/claims", authenticateToken, async (req: any, res) => {
    try {
      const claimSchema = z.object({
        invoiceId: z.string(),
        patientId: z.string(),
        status: z.enum(["SUBMITTED", "IN_REVIEW", "APPROVED", "DENIED"]),
      });
      const data = claimSchema.parse(req.body);
      const claim = await prisma.insuranceClaim.create({
        data: {
          ...data,
          organizationId: req.user.organizationId
        }
      });
      res.status(201).json(claim);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // --- REPORTS ---
  app.get("/api/reports/summary", authenticateToken, async (req: any, res) => {
    try {
      const orgId = req.user.organizationId;
      
      const [invoices, claims, patients] = await Promise.all([
        prisma.invoice.findMany({ where: { organizationId: orgId } }),
        prisma.insuranceClaim.findMany({ where: { organizationId: orgId } }),
        prisma.patient.count({ where: { organizationId: orgId } })
      ]);

      const revenueByStatus = {
        PAID: invoices.filter(i => i.status === 'PAID').reduce((sum, i) => sum + i.totalAmount, 0),
        PENDING: invoices.filter(i => i.status === 'PENDING').reduce((sum, i) => sum + i.totalAmount, 0),
        OVERDUE: invoices.filter(i => i.status === 'OVERDUE').reduce((sum, i) => sum + i.totalAmount, 0),
      };

      const claimStats = {
        APPROVED: claims.filter(c => c.status === 'APPROVED').length,
        DENIED: claims.filter(c => c.status === 'DENIED').length,
        IN_REVIEW: claims.filter(c => c.status === 'IN_REVIEW').length,
        SUBMITTED: claims.filter(c => c.status === 'SUBMITTED').length,
      };

      res.json({
        totalPatients: patients,
        totalInvoices: invoices.length,
        totalRevenue: invoices.reduce((sum, i) => sum + i.totalAmount, 0),
        revenueByStatus,
        claimStats
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- AUDIT LOGS ---
  app.get("/api/audit-logs", authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'ADMIN') return res.sendStatus(403);
    const logs = await prisma.auditLog.findMany({
      where: { organizationId: req.user.organizationId },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    res.json(logs);
  });

  async function createAuditLog(organizationId: string, userId: string, action: string, details?: string) {
    await prisma.auditLog.create({
      data: {
        organizationId,
        userId,
        action,
        details
      }
    });
  }

  // --- NOTIFICATIONS ---
  app.get("/api/notifications", authenticateToken, async (req: any, res) => {
    const notifications = await prisma.notification.findMany({
      where: { organizationId: req.user.organizationId, userId: req.user.userId },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    res.json(notifications);
  });

  async function createNotification(organizationId: string, userId: string, title: string, message: string, type: string) {
    await prisma.notification.create({
      data: {
        organizationId,
        userId,
        title,
        message,
        type
      }
    });
  }

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // --- VITE MIDDLEWARE ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
