import DataLoader from 'dataloader';
import { PrismaClient, Post, MemberType, Profile, User } from '@prisma/client';

export function createLoaders(prisma: PrismaClient) {
  return {
    postsLoader: new DataLoader<string, Post[]>(async (authorIds) => {
      const posts = await prisma.post.findMany({
        where: {
          authorId: {
            in: [...authorIds],
          },
        },
      });

      return authorIds.map(id => 
        posts.filter(post => post.authorId === id)
      );
    }, { cache: false }),

    memberTypeLoader: new DataLoader<string, MemberType | null>(async (memberTypeIds) => {
      const memberTypes = await prisma.memberType.findMany({
        where: {
          id: {
            in: [...memberTypeIds],
          },
        },
      });

      return memberTypeIds.map(id => 
        memberTypes.find(mt => mt.id === id) ?? null
      );
    }, { cache: false }),

    profileLoader: new DataLoader<string, Profile | null>(async (userIds) => {
      const profiles = await prisma.profile.findMany({
        where: {
          userId: {
            in: [...userIds],
          },
        },
      });

      return userIds.map(id => 
        profiles.find(profile => profile.userId === id) ?? null
      );
    }, { cache: false }),

    userSubscribedToLoader: new DataLoader<string, User[]>(async (subscriberIds) => {
      const subscriptions = await prisma.subscribersOnAuthors.findMany({
        where: {
          subscriberId: {
            in: [...subscriberIds],
          },
        },
        include: {
          author: true,
        },
      });

      return subscriberIds.map(id =>
        subscriptions
          .filter(sub => sub.subscriberId === id)
          .map(sub => sub.author) || []
      );
    }, { cache: false }),

    subscribedToUserLoader: new DataLoader<string, User[]>(async (authorIds) => {
      const subscriptions = await prisma.subscribersOnAuthors.findMany({
        where: {
          authorId: {
            in: [...authorIds],
          },
        },
        include: {
          subscriber: true,
        },
      });

      return authorIds.map(id =>
        subscriptions
          .filter(sub => sub.authorId === id)
          .map(sub => sub.subscriber) || []
      );
    }, { cache: false }),
  };
}