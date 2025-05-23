import { faker } from '@faker-js/faker';
import type { NhostSession } from '@nhost/nextjs';
import { rest } from 'msw';

const tokenQuery = rest.post(
  `https://local.auth.local.nhost.run/v1/token`,
  (_req, res, ctx) =>
    res(
      ctx.json<NhostSession>({
        accessToken: faker.string.sample(40),
        refreshToken: faker.string.uuid(),
        accessTokenExpiresIn: 900,
        user: {
          id: faker.string.uuid(),
          createdAt: faker.date.past().toUTCString(),
          displayName: `${faker.name.firstName()} ${faker.name.lastName()}`,
          avatarUrl: faker.image.avatar(),
          locale: 'en',
          isAnonymous: false,
          emailVerified: true,
          defaultRole: 'user',
          roles: ['user', 'me'],
          phoneNumber: null,
          phoneNumberVerified: false,
          activeMfaType: null,
          metadata: {},
        },
      }),
    ),
);

export default tokenQuery;
