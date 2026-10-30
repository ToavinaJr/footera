import { Logger } from '@nestjs/common';
import { createApp } from './app.factory.js';

const logger = new Logger('Server');

async function bootstrap() {
  const app = await createApp();
  const port = process.env.NODE_ENV === 'production'
    ? Number(process.env.PORT) || 3000
    : 3000;
  logger.log(JSON.stringify({ event: 'server:listen', port }));
  await app.listen(port, '0.0.0.0');
}
await bootstrap().catch((error: unknown) => {
  const details = {
    event: 'bootstrap:failed',
    name: error instanceof Error ? error.name : 'UnknownError',
    message: error instanceof Error ? error.message : String(error),
  };
  logger.error(JSON.stringify(details), error instanceof Error ? error.stack : undefined);
  throw error;
});
