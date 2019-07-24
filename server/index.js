
const express = require('express')
const puppeteer = require('puppeteer')
const bodyParser = require('body-parser')

const app = express()

app.use(bodyParser.text())

const PORT = process.env.PORT || 5000

app.get('/', function (req, res) {
  res.send('Hello World!')
})

app.post('/print', async (req, res) => {
  try {
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    await page.goto(req.body, {waitUntil: 'domcontentloaded'});

    const FOOTER_TEMPLATE = `
    <div id="header-template" style="font-size:10px !important; color:#808080; padding-left:10px">Pagina <span class="pageNumber"></span> di <span class="totalPages"></span></div>
    `;

    const buffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      footerTemplate: FOOTER_TEMPLATE,
      margin: {
        top: '0mm',
        bottom: '10mm'
      }
    });
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
