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
} from 'graphql';
import { UUIDType } from './types/uuid.js';
import { Context, MemberTypeIdScalar, MemberTypeObject, PostObject } from './types/types.js';

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
        if (!profile || !profile.memberTypeId) {
          // console.warn(`[Profile.memberType] Profile или memberTypeId отсутствуют для profile с ID: ${profile?.id || 'undefined'}`);
          return null;
        }

        const memberType = await context.prisma.memberType.findUnique({
          where: { id: profile.memberTypeId }
        });

        if (!memberType) {
          // console.warn(`[Profile.memberType] memberType не найден для ID: ${profile.memberTypeId}`);
          return null;
        }

        return memberType;
      }
    },
  }),
});

const UserObject = new GraphQLObjectType({
  name: 'User',
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLString) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    balance: { type: new GraphQLNonNull(GraphQLFloat) },
    profile: {
      type: ProfileObject,
      resolve: async (user, _, context: Context) => {
        const profile = await context.prisma.profile.findUnique({
          where: { userId: user.id }
        });

        if (!profile) {
          // console.warn(`[Query.profile] Профиль не найден для пользователя с ID: ${user.id}`);
          return null;
        }

        return profile;
      }
    },
    posts: {
      type: new GraphQLList(PostObject),
      resolve: async (user, _, context: Context) => {
        try {
          if (!user?.id) {
            // console.warn('[User.posts] User id is undefined');
            return [];
          }

          return context.prisma.post.findMany({
            where: { authorId: user.id },
          });
        } catch (error) {
          // console.error('[User.posts] Error resolving posts:', error);
          throw error;
        }
      },
    },
    userSubscribedTo: {
      type: new GraphQLList(UserObject),
      resolve: async (user, _, context: Context) => {
        try {
          if (!user?.id) {
            // console.warn('[User.userSubscribedTo] User id is undefined');
            return [];
          }

          const subscriptions = await context.prisma.subscribersOnAuthors.findMany({
            where: { subscriberId: user.id },
            include: { author: true },
          });

          return subscriptions.map(sub => sub.author);
        } catch (error) {
          // console.error('[User.userSubscribedTo] Error resolving subscriptions:', error);
          throw error;
        }
      },
    },
    subscribedToUser: {
      type: new GraphQLList(UserObject),
      resolve: async (user, _, context: Context) => {
        try {
          if (!user?.id) {
            // console.warn('[User.subscribedToUser] User id is undefined');
            return [];
          }

          const subscriptions = await context.prisma.subscribersOnAuthors.findMany({
            where: { authorId: user.id },
            include: { subscriber: true },
          });

          return subscriptions.map(sub => sub.subscriber);
        } catch (error) {
          // console.error('[User.subscribedToUser] Error resolving subscribers:', error);
          throw error;
        }
      },
    },
  }),
});

const QueryType = new GraphQLObjectType<any, Context>({
  name: 'Query',
  fields: {
    memberTypes: {
      type: new GraphQLList(MemberTypeObject),
      resolve: async (_, __, context) => {
        try {
          return await context.prisma.memberType.findMany();
        } catch (error) {
          // console.error('[Query.memberTypes] Error resolving memberTypes:', error);
          throw error;
        }
      },
    },
    memberType: {
      type: MemberTypeObject,
      args: {
        id: { type: new GraphQLNonNull(MemberTypeIdScalar) },
      },
      resolve: async (_, args, context) => {
        try {
          const memberType = await context.prisma.memberType.findUnique({
            where: { id: args.id },
          });

          if (!memberType) {
            // console.warn(`[Query.memberType] No memberType found for id: ${args.id}`);
            return null;
          }

          return memberType;
        } catch (error) {
          // console.error('[Query.memberType] Error resolving memberType:', error);
          throw error;
        }
      },
    },
    posts: {
      type: new GraphQLList(PostObject),
      resolve: async (_, __, context) => {
        try {
          return await context.prisma.post.findMany();
        } catch (error) {
          // console.error('[Query.posts] Error resolving posts:', error);
          throw error;
        }
      },
    },
    post: {
      type: PostObject,
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
      },
      resolve: async (_, args, context) => {
        try {
          const post = await context.prisma.post.findUnique({
            where: { id: args.id },
          });

          if (!post) {
            // console.warn(`[Query.post] No post found for id: ${args.id}`);
            return null;
          }

          return post;
        } catch (error) {
          // console.error('[Query.post] Error resolving post:', error);
          throw error;
        }
      },
    },
    users: {
      type: new GraphQLList(UserObject),
      resolve: async (_, __, context) => {
        try {
          return await context.prisma.user.findMany();
        } catch (error) {
          // console.error('[Query.users] Error resolving users:', error);
          throw error;
        }
      },
    },
    user: {
      type: UserObject,
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
      },
      resolve: async (_, args, context) => {
        try {
          const user = await context.prisma.user.findUnique({
            where: { id: args.id }
          });

          if (!user) {
            // console.warn(`[Query.user] No user found for id: ${args.id}`);
            return null;
          }

          return user;
        } catch (error) {
          // console.error('[Query.user] Error resolving user:', error);
          throw error;
        }
      },
    },
    profiles: {
      type: new GraphQLList(ProfileObject),
      resolve: async (_, __, context) => {
        try {
          return await context.prisma.profile.findMany();
        } catch (error) {
          // console.error('[Query.profiles] Error resolving profiles:', error);
          throw error;
        }
      },
    },
    profile: {
      type: ProfileObject,
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
      },
      resolve: async (_, args, context) => {
        try {
          const profile = await context.prisma.profile.findUnique({
            where: { id: args.id }
          });

          if (!profile) {
            // console.warn(`[Query.profile] No profile found for id: ${args.id}`);
            return null;
          }

          return profile;
        } catch (error) {
          // console.error('[Query.profile] Error resolving profile:', error);
          throw error;
        }
      },
    },
  },
});

export const schema = new GraphQLSchema({
  query: QueryType,
});