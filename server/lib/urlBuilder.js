const build = ({
  port,
  domain,
  tenantId,
  templateId,
  recordId
}) => {
  return `http://localhost:${port}/public/index.html?idTemplate=${templateId}&idRecord=${recordId}&tenantId=${tenantId}&domain=${encodeURIComponent(domain)}`;
};

module.exports = build
;
