import { Type } from '@fastify/type-provider-typebox';
import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLBoolean,
} from 'graphql';
import { ChangePostInput, ChangeProfileInput, ChangeUserInput, Context, CreatePostInput, CreateProfileInput, CreateUserInput, MemberTypeIdScalar, MemberTypeObject, PostObject, ProfileObject, UserObject, UUIDType } from './types.js';

export const gqlResponseSchema = Type.Partial(
  Type.Object({
    data: Type.Any(),
    errors: Type.Any(),
  })
);

export const createGqlResponseSchema = {
  body: Type.Object(
    {
      query: Type.String(),
      variables: Type.Optional(Type.Record(Type.String(), Type.Any())),
    },
    {
      additionalProperties: false,
    }
  ),
};


const QueryType = new GraphQLObjectType<GraphQLObjectType, Context>({
  name: 'Query',
  fields: {
    memberTypes: {
      type: new GraphQLList(MemberTypeObject),
      resolve: async (_, __, context) => {
        return await context.prisma.memberType.findMany();
      },
    },
    memberType: {
      type: MemberTypeObject,
      args: {
        id: { type: new GraphQLNonNull(MemberTypeIdScalar) },
      },
      resolve: async (_, args: { id: string }, context) => {
        return await context.prisma.memberType.findUnique({
          where: { id: args.id },
        });
      },
    },
    posts: {
      type: new GraphQLList(PostObject),
      resolve: async (_, __, context) => {
        return await context.prisma.post.findMany();
      },
    },
    post: {
      type: PostObject,
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
      },
      resolve: async (_, args: { id: string }, context) => {
        return await context.prisma.post.findUnique({
          where: { id: args.id },
        });
      },
    },
    users: {
      type: new GraphQLList(UserObject),
      resolve: async (_, __, context, info) => {
        const requestedFields = info.fieldNodes[0].selectionSet?.selections
          .map((field) => ('name' in field ? field.name.value : ''))
          .filter(Boolean);

        const include: { userSubscribedTo?: boolean; subscribedToUser?: boolean } = {};

        if (requestedFields?.includes('userSubscribedTo')) {
          include.userSubscribedTo = true;
        }
        if (requestedFields?.includes('subscribedToUser')) {
          include.subscribedToUser = true;
        }

        return await context.prisma.user.findMany({
          include: Object.keys(include).length > 0 ? include : undefined,
        });
      },
    },
    user: {
      type: UserObject as GraphQLObjectType,
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
      },
      resolve: async (_, args: { id: string }, context) => {
        return await context.prisma.user.findUnique({
          where: { id: args.id }
        });
      },
    },
    profiles: {
      type: new GraphQLList(ProfileObject),
      resolve: async (_, __, context) => {
        return await context.prisma.profile.findMany();
      },
    },
    profile: {
      type: ProfileObject,
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
      },
      resolve: async (_, args: { id: string }, context) => {
        return await context.prisma.profile.findUnique({
          where: { id: args.id }
        });
      },
    },
  },
});

const MutationType = new GraphQLObjectType<GraphQLObjectType, Context>({
  name: 'Mutation',
  fields: {
    createUser: {
      type: UserObject as GraphQLObjectType,
      args: {
        dto: { type: new GraphQLNonNull(CreateUserInput) }
      },
      resolve: async (_, args: { dto: { name: string, balance: number } }, context) => {
        return context.prisma.user.create({
          data: args.dto
        });
      },
    },

    changeUser: {
      type: UserObject as GraphQLObjectType,
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
        dto: { type: new GraphQLNonNull(ChangeUserInput) }
      },
      resolve: async (_, args: { id: string, dto: { name?: string, balance?: number } }, context) => {
        return context.prisma.user.update({
          where: { id: args.id },
          data: args.dto
        });
      },
    },

    deleteUser: {
      type: GraphQLBoolean,
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
      },
      resolve: async (_, args: { id: string }, context) => {
        await context.prisma.user.delete({
          where: { id: args.id },
        });
        return true;
      },
    },

    createProfile: {
      type: ProfileObject,
      args: {
        dto: { type: new GraphQLNonNull(CreateProfileInput) }
      },
      resolve: async (_, args: { dto: { userId: string, memberTypeId: string, isMale: boolean, yearOfBirth: number } }, context) => {
        return context.prisma.profile.create({
          data: args.dto
        });
      },
    },

    changeProfile: {
      type: ProfileObject,
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
        dto: { type: new GraphQLNonNull(ChangeProfileInput) }
      },
      resolve: async (_, args: { id: string, dto: { memberTypeId?: string, isMale?: boolean, yearOfBirth?: number } }, context) => {
        return context.prisma.profile.update({
          where: { id: args.id },
          data: args.dto
        });
      },
    },

    deleteProfile: {
      type: GraphQLBoolean,
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
      },
      resolve: async (_, args: { id: string }, context) => {
        await context.prisma.profile.delete({
          where: { id: args.id },
        });
        return true;
      },
    },

    createPost: {
      type: PostObject,
      args: {
        dto: { type: new GraphQLNonNull(CreatePostInput) }
      },
      resolve: async (_, args: { dto: { authorId: string, title: string, content: string } }, context) => {
        return context.prisma.post.create({
          data: args.dto
        });
      },
    },

    changePost: {
      type: PostObject,
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
        dto: { type: new GraphQLNonNull(ChangePostInput) }
      },
      resolve: async (_, args: { id: string, dto: { title?: string, content?: string } }, context) => {
        return context.prisma.post.update({
          where: { id: args.id },
          data: args.dto
        });
      },
    },

    deletePost: {
      type: GraphQLBoolean,
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
      },
      resolve: async (_, args: { id: string }, context) => {
        await context.prisma.post.delete({
          where: { id: args.id },
        });
        return true;
      },
    },

    subscribeTo: {
      type: GraphQLBoolean,
      args: {
        userId: { type: new GraphQLNonNull(UUIDType) },
        authorId: { type: new GraphQLNonNull(UUIDType) },
      },
      resolve: async (_, args: { userId: string, authorId: string }, context) => {
        await context.prisma.subscribersOnAuthors.create({
          data: {
            subscriberId: args.userId,
            authorId: args.authorId,
          },
        });
        return true;
      },
    },

    unsubscribeFrom: {
      type: GraphQLBoolean,
      args: {
        userId: { type: new GraphQLNonNull(UUIDType) },
        authorId: { type: new GraphQLNonNull(UUIDType) },
      },
      resolve: async (_, args: { userId: string, authorId: string }, context) => {
        await context.prisma.subscribersOnAuthors.delete({
          where: {
            subscriberId_authorId: {
              subscriberId: args.userId,
              authorId: args.authorId,
            },
          },
        });
        return true;
      },
    },
  },
});

export const schema = new GraphQLSchema({
  query: QueryType,
  mutation: MutationType,
});