// types.ts
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
import DataLoader from 'dataloader';

export interface Context {
  prisma: PrismaClient;
  loaders: {
    postsLoader: DataLoader<string, any[]>;
    memberTypeLoader: DataLoader<string, any>;
    userSubscribedToLoader: DataLoader<string, any[]>;
    subscribedToUserLoader: DataLoader<string, any[]>;
    profileLoader: DataLoader<string, any>;
  };
}

// export interface Context {
//   prisma: PrismaClient;
// }

const isUUID = (value: unknown): value is string =>
  typeof value === 'string' &&
  new RegExp('^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$').test(
    value,
  );

export const UUIDType = new GraphQLScalarType({
  name: 'UUID',
  serialize(value) {
    if (!isUUID(value)) {
      throw new TypeError(`Invalid UUID.`);
    }
    return value;
  },
  parseValue(value) {
    if (!isUUID(value)) {
      throw new TypeError(`Invalid UUID.`);
    }
    return value;
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      if (isUUID(ast.value)) {
        return ast.value;
      }
    }
    return undefined;
  },
});

// export const MyUUIDType = new GraphQLScalarType({
//   name: 'UUID',
//   serialize: String,
//   parseValue: String,
//   parseLiteral: (ast: any) => (ast.kind === 'StringValue' ? ast.value : null),
// });

// export interface ExtendedUser extends User {
//   userSubscribedToPreloaded?: boolean;
//   subscribedToUserPreloaded?: boolean;
//   userSubscribedTo?: User[];
//   subscribedToUser?: User[];
// }

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