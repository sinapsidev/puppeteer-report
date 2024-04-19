const express = require('express');
const { createBullBoard } = require('@bull-board/api');
const { BullAdapter } = require('@bull-board/api/bullAdapter');
const { ExpressAdapter } = require('@bull-board/express');

module.exports = function (printingJobsQueue) {
  if (process.env.NODE_ENV === 'production') { return; }

  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');

  createBullBoard({
    queues: [new BullAdapter(printingJobsQueue)],
    serverAdapter: serverAdapter
  });

  const app = express();

  app.use('/admin/queues', serverAdapter.getRouter());

  app.listen(3000, () => {
    console.log('For the UI, open http://localhost:3000/admin/queues');
  });
}
;
