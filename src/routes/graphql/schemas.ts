/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable no-useless-catch */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Type } from '@fastify/type-provider-typebox';
import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLList,
  GraphQLNonNull,
  GraphQLInt,
  GraphQLFloat,
  GraphQLBoolean,
  GraphQLInputObjectType
} from 'graphql';
import { Context, MemberTypeIdScalar, MemberTypeObject, PostObject, UUIDType } from './types.js';

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

const ProfileObject = new GraphQLObjectType({
  name: 'Profile',
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLString) },
    userId: { type: new GraphQLNonNull(GraphQLString) },
    isMale: { type: new GraphQLNonNull(GraphQLBoolean) },
    yearOfBirth: { type: new GraphQLNonNull(GraphQLInt) },
    memberTypeId: { type: new GraphQLNonNull(GraphQLString) },
    memberType: {
      type: MemberTypeObject,
      resolve: async (profile, _, context: Context) => {
        return context.loaders.memberTypeLoader.load(profile.memberTypeId);
      }
    },
  }),
});

const UserObject = new GraphQLObjectType({
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

const CreateUserInput = new GraphQLInputObjectType({
  name: 'CreateUserInput',
  fields: {
    name: { type: new GraphQLNonNull(GraphQLString) },
    balance: { type: new GraphQLNonNull(GraphQLFloat) },
  }
});

const ChangeUserInput = new GraphQLInputObjectType({
  name: 'ChangeUserInput',
  fields: {
    name: { type: GraphQLString },
    balance: { type: GraphQLFloat },
  }
});

const CreatePostInput = new GraphQLInputObjectType({
  name: 'CreatePostInput',
  fields: {
    title: { type: new GraphQLNonNull(GraphQLString) },
    content: { type: new GraphQLNonNull(GraphQLString) },
    authorId: { type: new GraphQLNonNull(UUIDType) },
  }
});

const ChangePostInput = new GraphQLInputObjectType({
  name: 'ChangePostInput',
  fields: {
    title: { type: GraphQLString },
    content: { type: GraphQLString },
  }
});

const CreateProfileInput = new GraphQLInputObjectType({
  name: 'CreateProfileInput',
  fields: {
    userId: { type: new GraphQLNonNull(UUIDType) },
    isMale: { type: new GraphQLNonNull(GraphQLBoolean) },
    yearOfBirth: { type: new GraphQLNonNull(GraphQLInt) },
    memberTypeId: { type: new GraphQLNonNull(MemberTypeIdScalar) },
  }
});

const ChangeProfileInput = new GraphQLInputObjectType({
  name: 'ChangeProfileInput',
  fields: {
    isMale: { type: GraphQLBoolean },
    yearOfBirth: { type: GraphQLInt },
    memberTypeId: { type: MemberTypeIdScalar },
  }
});

const QueryType = new GraphQLObjectType<any, Context>({
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
      resolve: async (_, args, context) => {
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
      resolve: async (_, args, context) => {
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
      type: UserObject,
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
      },
      resolve: async (_, args, context) => {
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
      resolve: async (_, args, context) => {
        return await context.prisma.profile.findUnique({
          where: { id: args.id }
        });
      },
    },
  },
});

const MutationType = new GraphQLObjectType<any, Context>({
  name: 'Mutation',
  fields: {
    createUser: {
      type: UserObject,
      args: {
        dto: { type: new GraphQLNonNull(CreateUserInput) }
      },
      resolve: async (_, args, context) => {
        return context.prisma.user.create({
          data: args.dto
        });
      },
    },

    changeUser: {
      type: UserObject,
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
        dto: { type: new GraphQLNonNull(ChangeUserInput) }
      },
      resolve: async (_, args, context) => {
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
      resolve: async (_, args, context) => {
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
      resolve: async (_, args, context) => {
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
      resolve: async (_, args, context) => {
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
      resolve: async (_, args, context) => {
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
      resolve: async (_, args, context) => {
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
      resolve: async (_, args, context) => {
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
      resolve: async (_, args, context) => {
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
      resolve: async (_, args, context) => {
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
      resolve: async (_, args, context) => {
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