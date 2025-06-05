import { prisma } from "./prismaClient";
export type PostArgs = {
  title: string;
  content: string;
  body: string;
  image: string;
  category: string;
  authorId: number;
  type: string;
  tags: string[];
};

export const createOnePost = async (postData: PostArgs) => {
  const data: any = {
    title: postData.title,
    content: postData.content,
    body: postData.body,
    image: postData.image,
    author: {
      connect: { id: postData.authorId },
    },
    category: {
      connectOrCreate: {
        where: { name: postData.category }, // ?can use name to connect or create cause name is unique
        create: { name: postData.category },
      },
    },
    type: {
      connectOrCreate: {
        where: { name: postData.type }, // ?can use name to connect or create cause name is unique
        create: { name: postData.type },
      },
    },
  };
  if (postData.tags && postData.tags.length > 0) {
    data.tags = {
      connectOrCreate: postData.tags.map((tagName) => ({
        where: { name: tagName }, // ?can use name to connect or create cause name is unique
        create: { name: tagName },
      })),
    };
  }
  return prisma.post.create({ data });
};

export const getPostById = async (id: number) => {
  return prisma.post.findUnique({
    where: { id },
  });
};

export const updateOnePost = async (postId: number, postData: PostArgs) => {
  const data: any = {
    title: postData.title,
    content: postData.content,
    body: postData.body,
    category: {
      connectOrCreate: {
        where: { name: postData.category }, // ?can use name to connect or create cause name is unique
        create: { name: postData.category },
      },
    },
    type: {
      connectOrCreate: {
        where: { name: postData.type }, // ?can use name to connect or create cause name is unique
        create: { name: postData.type },
      },
    },
  };

  if (postData.image) {
    data.image = postData.image;
  }
  if (postData.tags && postData.tags.length > 0) {
    data.tags = {
      set: [], // ?drop out the relationship when connect new relationship in the table
      connectOrCreate: postData.tags.map((tagName) => ({
        where: { name: tagName }, // ?can use name to connect or create cause name is unique
        create: { name: tagName },
      })),
    };
  }
  return prisma.post.update({ where: { id: Number(postId) }, data }); //*Number(postId) is use to convert string to number I use the (+postId) before but it is not working in prisma
};

export const deleteOnePost = async (postId: number) => {
  return prisma.post.delete({
    where: { id: postId },
  });
};

export const getPostWithRelations = async (id: number) => {
  return prisma.post.findUnique({
    where: { id },
    // omit: { createdAt : true}  // ? omit is to ingore that not to pull the db when user is call
    select: {
      id: true,
      title: true,
      content: true,
      body: true,
      image: true,
      updatedAt: true,
      author: {
        select: {
          //  firstName: true,
          //  lastName: true,
          fullName: true,
        },
      },
      category: {
        select: {
          name: true,
        },
      },
      type: {
        select: {
          name: true,
        },
      },
      tags: {
        select: {
          name: true,
        },
      },
    },
  });
};

export const getPostList = async (options: any) => {
  return prisma.post.findMany(options);
};
