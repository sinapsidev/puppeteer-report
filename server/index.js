
const express = require('express')
const puppeteer = require('puppeteer')
const bodyParser = require('body-parser')

const app = express()

app.use(bodyParser.json())

const PORT = process.env.PORT || 5000

app.get('/', function (req, res) {
  res.send('Hello from Puppeteer Report!')
})

const CUSTOM_CSS = `
html,body,div,span,applet,object,iframe,h1,h2,h3,h4,h5,h6,p,blockquote,pre,a,abbr,acronym,address,big,cite,code,del,dfn,em,img,ins,kbd,q,s,samp,small,strike,strong,sub,sup,tt,var,b,u,i,center,dl,dt,dd,ol,ul,li,fieldset,form,label,legend,table,caption,tbody,tfoot,thead,tr,th,td,article,aside,canvas,details,embed,figure,figcaption,footer,header,hgroup,menu,nav,output,ruby,section,summary,time,mark,audio,video{border:0;font-size:100%;font:inherit;vertical-align:baseline;margin:0;padding:0}article,aside,details,figcaption,figure,footer,header,hgroup,menu,nav,section{display:block}body{line-height:1}ol,ul{list-style:none}blockquote,q{quotes:none}blockquote:before,blockquote:after,q:before,q:after{content:none}table{border-collapse:collapse;border-spacing:0}*{font-family:Arial,Helvetica,sans-serif !important;}

.document-preview__frame__page-break-after {
  width: 100%;
  border: none;
  cursor: default;
  display: block;
  height: 1px;
  margin-top: 0;
  page-break-after: always !important;
}

/* Styles go here */

.page-header, .page-header-space {
  height: 100px;
}

.page-footer, .page-footer-space {
  height: 50px;

}

.page-footer {
  position: fixed;
  bottom: 0;
  width: 100%;
  border-top: 1px solid black; /* for demo */
  background: yellow; /* for demo */
}

.page-header {
  position: fixed;
  top: 0mm;
  width: 100%;
  border-bottom: 1px solid black; /* for demo */
  background: yellow; /* for demo */
}

.page {
  page-break-after: always;
}

@media print {
  thead {display: table-header-group;} 
  tfoot {display: table-footer-group;}
  button {display: none;}
  body {margin: 0;}
}`

const getHTMLReportFromContent = function(bodyHTML, headerHTML, footerHTML) {
  return `
    <div id="header" class="page-header" style="text-align: center">
      ${headerHTML}
    </div>

    <div id="footer" class="page-footer">
      ${footerHTML}
    </div>

    <table>
      <thead>
        <tr>
          <td>
            <div class="page-header-space"></div>
          </td>
        </tr>
      </thead>
      <tbody id="body">
        <tr>
          <td>
            <div>
              ${bodyHTML}
            </div>
          </td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <td>
            <div class="page-footer-space"></div>
          </td>
        </tr>
      </tfoot>
    </table>
  `;
};

app.post('/print', async (req, res) => {
  try {
    const token = req.query.token;
    if (!token){
      res.status(401)
      res.send()
      console.log("Unauthorized")
      return
    }
    const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-certificate-errors']})
    const page = await browser.newPage()
    await page.goto(req.body.url+"?token="+token, {"waitUntil" : "networkidle0"});
    
    const WIDTH = req.body.width+"mm";
    const HEIGHT = req.body.height+"mm";

    const IS_LANDSCAPE = WIDTH > HEIGHT;

    const PAGE_CSS = `
    @page { size: ${WIDTH} ${HEIGHT} ${(IS_LANDSCAPE ? "landscape" : "")}; }
    ${CUSTOM_CSS}`;

    console.log("PAGE_CSS", PAGE_CSS);

    await page.addStyleTag(
      {'content': PAGE_CSS}
    );

    let config = {
      preferCSSPageSize: true,
      printBackground: true
    };

    const buffer = await page.pdf(config);
    await browser.close()
    res.type('application/pdf')
    res.send(buffer)
  } catch (e) {
    res.status(500)
    res.send(e.message)
  }
})

app.listen(PORT, function () {
  console.log(`Example app listening on port ${PORT}!`)
})
