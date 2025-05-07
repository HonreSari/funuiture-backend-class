import { PrismaClient, Prisma } from "../generated/prisma";
import * as bcrypt from "bcrypt";
import { faker } from "@faker-js/faker";
const prisma = new PrismaClient();

// const userData: Prisma.UserCreateInput[] = [
//     {
//         phone: '1234567890',
//         password: '',
//         randomToken: 'mdmdsapep2040nd'
//     },
//     {
//         phone: '1234567899',
//         password: '',
//         randomToken: 'alkavsdlael393'
//     },
//     {
//         phone: '1234567892',
//         password: '',
//         randomToken: 'sadlkawe02isl'
//     },
//     {
//         phone: '1234567893',
//         password: '',
//         randomToken: 'ajadld933lsd3'
//     },
//     {
//         phone: '1234567894',
//         password: '',
//         randomToken: 'samflafpeo3sd'
//     }
// ]

function createRandomUser() {
  return {
    phone: faker.phone.number({ style: "international" }),
    password: "",
    randomToken: faker.internet.jwt(),
  };
}

export const users = faker.helpers.multiple(createRandomUser, {
  count: 5,
});

async function main() {
  console.log("Start seeding ...");
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash("1234556654", salt);
  for (const u of users) {
    u.password = hashedPassword;
    await prisma.user.create({
      data: u,
    });
    console.log(`Seeding finished`);
  }
  // console.log('Seeding finished.')
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
