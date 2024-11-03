// dataloaders.ts
import DataLoader from 'dataloader';
import type { PrismaClient } from '@prisma/client';
import type { User } from '.prisma/client';

// Загрузчик для пользователей, на которых подписан текущий пользователь
export function createUserSubscribedToLoader(prisma: PrismaClient) {
  return new DataLoader<string, User[]>(async (userIds) => {
    // Выполняем один запрос для всех переданных userIds
    const subscriptions = await prisma.subscribersOnAuthors.findMany({
      where: { subscriberId: { in: userIds as string[] } },
      include: { author: true },
    });

    // Группируем подписки по subscriberId
    const subscriptionsByUserId: Record<string, User[]> = {};
    subscriptions.forEach(({ subscriberId, author }) => {
      if (!subscriptionsByUserId[subscriberId]) {
        subscriptionsByUserId[subscriberId] = [];
      }
      subscriptionsByUserId[subscriberId].push(author);
    });

    return userIds.map((userId) => subscriptionsByUserId[userId] || []);
  });
}

// Загрузчик для пользователей, подписанных на текущего пользователя
export function createSubscribedToUserLoader(prisma: PrismaClient) {
  return new DataLoader<string, User[]>(async (userIds) => {
    const subscriptions = await prisma.subscribersOnAuthors.findMany({
      where: { authorId: { in: userIds as string[] } },
      include: { subscriber: true },
    });

    const subscribersByUserId: Record<string, User[]> = {};
    subscriptions.forEach(({ authorId, subscriber }) => {
      if (!subscribersByUserId[authorId]) {
        subscribersByUserId[authorId] = [];
      }
      subscribersByUserId[authorId].push(subscriber);
    });

    return userIds.map((userId) => subscribersByUserId[userId] || []);
  });
}