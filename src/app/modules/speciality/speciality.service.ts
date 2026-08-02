import { Specialty } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

interface CacheEntry {
  data: Specialty[];
  expiresAt: number;
}

let cache: CacheEntry | null = null;

const isCacheValid = (): boolean =>
  cache !== null && cache.expiresAt > Date.now();

const invalidateCache = () => {
  cache = null;
};

const createSpecialty = async (payload: Specialty) => {
  const specialty = await prisma.specialty.create({
    data: payload,
  });

  invalidateCache();

  return specialty;
};

const getAllSpecialties = async (): Promise<Specialty[]> => {
  if (isCacheValid()) {
    return cache!.data;
  }

  const specialties = await prisma.specialty.findMany({
    where: { isDeleted: false },
    orderBy: { title: "asc" },
  });

  cache = {
    data: specialties,
    expiresAt: Date.now() + CACHE_TTL_MS,
  };

  return specialties;
};

const deleteSpecialty = async (id: string): Promise<Specialty> => {
  const specialty = await prisma.specialty.delete({
    where: { id },
  });

  invalidateCache();

  return specialty;
};

export const SpecialtyService = {
  createSpecialty,
  getAllSpecialties,
  deleteSpecialty,
};
