
const express = require('express')
const puppeteer = require('puppeteer')
const bodyParser = require('body-parser')

const app = express()

app.use(bodyParser.text())

const PORT = process.env.PORT || 5000

app.get('/', function (req, res) {
  res.send('Hello World!')
})


// bau bau bau
const equalizeFont = (HTML, fontSize) => {
  const correctFontSize = fontSize*0.7;
  return `<div style="font-size: ${correctFontSize}px; width: 100%;">${HTML}</div>`;
}

const getFontSizeInIntByFontSizeInPX = computedHeight => {
  const heightWithoutPX = computedHeight.split("px").join("");
  const heightFloat = parseInt(heightWithoutPX);
  return heightFloat;
};


app.post('/print', async (req, res) => {
  try {
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    await page.goto(req.body, {"waitUntil" : "networkidle0"});

    const HEADER_TEMPLATE = await page.$eval('#header', e => e.innerHTML);
    const FOOTER_TEMPLATE = await page.$eval('#footer', e => e.innerHTML);

    const HEADER_FONT_SIZE_PX = await page.$eval('#header', e => getComputedStyle(e).fontSize);
    const HEADER_FONT_SIZE_INT = getFontSizeInIntByFontSizeInPX(HEADER_FONT_SIZE_PX);
    const FOOTER_FONT_SIZE_PX = await page.$eval('#footer', e => getComputedStyle(e).fontSize);
    const FOOTER_FONT_SIZE_INT = getFontSizeInIntByFontSizeInPX(FOOTER_FONT_SIZE_PX);

    const SBECCO = 25;

    const HEADER_H = await page.$eval('#header', e => e.getBoundingClientRect().height)+SBECCO;
    const FOOTER_H = await page.$eval('#footer', e => e.getBoundingClientRect().height)+SBECCO;

    console.log("HEADER_H", HEADER_H)
    console.log("FOOTER_H", FOOTER_H)

  
    await page.evaluate(() => {
      document.querySelector('#header').innerHTML = "";
      document.querySelector('#footer').innerHTML = "";
    });

    const buffer = await page.pdf({
      format: 'A4',
      displayHeaderFooter: true,
      headerTemplate: equalizeFont(HEADER_TEMPLATE, HEADER_FONT_SIZE_INT),
      footerTemplate: equalizeFont(FOOTER_TEMPLATE, FOOTER_FONT_SIZE_INT),
      margin: {
        top: HEADER_H+'px',
        bottom: FOOTER_H+'px'
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
