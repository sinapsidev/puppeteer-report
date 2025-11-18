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
  path,
  queryParams
}) => {
  
  const idRecord = path?.recordId ?? queryParams?.idRecord;
  
  if (!idRecord) throw new Error('recordId non è presente né nel path né come parametro di ricerca.');
 
  const _domain = `https://${domain}`;
  return `http://localhost:${port}/print/public/index.html?idTemplate=${path.templateId}${typeof idRecord !== 'string' ? '' : `&idRecord=${idRecord}`}&tenantId=${path.tenantId}&domain=${encodeURIComponent(_domain)}`;
};

module.exports = build;
