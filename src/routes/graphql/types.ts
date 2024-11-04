import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLInt,
  GraphQLFloat,
  GraphQLScalarType,
  Kind,
  GraphQLBoolean,
  GraphQLInputObjectType,
  GraphQLList,
} from 'graphql';
import type { MemberType, Post, PrismaClient, Profile, User } from '@prisma/client';
import DataLoader from 'dataloader';

export interface Context {
  prisma: PrismaClient;
  loaders: {
    postsLoader: DataLoader<string, Post[]>;
    memberTypeLoader: DataLoader<string, MemberType>;
    userSubscribedToLoader: DataLoader<string,  User[]>;
    subscribedToUserLoader: DataLoader<string, User[]>;
    profileLoader: DataLoader<string, Profile | null>;
  };
}

export type UserWithRelations = User & {
  userSubscribedTo?: User[];
  subscribedToUser?: User[];
};

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

export const CreateUserInput = new GraphQLInputObjectType({
  name: 'CreateUserInput',
  fields: {
    name: { type: new GraphQLNonNull(GraphQLString) },
    balance: { type: new GraphQLNonNull(GraphQLFloat) },
  }
});

export const ChangeUserInput = new GraphQLInputObjectType({
  name: 'ChangeUserInput',
  fields: {
    name: { type: GraphQLString },
    balance: { type: GraphQLFloat },
  }
});

export const CreatePostInput = new GraphQLInputObjectType({
  name: 'CreatePostInput',
  fields: {
    title: { type: new GraphQLNonNull(GraphQLString) },
    content: { type: new GraphQLNonNull(GraphQLString) },
    authorId: { type: new GraphQLNonNull(UUIDType) },
  }
});

export const ChangePostInput = new GraphQLInputObjectType({
  name: 'ChangePostInput',
  fields: {
    title: { type: GraphQLString },
    content: { type: GraphQLString },
  }
});

export const CreateProfileInput = new GraphQLInputObjectType({
  name: 'CreateProfileInput',
  fields: {
    userId: { type: new GraphQLNonNull(UUIDType) },
    isMale: { type: new GraphQLNonNull(GraphQLBoolean) },
    yearOfBirth: { type: new GraphQLNonNull(GraphQLInt) },
    memberTypeId: { type: new GraphQLNonNull(MemberTypeIdScalar) },
  }
});

export const ChangeProfileInput = new GraphQLInputObjectType({
  name: 'ChangeProfileInput',
  fields: {
    isMale: { type: GraphQLBoolean },
    yearOfBirth: { type: GraphQLInt },
    memberTypeId: { type: MemberTypeIdScalar },
  }
});

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

export const ProfileObject = new GraphQLObjectType({
  name: 'Profile',
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLString) },
    userId: { type: new GraphQLNonNull(GraphQLString) },
    isMale: { type: new GraphQLNonNull(GraphQLBoolean) },
    yearOfBirth: { type: new GraphQLNonNull(GraphQLInt) },
    memberTypeId: { type: new GraphQLNonNull(GraphQLString) },
    memberType: {
      type: MemberTypeObject,
      resolve: async (profile: { memberTypeId: string }, _, context: Context) => {
        return context.loaders.memberTypeLoader.load(profile.memberTypeId);
      }
    },
  }),
});

export const UserObject = new GraphQLObjectType<UserWithRelations, Context>({
  name: 'User',
  fields: () => ({
    id: { type: GraphQLString },
    name: { type: new GraphQLNonNull(GraphQLString) },
    balance: { type: new GraphQLNonNull(GraphQLFloat) },
    profile: {
      type: ProfileObject,
      resolve: async (user, _, context: Context) => {
        return context.loaders.profileLoader.load(user.id);
      }
    },
    posts: {
      type: new GraphQLList(PostObject),
      resolve: async (user, _, context: Context) => {
        return context.loaders.postsLoader.load(user.id);
      },
    },
    userSubscribedTo: {
      type: new GraphQLList(UserObject),
      resolve: async (user, _, context) => {
        if (user.userSubscribedTo) {
          return user.userSubscribedTo;
        }
        return context.loaders.userSubscribedToLoader.load(user.id);
      },
    },
    subscribedToUser: {
      type: new GraphQLList(UserObject),
      resolve: async (user, _, context) => {
        if (user.subscribedToUser) {
          return user.subscribedToUser;
        }
        return context.loaders.subscribedToUserLoader.load(user.id);
      },
    },
  }),
});