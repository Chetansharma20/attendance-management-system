import fs from 'fs';
import path from 'path';
import morgan from 'morgan';

const accessLogStream = fs.createWriteStream(
  path.join(process.cwd(), 'access.log'),
  { flags: 'a' }
);

export const setupLogger = (app) => {
  // Log to console for live development feedback
  app.use(morgan('dev'));

  // Log securely to access.log file for persistent audit history
  app.use(morgan('combined', { stream: accessLogStream }));
};
