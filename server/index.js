
const express = require('express')
const puppeteer = require('puppeteer')
const bodyParser = require('body-parser')

const app = express()

app.use(bodyParser.json())

const PORT = process.env.PORT || 5000

app.get('/', function (req, res) {
  res.send('Hello from Puppeteer Report!')
})

const CSS_RESET = `<style>
html,body,div,span,applet,object,iframe,h1,h2,h3,h4,h5,h6,p,blockquote,pre,a,abbr,acronym,address,big,cite,code,del,dfn,em,img,ins,kbd,q,s,samp,small,strike,strong,sub,sup,tt,var,b,u,i,center,dl,dt,dd,ol,ul,li,fieldset,form,label,legend,table,caption,tbody,tfoot,thead,tr,th,td,article,aside,canvas,details,embed,figure,figcaption,footer,header,hgroup,menu,nav,output,ruby,section,summary,time,mark,audio,video{border:0;font-size:100%;font:inherit;vertical-align:baseline;margin:0;padding:0}article,aside,details,figcaption,figure,footer,header,hgroup,menu,nav,section{display:block}body{line-height:1}ol,ul{list-style:none}blockquote,q{quotes:none}blockquote:before,blockquote:after,q:before,q:after{content:none}table{border-collapse:collapse;border-spacing:0}*{font-family:Arial,Helvetica,sans-serif !important;}
.header-footer-wrapper {
  margin: 0;
  font-family: "Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
  font-size: 0.9rem;
  font-weight: 400;
  line-height: 1.5;
  color: #000;
  text-align: left;
  background-color: #fff;
}
h1, h2, h3, h4, h5, h6,
.h1, .h2, .h3, .h4, .h5, .h6 {
  margin-bottom: 0.5rem;
  font-family: inherit;
  font-weight: 500;
  line-height: 1.2;
  color: inherit; }
h1, .h1 {
  font-size: 26.5px; }
h2, .h2 {
  font-size: 22px; }
h3, .h3 {
  font-size: 20px; }
h4, .h4 {
  font-size: 16px; }
h5, .h5 {
  font-size: 14px; }
h6, .h6 {
  font-size: 13px; }
</style>`

// bau bau bau
const equalizeFont = (HTML, fontSize) => {
  const correctFontSize = fontSize*0.78;
  return `${CSS_RESET}<div class="header-footer-wrapper" style="font-size: ${correctFontSize}px; width: 100%;"><div style="margin: 0 7px;">${HTML}</div></div>`;
}

const getFontSizeInIntByFontSizeInPX = computedHeight => {
  const heightWithoutPX = computedHeight.split("px").join("");
  const heightFloat = parseInt(heightWithoutPX);
  return heightFloat;
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

    const HEADER_TEMPLATE = await page.$eval('#header', e => e.innerHTML);
    const FOOTER_TEMPLATE = await page.$eval('#footer', e => e.innerHTML);

    const HAS_HEADER = !!HEADER_TEMPLATE;
    const HAS_FOOTER = !!FOOTER_TEMPLATE;

    console.log("HEADER_TEMPLATE", HAS_HEADER);
    console.log("FOOTER_TEMPLATE", HAS_FOOTER);

    const HEADER_FONT_SIZE_PX = await page.$eval('#header', e => getComputedStyle(e).fontSize);
    const HEADER_FONT_SIZE_INT = getFontSizeInIntByFontSizeInPX(HEADER_FONT_SIZE_PX);
    const FOOTER_FONT_SIZE_PX = await page.$eval('#footer', e => getComputedStyle(e).fontSize);
    const FOOTER_FONT_SIZE_INT = getFontSizeInIntByFontSizeInPX(FOOTER_FONT_SIZE_PX);

    const HEADER_H = HAS_HEADER ? await page.$eval('#header', e => e.getBoundingClientRect().height) : 0;
    const FOOTER_H = HAS_FOOTER ? await page.$eval('#footer', e => e.getBoundingClientRect().height) : 0;
    
    

    await page.evaluate(() => {
      document.querySelector('#header').innerHTML = "";
      document.querySelector('#footer').innerHTML = "";
    });


    await page.evaluate(() => {
      const BODY_TEMPLATE = document.querySelector('#body').innerHTML;
      document.querySelector('body').innerHTML = `<div style="margin: 0 0px;">${BODY_TEMPLATE}</div>`;

    });

    const HEADER_TEMPLATE_EQUILIZED = equalizeFont(HEADER_TEMPLATE, HEADER_FONT_SIZE_INT);
    const FOOTER_TEMPLATE_EQUILIZED = equalizeFont(FOOTER_TEMPLATE, FOOTER_FONT_SIZE_INT);

    const IS_LANDSCAPE = WIDTH > HEIGHT;

    await page.addStyleTag(
      {'content': `@page {size: ${WIDTH}mm ${HEIGHT}mm ${IS_LANDSCAPE ? "landscape" : ""}}`}
    );

    console.log("IS_LANDSCAPE", IS_LANDSCAPE);
    console.log("WIDTH", WIDTH);
    console.log("HEIGHT", HEIGHT);

    let config = {
      preferCSSPageSize: true,
      printBackground: true,
      margin: {
        top: HEADER_H+'px',
        bottom: FOOTER_H+'px'
      }
    };

    if(HAS_FOOTER || HAS_HEADER){
      config.displayHeaderFooter = true;
    }

    if(HAS_HEADER){
      config.headerTemplate = HEADER_TEMPLATE_EQUILIZED;
    }

    if(HAS_FOOTER){
      config.footerTemplate = FOOTER_TEMPLATE_EQUILIZED;
    }

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
