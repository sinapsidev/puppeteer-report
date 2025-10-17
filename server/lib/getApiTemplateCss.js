  const getApiTemplateCss = async function (templateId) {
        const url = `${apiURLs.getBasePath()}/${TEMPLATE_BASE_URL}/${templateId}`;

        const response = await xdbHttpService
          .fetch({
            method: 'GET',
            url: url
          }).then(function (res) {
            return res.data;
          });
        
        return response.customStyle;
}
      
module.exports = {
    getApiTemplateCss,
}