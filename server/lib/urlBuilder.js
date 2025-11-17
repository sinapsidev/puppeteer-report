const buildRecordIdsUrl = function (builderParams) {
  const { port, domain, tenantId, templateId, recordId } = builderParams;

  const isRecordIdAList = () => [...recordId.matchAll(/((?=.*[0-9])(?=.*,).*$)/g)].length > 0;

  if (!isRecordIdAList()) return null;
  
  const encodedDomain = encodeURIComponent(`https://${domain}`);
  const encodedIdsInclusionParam = encodeURIComponent(`%IN=${recordId}`);

  return `http://localhost:${port}/print/public/index.html?idTemplate=${templateId}&idRecord=${encodedIdsInclusionParam}&tenantId=${tenantId}&domain=${encodedDomain}`; 
};

const build = ({
  port,
  domain,
  tenantId,
  templateId,
  recordId
}) => {

  const recordIdsUrl = buildRecordIdsUrl({ port, domain, tenantId, templateId, recordId });
  
  if (typeof recordIdsUrl === "string") return recordIdsUrl;

  const _domain = `https://${domain}`;
  return `http://localhost:${port}/print/public/index.html?idTemplate=${templateId}&idRecord=${recordId}&tenantId=${tenantId}&domain=${encodeURIComponent(_domain)}`;
};

module.exports = build;
