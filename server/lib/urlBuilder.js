const build = ({
  domain,
  tenantId,
  templateId,
  recordId
}) => {
  return `${domain}/report/index.html?idTemplate=${templateId}&idRecord=${recordId}&tenantId=${tenantId}`;
};

module.exports = build
;
