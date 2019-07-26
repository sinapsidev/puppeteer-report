
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

    
    let HEADER_TEMPLATE = await page.$eval('#header', e => e.innerHTML);
    let FOOTER_TEMPLATE = await page.$eval('#footer', e => e.innerHTML);

  
    await page.evaluate(() => {
      document.querySelector('#header').innerHTML = "";
      document.querySelector('#footer').innerHTML = "";
    });

    const buffer = await page.pdf({
      format: 'A4',
      displayHeaderFooter: true,
      headerTemplate: HEADER_TEMPLATE,
      footerTemplate: FOOTER_TEMPLATE,
      margin: {
        top: '30mm',
        bottom: '30mm'
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
