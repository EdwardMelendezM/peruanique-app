import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "../app/generated/prisma/client";

type SeedGroup = {
  id: string;
  name: string;
  description?: string;
  code?: string;
};

const GROUPS: SeedGroup[] = [
  {
    id: "0204b8ac-26ce-4662-b082-c3d9cd06d2c1",
    name: "Grupo A",
    code: "a",
    description: "Ingeniería y Ciencias Básicas",
  },
  {
    id: "5c54dcc6-1d0e-44db-9b7b-f2922fcc14e1",
    name: "Grupo B",
    code: "b",
    description: "Ciencias de la Salud y de la Vida",
  },
  {
    id: "e4c65e80-84a6-471e-b24d-63bba9ff5957",
    name: "Grupo C",
    code: "c",
    description: "Ciencias Empresariales",
  },
  {
    id: "749631ae-2258-4bb9-9a1d-25de7ab8f586",
    name: "Grupo D",
    code: "d",
    description: "Ciencias Sociales",
  },
];

function createPrismaClient() {
  return new PrismaClient({
    adapter: new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    }),
  });
}

export async function seedGroups(client?: PrismaClient) {
  const prisma = client ?? createPrismaClient();

  try {
    for (const group of GROUPS) {
      await prisma.group.upsert({
        where: { id: group.id },
        update: {
          name: group.name,
          description: group.description,
        },
        create: {
          id: group.id,
          name: group.name,
          description: group.description,
        },
      });
    }

    console.log(`[GROUP_SEED] Seeded ${GROUPS.length} groups`);
  } finally {
    if (!client) {
      await prisma.$disconnect();
    }
  }
}

const isDirectExecution = fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isDirectExecution) {
  seedGroups().catch((error) => {
    console.error("[GROUP_SEED_ERROR]", error);
    process.exit(1);
  });
}

