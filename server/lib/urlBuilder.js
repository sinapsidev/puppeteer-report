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
