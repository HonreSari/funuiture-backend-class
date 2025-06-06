import { prisma } from "./prismaClient";

export const createOneProduct = async (data: any) => {
  const productdata: any = {
    name: data.name,
    description: data.description,
    price: data.price,
    discount: data.discount,
    inventory: data.inventory,
    category: {
      connectOrCreate: {
        where: { name: data.category }, // ?can use name to connect or create cause name is unique
        create: { name: data.category },
      },
    },
    type: {
      connectOrCreate: {
        where: { name: data.type }, // ?can use name to connect or create cause name is unique
        create: { name: data.type },
      },
    },
    images: {
      create: data.images,
    },
  };
  if (data.tags && data.tags.length > 0) {
    productdata.tags = {
      connectOrCreate: data.tags.map((tagName: string) => ({
        where: { name: tagName }, // ?can use name to connect or create cause name is unique
        create: { name: tagName },
      })),
    };
  }
  return prisma.product.create({ data : productdata });
};
