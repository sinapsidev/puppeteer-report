const build = ({
  domain,
  tenantId,
  templateId,
  recordId,
  v2
}) => {
  if (v2) {
    return `${domain}/report/index.html?idTemplate=${templateId}&idRecord=${recordId}&tenantId=${tenantId}`;
  }
  return `${domain}/#!/${tenantId}/report/${templateId}/${recordId}`;
};

module.exports = build
;
