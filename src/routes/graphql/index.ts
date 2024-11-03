import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { createGqlResponseSchema, gqlResponseSchema, schema } from './schemas.js';
import { graphql, validate, parse, specifiedRules, GraphQLError, DocumentNode } from 'graphql';
import depthLimit from 'graphql-depth-limit';
import DataLoader from 'dataloader';
import { Context } from './types.js';
import { createLoaders } from './dataloader.js';

// declare module 'fastify' {
//   interface FastifyInstance {
//     userLoader: ReturnType<typeof createUserSubscribedToLoader>;
//   }
// }

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  const { prisma } = fastify;

  // fastify.decorate('userLoader', createUserSubscribedToLoader(fastify.prisma));
  const context = {
    prisma,
    loaders: createLoaders(prisma)
  };
  // Инициализация загрузчиков
  // const loaders = {
  //   userLoader: new DataLoader(async (userIds: readonly string[]) => {
  //     const users = await prisma.user.findMany({ where: { id: { in: userIds as string[] } } });
  //     return userIds.map((id) => users.find((user) => user.id === id) || null);
  //   }),
  //   subscriberLoader: new DataLoader(async (userIds: readonly string[]) => {
  //     const subscriptions = await prisma.subscribersOnAuthors.findMany({
  //       where: { subscriberId: { in: userIds as string[] } },
  //       include: { author: true },
  //     });
  //     return userIds.map((id) => subscriptions.filter((sub) => sub.subscriberId === id).map((sub) => sub.author));
  //   }),
  // };

  fastify.route({
    url: '/',
    method: 'POST',
    schema: {
      ...createGqlResponseSchema,
      response: {
        200: gqlResponseSchema,
      },
    },
    async handler(req) {
      const query: string = req.body.query;
      const variables = req.body.variables;

      try {
        const documentAST: DocumentNode = parse(query);
        const errors: readonly GraphQLError[] = validate(schema, documentAST, [
          depthLimit(5),
          ...specifiedRules,
        ]);

        if (errors.length > 0) {
          return { errors };
        }

        const result = await graphql({
          schema,
          source: query,
          contextValue: context,
          variableValues: variables
          // variableValues: variables,
          // contextValue: { prisma, userLoader: fastify.userLoader },
        });

        return result.errors ? { errors: result.errors } : { data: result.data };
      } catch (err) {
        return { errors: [err] };
      }
    },
  });
};

export default plugin;