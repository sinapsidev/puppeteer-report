'use strict';
(function () {
  const FIRST_INCREMENTAL_PAGE_SIZE = 1000;
  const UIBASEURL = 'ui';
  const DATABASEURL = 'data';
  const FILEBASEURL = 'files';
  const TEMPLATEBASEURL = 'templates';
  const TOT_ROWS_LOCAL_THRESHOLD = 15000;
  const PARALLEL_REQUESTS = 3;
  const AZIONI_BASE_URL = 'azioni';
  const AUTH_BASE_URL = 'auth';
  const MESSAGES_BASE_URL = 'messages';
  const THREADS_BASE_URL = 'threads';
  const ATTACHMENTS_BASE_URL = 'attachments';

  angular.module('reportApp.xdb')
    .constant('xdbApiConstants',
      {
        FIRST_INCREMENTAL_PAGE_SIZE,
        UIBASEURL,
        DATABASEURL,
        FILEBASEURL,
        TEMPLATEBASEURL,
        TOT_ROWS_LOCAL_THRESHOLD,
        PARALLEL_REQUESTS,
        AZIONI_BASE_URL,
        AUTH_BASE_URL,
        MESSAGES_BASE_URL,
        THREADS_BASE_URL,
        ATTACHMENTS_BASE_URL
      }
    );
})();
