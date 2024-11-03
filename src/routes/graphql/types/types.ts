/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLInt,
  GraphQLFloat,
  GraphQLScalarType,
  Kind,
} from 'graphql';
import type { PrismaClient } from '@prisma/client';

export const UUIDType = new GraphQLScalarType({
  name: 'UUID',
  serialize: String,
  parseValue: String,
  parseLiteral: (ast: any) => (ast.kind === 'StringValue' ? ast.value : null),
});

export interface Context {
  prisma: PrismaClient;
}

export const MemberTypeObject = new GraphQLObjectType({
  name: 'MemberType',
  fields: {
    id: { type: new GraphQLNonNull(GraphQLString) },
    discount: { type: new GraphQLNonNull(GraphQLFloat) },
    postsLimitPerMonth: { type: new GraphQLNonNull(GraphQLInt) },
  },
});

export const PostObject = new GraphQLObjectType({
  name: 'Post',
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLString) },
    title: { type: new GraphQLNonNull(GraphQLString) },
    content: { type: new GraphQLNonNull(GraphQLString) },
    authorId: { type: new GraphQLNonNull(GraphQLString) },
  }),
});

export const MemberTypeIdScalar = new GraphQLScalarType({
  name: 'MemberTypeId',
  description: 'A string scalar for MemberTypeId',
  serialize(value) {
    return value;
  },
  parseValue(value) {
    return value;
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return ast.value;
    }
    return null;
  },
});