const build = ({
  port,
  domain,
  tenantId,
  templateId,
  recordId
}) => {
  const _domain = `https://${domain}`;
  return `http://localhost:${port}/public/index.html?idTemplate=${templateId}&idRecord=${recordId}&tenantId=${tenantId}&domain=${encodeURIComponent(_domain)}`;
};

module.exports = build
;
