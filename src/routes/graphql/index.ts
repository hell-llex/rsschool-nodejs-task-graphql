import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { createGqlResponseSchema, gqlResponseSchema, schema } from './schemas.js';
import { graphql, validate, parse, specifiedRules, GraphQLError, DocumentNode } from 'graphql';
import depthLimit from 'graphql-depth-limit';

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  const { prisma } = fastify;

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
          variableValues: variables,
          contextValue: { prisma },
        });
        return result.errors ? { errors: result.errors } : { data: result.data };
      } catch (err) {
        return { errors: [err] };
      }
    },
  });
};

export default plugin;