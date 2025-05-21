import { PrismaClient } from "../../generated/prisma";

const prisma = new PrismaClient();

export const getSettingStatus = async (key: string) => {
  return prisma.setting.findUnique({
    where: { key },
  });
};

export const createOrUpdateSettingStatus = async (key : string , value : string) => {
  return prisma.setting.upsert({    //upsert is useed to create or update a record
   where : { key },
   update : { value},// if the record exists , update the record
   create : { key, value}  // if the record does not exist,create a new record
  });
};
